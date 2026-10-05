import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
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
  addItem: (product: Product | Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  syncNow: () => void;
}

// Matches the exact storage key used by the shop website (hng stage 2/src/store/cart-store.ts)
const WEB_CART_STORAGE_KEY = "audiophile-cart";
const MOBILE_STORAGE_KEY = "@sonora_mobile_cart";

function parseCartLines(raw: string | null): CartLine[] | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    // Zustand persist wrapper format: { state: { lines: [...] }, version: 0 }
    if (data?.state?.lines && Array.isArray(data.state.lines)) {
      return data.state.lines;
    }
    // Direct array format
    if (Array.isArray(data)) {
      return data;
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

function serializeCartLines(lines: CartLine[]): string {
  // Save in Zustand persist middleware format so the website reads it seamlessly
  return JSON.stringify({
    state: { lines },
    version: 0,
  });
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastRawRef = useRef<string | null>(null);

  // 1. Initial cart load & continuous localStorage sync with website
  useEffect(() => {
    const checkWebCart = () => {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(WEB_CART_STORAGE_KEY);
        if (raw && raw !== lastRawRef.current) {
          lastRawRef.current = raw;
          const parsed = parseCartLines(raw);
          if (parsed) {
            setLines(parsed);
            setLastSyncedAt(new Date());
          }
        }
      }
    };

    // Immediate check
    checkWebCart();

    // Check async storage for native mobile
    if (Platform.OS !== "web") {
      AsyncStorage.getItem(MOBILE_STORAGE_KEY).then((raw) => {
        const parsed = parseCartLines(raw);
        if (parsed) {
          setLines(parsed);
          setLastSyncedAt(new Date());
        }
      });
    }

    // On Web: poll and listen to window storage event for instant cross-tab / website sync
    let interval: ReturnType<typeof setInterval> | null = null;
    let handleStorage: ((e: StorageEvent) => void) | null = null;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      // Storage event triggers instantly when another tab / website window mutates localStorage
      handleStorage = (e: StorageEvent) => {
        if (e.key === WEB_CART_STORAGE_KEY && e.newValue) {
          lastRawRef.current = e.newValue;
          const parsed = parseCartLines(e.newValue);
          if (parsed) {
            setLines(parsed);
            setLastSyncedAt(new Date());
          }
        }
      };
      window.addEventListener("storage", handleStorage);

      // Fast interval polling ensures instant appearance even without cross-tab storage event
      interval = setInterval(checkWebCart, 400);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (handleStorage && typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  // 2. Realtime Broadcast channel via Supabase for remote / cross-device synchronization
  useEffect(() => {
    const channelName = user?.id ? `cart_sync_${user.id}` : `audiophile-cart-sync`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "cart_updated" }, ({ payload }) => {
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
  }, [user?.id]);

  // 3. Helper to write back to website localStorage and broadcast
  const saveAndBroadcast = (updatedLines: CartLine[]) => {
    const serialized = serializeCartLines(updatedLines);
    lastRawRef.current = serialized;

    // Save to website's localStorage key
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(WEB_CART_STORAGE_KEY, serialized);
    } else {
      AsyncStorage.setItem(MOBILE_STORAGE_KEY, serialized).catch(() => {});
    }

    // Broadcast via Supabase Realtime
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "cart_updated",
        payload: { lines: updatedLines, timestamp: Date.now() },
      });
    }

    setLastSyncedAt(new Date());
  };

  const addItem = (product: Product | Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      let updated: CartLine[];
      if (existing) {
        updated = prev.map((l) =>
          l.id === product.id ? { ...l, quantity: Math.min(10, l.quantity + quantity) } : l
        );
      } else {
        const newLine: CartLine = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          quantity: Math.min(10, quantity),
          accent: product.accent || "peach",
        };
        updated = [...prev, newLine];
      }

      saveAndBroadcast(updated);
      return updated;
    });
  };

  const removeItem = (id: string) => {
    setLines((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      saveAndBroadcast(updated);
      return updated;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setLines((prev) => {
      const updated = prev.map((l) =>
        l.id === id ? { ...l, quantity: Math.max(1, Math.min(10, quantity)) } : l
      );
      saveAndBroadcast(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setLines([]);
    saveAndBroadcast([]);
  };

  const syncNow = () => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(WEB_CART_STORAGE_KEY);
      const parsed = parseCartLines(raw);
      if (parsed) {
        setLines(parsed);
        setLastSyncedAt(new Date());
      }
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
