import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
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
  addItem: (
    product: Product | Omit<CartLine, "quantity">,
    quantity?: number,
  ) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const WEBSOCKET_CHANNEL = "audiophile_cart_websocket_sync";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const linesRef = useRef<CartLine[]>([]);
  linesRef.current = lines;

  const isConnectedRef = useRef(false);
  isConnectedRef.current = isRealtimeConnected;

  const pendingBroadcastRef = useRef<CartLine[] | null>(null);

  // Send cart over WebSocket to other devices
  const broadcastCart = useCallback((updatedLines: CartLine[]) => {
    if (channelRef.current && isConnectedRef.current) {
      channelRef.current
        .send({
          type: "broadcast",
          event: "cart_sync",
          payload: { lines: updatedLines },
        })
        .then((status) => {
          if (status !== "ok") {
            console.warn("[WebSocket Cart Sync] Mobile broadcast status:", status);
          }
        })
        .catch((err) => {
          console.error("[WebSocket Cart Sync] Mobile broadcast send error:", err);
        });
    } else {
      // Queue broadcast to flush as soon as channel is SUBSCRIBED
      pendingBroadcastRef.current = updatedLines;
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setLines([]);
        setLastSyncedAt(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Connect to Supabase WebSocket Realtime Channel
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
      .on("broadcast", { event: "cart_request" }, () => {
        // Another peer requested current cart (e.g. web just opened)
        if (linesRef.current.length > 0 && channel) {
          channel.send({
            type: "broadcast",
            event: "cart_sync",
            payload: { lines: linesRef.current },
          });
        }
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
          isConnectedRef.current = true;

          // Flush any pending broadcast
          if (pendingBroadcastRef.current) {
            channel.send({
              type: "broadcast",
              event: "cart_sync",
              payload: { lines: pendingBroadcastRef.current },
            });
            pendingBroadcastRef.current = null;
          } else if (linesRef.current.length === 0) {
            // Ask peers (e.g. web) for the existing cart
            channel.send({
              type: "broadcast",
              event: "cart_request",
              payload: {},
            });
          }
        } else if (
          status === "CLOSED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          setIsRealtimeConnected(false);
          isConnectedRef.current = false;
          if (err) {
            console.warn("[WebSocket Cart Sync] Mobile connection status:", status, err);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      setIsRealtimeConnected(false);
      isConnectedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // 4. Add item
  const addItem = async (
    product: Product | Omit<CartLine, "quantity">,
    quantity = 1,
  ) => {
    const qty = Math.min(10, Math.max(1, quantity));
    const current = linesRef.current;
    const existing = current.find((l) => l.id === product.id);

    let updated: CartLine[];
    let itemToSave: CartLine;

    if (existing) {
      const newQty = Math.min(10, existing.quantity + qty);
      itemToSave = { ...existing, quantity: newQty };
      updated = current.map((l) => (l.id === product.id ? itemToSave : l));
    } else {
      itemToSave = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        quantity: qty,
        accent: product.accent || "peach",
      };
      updated = [...current, itemToSave];
    }

    setLines(updated);
    setLastSyncedAt(new Date());

    // 1. Broadcast immediately over WebSocket
    broadcastCart(updated);

    // 2. Persist to database in background if user is logged in
    if (user?.id) {
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
          { onConflict: "user_id,product_id" },
        )
        .then(() => {});
    }
  };

  // 5. Remove item
  const removeItem = async (id: string) => {
    const updated = linesRef.current.filter((l) => l.id !== id);
    setLines(updated);
    setLastSyncedAt(new Date());

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
  };

  // 6. Update quantity
  const updateQuantity = async (id: string, quantity: number) => {
    const clampedQty = Math.max(1, Math.min(10, quantity));
    const updated = linesRef.current.map((l) =>
      l.id === id ? { ...l, quantity: clampedQty } : l,
    );

    setLines(updated);
    setLastSyncedAt(new Date());

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
  };

  // 7. Clear cart
  const clearCart = async () => {
    setLines([]);
    setLastSyncedAt(new Date());

    // 1. Broadcast empty cart immediately over WebSocket
    broadcastCart([]);

    // 2. Clear database table in background
    if (user?.id) {
      supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .then(() => {});
    }
  };

  // 8. Manual sync trigger
  const syncNow = async () => {
    if (user?.id) {
      await fetchCartFromDatabase(user.id);
    } else if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "cart_request",
        payload: {},
      });
    }
  };

  const count = useMemo(
    () => lines.reduce((acc, l) => acc + l.quantity, 0),
    [lines],
  );
  const subtotal = useMemo(
    () => lines.reduce((acc, l) => acc + l.price * l.quantity, 0),
    [lines],
  );
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
