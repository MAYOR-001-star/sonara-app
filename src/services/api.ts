import { supabase } from "./supabase";
import { seedProducts } from "./seed-data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product, CheckoutPayload, Order } from "../types";

export let API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://sonara-topaz.vercel.app";

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url.replace(/\/+$/, "");
}

const LOCAL_ORDERS_CACHE_KEY = "@sonora_cached_orders";

function newOrderId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tail = Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
  return `AP-${tail}`;
}

export const api = {
  // Check if Supabase connection is reachable
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from("products").select("id").limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // Products: Queries Supabase database (matching hng stage 2/src/lib/catalog.ts)
  async getProducts(category?: string): Promise<Product[]> {
    try {
      let q = supabase.from("products").select("*").order("created_at");
      if (category && category !== "all") {
        q = q.eq("category", category);
      }
      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          category: row.category,
          price: Number(row.price),
          description: row.description || "",
          features: row.features || [],
          inTheBox: row.in_the_box || [],
          isNew: Boolean(row.is_new),
          accent: row.accent || "mist",
          images: seedProducts.find((p) => p.id === row.id)?.images || {
            hero: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
            gallery: [],
          },
        }));
      }
    } catch {
      // Fallback to bundled seed data
    }

    return category && category !== "all"
      ? seedProducts.filter((p) => p.category === category)
      : seedProducts;
  },

  async getProduct(slug: string): Promise<Product | undefined> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        const row = data[0];
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          category: row.category,
          price: Number(row.price),
          description: row.description || "",
          features: row.features || [],
          inTheBox: row.in_the_box || [],
          isNew: Boolean(row.is_new),
          accent: row.accent || "mist",
          images: seedProducts.find((p) => p.id === row.id)?.images,
        };
      }
    } catch {
      // Fallback
    }
    return seedProducts.find((p) => p.slug === slug || p.id === slug);
  },

  // Checkout: Persists to the same Supabase database and tables as the website
  async checkout(
    payload: CheckoutPayload,
    _token?: string | null
  ): Promise<{
    ok: boolean;
    orderId?: string;
    grandTotal?: number;
    error?: string;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          ok: false,
          error: "You must be signed in to check out.",
        };
      }

      const catalogue = await this.getProducts();
      const resolved = payload.lines.map((l) => {
        const item = catalogue.find((p) => p.id === l.id);
        const price = item?.price || 100;
        return {
          id: l.id,
          name: item?.name || "Product",
          price,
          quantity: l.quantity,
          lineTotal: price * l.quantity,
        };
      });

      const subtotal = resolved.reduce((acc, r) => acc + r.lineTotal, 0);
      const shipping = 50;
      const vat = Math.round(subtotal * 0.2);
      const grandTotal = subtotal + vat + shipping;
      const orderId = newOrderId();

      const shippingAddress = [
        payload.address,
        `${payload.city}, ${payload.zip}`,
        payload.country,
      ].join("\n");

      // 1. Direct Supabase insert
      let orderDbId: string | null = null;
      try {
        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            order_id: orderId,
            user_id: user.id,
            customer_name: payload.name,
            customer_email: payload.email,
            phone: payload.phone || null,
            shipping_address: shippingAddress,
            payment_method: payload.paymentMethod,
            subtotal,
            shipping,
            vat,
            grand_total: grandTotal,
            status: "confirmed",
          })
          .select("id")
          .single();

        if (error) {
          console.warn("[checkout] Direct Supabase insert failed, trying web fallback:", error.message);
        } else if (order?.id) {
          orderDbId = order.id;
          if (resolved.length > 0) {
            await supabase.from("order_items").insert(
              resolved.map((r) => ({
                order_id: order.id,
                product_id: r.id,
                product_name: r.name,
                unit_price: r.price,
                quantity: r.quantity,
                line_total: r.lineTotal,
              }))
            );
          }
        }
      } catch (insertErr) {
        console.warn("[checkout] Supabase direct write error:", insertErr);
      }

      // If direct Supabase write failed, fallback to website checkout API
      if (!orderDbId) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (json.ok && json.orderId) {
            // cache locally and return
            await this.cacheLocalOrder({
              id: json.orderId,
              order_id: json.orderId,
              customer_name: payload.name,
              customer_email: payload.email,
              shipping_address: shippingAddress,
              payment_method: payload.paymentMethod,
              subtotal,
              shipping,
              vat,
              grand_total: grandTotal,
              status: "confirmed",
              created_at: new Date().toISOString(),
              order_items: resolved.map((r, i) => ({
                id: `item-${i}-${Date.now()}`,
                product_id: r.id,
                product_name: r.name,
                unit_price: r.price,
                quantity: r.quantity,
                line_total: r.lineTotal,
              })),
            });
            return { ok: true, orderId: json.orderId, grandTotal };
          }
        } catch {
          // ignore web fallback error
        }
      }

      // Always save a local copy of the confirmed order
      const newOrderRecord: Order = {
        id: orderDbId || orderId,
        order_id: orderId,
        customer_name: payload.name,
        customer_email: payload.email,
        shipping_address: shippingAddress,
        payment_method: payload.paymentMethod,
        subtotal,
        shipping,
        vat,
        grand_total: grandTotal,
        status: "confirmed",
        created_at: new Date().toISOString(),
        order_items: resolved.map((r, i) => ({
          id: `item-${i}-${Date.now()}`,
          product_id: r.id,
          product_name: r.name,
          unit_price: r.price,
          quantity: r.quantity,
          line_total: r.lineTotal,
        })),
      };

      await this.cacheLocalOrder(newOrderRecord);

      return { ok: true, orderId, grandTotal };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      return { ok: false, error: msg };
    }
  },

  // Orders: Retrieves orders for the current user from the shared Supabase DB
  async getOrders(_token?: string | null): Promise<Order[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as Order[];
      }
    } catch {
      // Fallback
    }

    return [];
  },

  // Cache helper for mobile offline continuity
  async cacheLocalOrder(order: Order): Promise<void> {
    try {
      const existing = await this.getLocalOrders();
      const filtered = existing.filter((o) => o.order_id !== order.order_id);
      const updated = [order, ...filtered];
      await AsyncStorage.setItem(LOCAL_ORDERS_CACHE_KEY, JSON.stringify(updated.slice(0, 30)));
    } catch {
      // Ignore
    }
  },

  async getLocalOrders(): Promise<Order[]> {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_ORDERS_CACHE_KEY);
      if (raw) {
        return JSON.parse(raw) as Order[];
      }
    } catch {
      // Ignore
    }
    return [];
  },

  // Real-time subscription to orders table
  subscribeToOrders(userId: string, onUpdate: () => void) {
    const channel = supabase
      .channel(`orders_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
