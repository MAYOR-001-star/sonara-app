import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "./AuthContext";
import type { CartLine, Product } from "../types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CartContextType {
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  vat: number;
  grandTotal: number;
  isRealtimeConnected: boolean;
  lastSyncedAt: Date | null;
  addItem: (product: Product | Omit<CartLine, "quantity">, quantity?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // 1. Fetch cart directly from Supabase "cart_items" table
  const fetchCartFromDatabase = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[CartContext] Error fetching from cart_items table:", error.message);
        return;
      }

      if (data) {
        const mappedLines: CartLine[] = data.map((row) => ({
          id: row.product_id,
          name: row.product_name,
          slug: row.product_slug || row.product_id,
          price: Number(row.unit_price),
          quantity: Number(row.quantity),
          accent: (row.accent as "peach" | "mist" | "ink") || "peach",
        }));
        setLines(mappedLines);
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error("[CartContext] Database fetch failed:", err);
    }
  }, []);

  // 2. Auth changes: load DB cart when user signs in, wipe on sign out
  useEffect(() => {
    if (!user?.id) {
      setLines([]);
      setLastSyncedAt(null);
      return;
    }

    fetchCartFromDatabase(user.id);
  }, [user?.id, fetchCartFromDatabase]);

  // 3. Shared Realtime subscription on cart_items table
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("cart_items_realtime_shared")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
        },
        () => {
          if (user?.id) {
            fetchCartFromDatabase(user.id);
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, fetchCartFromDatabase]);

  // 4. Add item -> Upsert directly to Supabase "cart_items" table
  const addItem = async (product: Product | Omit<CartLine, "quantity">, quantity = 1) => {
    const qty = Math.min(10, Math.max(1, quantity));

    if (!user?.id) {
      setLines((prev) => {
        const existing = prev.find((l) => l.id === product.id);
        if (existing) {
          return prev.map((l) =>
            l.id === product.id ? { ...l, quantity: Math.min(10, l.quantity + qty) } : l
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            quantity: qty,
            accent: product.accent || "peach",
          },
        ];
      });
      return;
    }

    // Optimistic in-memory update
    const existing = lines.find((l) => l.id === product.id);
    const targetQty = existing ? Math.min(10, existing.quantity + qty) : qty;

    setLines((prev) => {
      if (existing) {
        return prev.map((l) => (l.id === product.id ? { ...l, quantity: targetQty } : l));
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          quantity: targetQty,
          accent: product.accent || "peach",
        },
      ];
    });

    try {
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: user.id,
          product_id: product.id,
          product_name: product.name,
          product_slug: product.slug || product.id,
          unit_price: product.price,
          quantity: targetQty,
          accent: product.accent || "peach",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" }
      );

      if (error) {
        console.error("[CartContext] Upsert into cart_items failed:", error.message);
      } else {
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error("[CartContext] Upsert network error:", err);
    }
  };

  // 5. Remove item -> Delete from Supabase "cart_items" table
  const removeItem = async (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));

    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", id);

      if (error) {
        console.error("[CartContext] Delete failed:", error.message);
      } else {
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error("[CartContext] Delete network error:", err);
    }
  };

  // 6. Update quantity -> Update in Supabase "cart_items" table
  const updateQuantity = async (id: string, quantity: number) => {
    const clampedQty = Math.max(1, Math.min(10, quantity));

    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, quantity: clampedQty } : l))
    );

    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({
          quantity: clampedQty,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("product_id", id);

      if (error) {
        console.error("[CartContext] Update quantity failed:", error.message);
      } else {
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error("[CartContext] Update quantity network error:", err);
    }
  };

  // 7. Clear cart -> Delete all user's rows from Supabase "cart_items" table
  const clearCart = async () => {
    setLines([]);

    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("[CartContext] Clear failed:", error.message);
      } else {
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error("[CartContext] Clear network error:", err);
    }
  };

  // 8. Manual sync trigger
  const syncNow = async () => {
    if (user?.id) {
      await fetchCartFromDatabase(user.id);
    }
  };

  const count = useMemo(() => lines.reduce((acc, l) => acc + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((acc, l) => acc + l.price * l.quantity, 0), [lines]);
  const shipping = lines.length > 0 ? 50 : 0;
  const vat = Math.round(subtotal * 0.2);
  const grandTotal = lines.length > 0 ? subtotal + vat + shipping : 0;

  return (
    <CartContext.Provider
      value={{
        lines,
        count,
        subtotal,
        shipping,
        vat,
        grandTotal,
        isRealtimeConnected,
        lastSyncedAt,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        syncNow,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
