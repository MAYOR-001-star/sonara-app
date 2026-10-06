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

const WEBSOCKET_CHANNEL = "audiophile_cart_websocket_sync";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Send cart over WebSocket to other devices
  const broadcastCart = useCallback((updatedLines: CartLine[]) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "cart_sync",
        payload: { lines: updatedLines },
      });
    }
  }, []);

  // 1. Fetch from database on startup/login
  const fetchCartFromDatabase = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
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
    } catch {
      // Ignore initial fetch errors
    }
  }, []);

  // 2. React to Auth changes
  useEffect(() => {
    if (user?.id) {
      fetchCartFromDatabase(user.id);
    }
  }, [user?.id, fetchCartFromDatabase]);

  // 3. Connect to Supabase WebSocket channel
  useEffect(() => {
    const channel = supabase.channel(WEBSOCKET_CHANNEL, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "cart_sync" }, ({ payload }) => {
        if (payload?.lines && Array.isArray(payload.lines)) {
          setLines(payload.lines);
          setLastSyncedAt(new Date());
        }
      })
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
  }, []);

  // 4. Add item
  const addItem = async (product: Product | Omit<CartLine, "quantity">, quantity = 1) => {
    const qty = Math.min(10, Math.max(1, quantity));

    setLines((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      let updated: CartLine[];
      if (existing) {
        updated = prev.map((l) =>
          l.id === product.id ? { ...l, quantity: Math.min(10, l.quantity + qty) } : l
        );
      } else {
        updated = [
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
      }

      // 1. Broadcast immediately over WebSocket
      broadcastCart(updated);

      // 2. Persist to database in background
      if (user?.id) {
        const itemToSave = updated.find((l) => l.id === product.id);
        if (itemToSave) {
          supabase
            .from("cart_items")
            .upsert(
              {
                user_id: user.id,
                product_id: itemToSave.id,
                product_name: itemToSave.name,
                product_slug: itemToSave.slug || itemToSave.id,
                unit_price: itemToSave.price,
                quantity: itemToSave.quantity,
                accent: itemToSave.accent || "peach",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,product_id" }
            )
            .then(() => {});
        }
      }

      return updated;
    });

    setLastSyncedAt(new Date());
  };

  // 5. Remove item
  const removeItem = async (id: string) => {
    setLines((prev) => {
      const updated = prev.filter((l) => l.id !== id);

      // 1. Broadcast immediately over WebSocket
      broadcastCart(updated);

      // 2. Delete from database in background
      if (user?.id) {
        supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id)
          .then(() => {});
      }

      return updated;
    });

    setLastSyncedAt(new Date());
  };

  // 6. Update quantity
  const updateQuantity = async (id: string, quantity: number) => {
    const clampedQty = Math.max(1, Math.min(10, quantity));

    setLines((prev) => {
      const updated = prev.map((l) => (l.id === id ? { ...l, quantity: clampedQty } : l));

      // 1. Broadcast immediately over WebSocket
      broadcastCart(updated);

      // 2. Update in database in background
      if (user?.id) {
        supabase
          .from("cart_items")
          .update({
            quantity: clampedQty,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("product_id", id)
          .then(() => {});
      }

      return updated;
    });

    setLastSyncedAt(new Date());
  };

  // 7. Clear cart
  const clearCart = async () => {
    // 1. Immediate local clear
    setLines([]);

    // 2. Broadcast empty cart immediately over WebSocket
    broadcastCart([]);

    // 3. Clear database table in background
    if (user?.id) {
      supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .then(() => {});
    }

    setLastSyncedAt(new Date());
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
