import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useCart } from "../context/CartContext";
import { seedProducts } from "../services/seed-data";

interface CartScreenProps {
  onClose: () => void;
  onGoToCheckout: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onClose,
  onGoToCheckout,
}) => {
  const {
    lines,
    count,
    subtotal,
    grandTotal,
    isRealtimeConnected,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const getProductImage = (id: string) => {
    const prod = seedProducts.find((p) => p.id === id);
    return (
      prod?.images?.hero ||
      "https://sonara-topaz.vercel.app/category/headphones/xx99-mark-ii.svg"
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Cart ({count})</Text>
          <View
            style={[
              styles.syncBadge,
              isRealtimeConnected
                ? styles.syncBadgeConnected
                : styles.syncBadgeConnecting,
            ]}
          >
            <View
              style={[
                styles.syncDot,
                isRealtimeConnected
                  ? styles.syncDotConnected
                  : styles.syncDotConnecting,
              ]}
            />
            <Text
              style={[
                styles.syncBadgeText,
                isRealtimeConnected
                  ? styles.syncTextConnected
                  : styles.syncTextConnecting,
              ]}
            >
              {isRealtimeConnected ? "Live Sync" : "Syncing"}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {lines.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.removeAllText}>Remove all</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cart Content */}
      {lines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.itemList}>
            {lines.map((line) => (
              <View key={line.id} style={styles.itemRow}>
                <View style={styles.itemImageBox}>
                  <Image
                    source={{ uri: getProductImage(line.id) }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {line.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${line.price.toLocaleString("en-US")}
                  </Text>
                </View>

                {/* Stepper & Remove */}
                <View style={styles.actionColumn}>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(line.id, line.quantity - 1)}
                      style={styles.stepperBtn}
                    >
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{line.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(line.id, line.quantity + 1)}
                      style={styles.stepperBtn}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(line.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer Total & Checkout */}
          <View style={styles.footer}>
            <View style={styles.costBreakdown}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Subtotal</Text>
                <Text style={styles.costVal}>${subtotal.toLocaleString("en-US")}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Shipping</Text>
                <Text style={styles.costVal}>$50</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>VAT (20% Included)</Text>
                <Text style={styles.costVal}>${Math.round(subtotal * 0.2).toLocaleString("en-US")}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GRAND TOTAL</Text>
                <Text style={styles.totalVal}>${grandTotal.toLocaleString("en-US")}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={onGoToCheckout}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.tan,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  syncBadgeConnected: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  syncBadgeConnecting: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncDotConnected: {
    backgroundColor: "#10b981",
  },
  syncDotConnecting: {
    backgroundColor: "#f59e0b",
  },
  syncBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  syncTextConnected: {
    color: "#065f46",
  },
  syncTextConnecting: {
    color: "#92400e",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    textTransform: "uppercase",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  removeAllText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "rgba(19, 19, 19, 0.4)",
    textTransform: "uppercase",
  },
  closeBtn: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 18,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: "rgba(19, 19, 19, 0.5)",
  },
  continueBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  continueBtnText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  itemList: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.tan,
    gap: 14,
  },
  itemImageBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.mist,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(19, 19, 19, 0.5)",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mist,
  },
  stepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepperBtnText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(19, 19, 19, 0.4)",
  },
  stepperVal: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    minWidth: 16,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.tan,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(19, 19, 19, 0.5)",
    textTransform: "uppercase",
  },
  actionColumn: {
    alignItems: "flex-end",
    gap: 6,
  },
  removeBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  removeBtnText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(19, 19, 19, 0.4)",
    textTransform: "uppercase",
  },
  costBreakdown: {
    marginBottom: 16,
    gap: 8,
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  costLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  costVal: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(19, 19, 19, 0.08)",
    marginVertical: 4,
  },
  totalVal: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },
  checkoutBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  checkoutBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
