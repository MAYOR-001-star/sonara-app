import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { CheckoutPayload } from "../types";

interface CheckoutScreenProps {
  onBack: () => void;
  onOrderSuccess: (orderId: string) => void;
  onGoToOrders?: (orderId: string) => void;
  onRequireAuth?: () => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onBack,
  onOrderSuccess,
  onGoToOrders,
  onRequireAuth,
}) => {
  const { lines, subtotal, shipping, vat, grandTotal, clearCart } = useCart();
  const { user, token } = useAuth();

  // Form State
  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("+1 202-555-0136");
  const [address, setAddress] = useState("1137 Williams Avenue");
  const [zip, setZip] = useState("10001");
  const [city, setCity] = useState("New York");
  const [country, setCountry] = useState("United States");
  const [paymentMethod, setPaymentMethod] = useState<"e-Money" | "Cash on Delivery">("e-Money");
  const [eMoneyNumber, setEMoneyNumber] = useState("238521993");
  const [eMoneyPin, setEMoneyPin] = useState("6891");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    grandTotal: number;
    items: typeof lines;
    email: string;
  } | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!user) {
      setError("You must be signed in to check out.");
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email.");
    if (!address.trim()) return setError("Please enter your shipping address.");
    if (!zip.trim()) return setError("Please enter your ZIP code.");
    if (!city.trim()) return setError("Please enter your city.");
    if (!country.trim()) return setError("Please enter your country.");
    if (lines.length === 0) return setError("Your cart is empty.");

    if (paymentMethod === "e-Money") {
      if (!eMoneyNumber || eMoneyNumber.length < 4) {
        return setError("Please enter a valid e-Money number.");
      }
      if (!eMoneyPin || eMoneyPin.length !== 4) {
        return setError("e-Money PIN must be 4 digits.");
      }
    }

    setLoading(true);

    const payload: CheckoutPayload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      zip: zip.trim(),
      city: city.trim(),
      country: country.trim(),
      paymentMethod,
      eMoneyNumber: paymentMethod === "e-Money" ? eMoneyNumber : undefined,
      eMoneyPin: paymentMethod === "e-Money" ? eMoneyPin : undefined,
      lines: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
    };

    try {
      const currentLines = [...lines];
      const res = await api.checkout(payload, token);
      if (res.ok && res.orderId) {
        setConfirmedOrder({
          orderId: res.orderId,
          grandTotal: res.grandTotal || grandTotal,
          items: currentLines,
          email: payload.email,
        });
        clearCart();
      } else {
        setError(res.error || "Order failed. Please check your details.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout network error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Route Guard: Gated for unauthenticated visitors (matching HNG stage 2 /checkout protection)
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CHECKOUT</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.authGateWrapper}>
          <View style={styles.authGateCard}>
            <View style={styles.authGateIconBox}>
              <Ionicons name="lock-closed" size={30} color={colors.primary} />
            </View>
            <Text style={styles.authGateTitle}>Sign In Required</Text>
            <Text style={styles.authGateSub}>
              Guest checkout is disabled to ensure every order is linked to your account with owner-scoped security. Please sign in to complete your purchase.
            </Text>

            {onRequireAuth && (
              <TouchableOpacity
                style={styles.authGateBtn}
                onPress={onRequireAuth}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={18} color={colors.white} />
                <Text style={styles.authGateBtnText}>SIGN IN / CREATE ACCOUNT</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHECKOUT</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Billing Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILLING DETAILS</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Alexei Ward"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="alexei@mail.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+1 202-555-0136"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHIPPING INFO</Text>

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="1137 Williams Avenue"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                value={zip}
                onChangeText={setZip}
                placeholder="10001"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="New York"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="United States"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>

          <Text style={styles.label}>Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.radioOption,
              paymentMethod === "e-Money" && styles.radioOptionSelected,
            ]}
            onPress={() => setPaymentMethod("e-Money")}
          >
            <View style={styles.radioCircle}>
              {paymentMethod === "e-Money" && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>e-Money</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              paymentMethod === "Cash on Delivery" && styles.radioOptionSelected,
            ]}
            onPress={() => setPaymentMethod("Cash on Delivery")}
          >
            <View style={styles.radioCircle}>
              {paymentMethod === "Cash on Delivery" && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>Cash on Delivery</Text>
          </TouchableOpacity>

          {paymentMethod === "e-Money" && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.row}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.label}>e-Money Number</Text>
                  <TextInput
                    style={styles.input}
                    value={eMoneyNumber}
                    onChangeText={setEMoneyNumber}
                    keyboardType="numeric"
                    placeholder="238521993"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>e-Money PIN</Text>
                  <TextInput
                    style={styles.input}
                    value={eMoneyPin}
                    onChangeText={setEMoneyPin}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    placeholder="6891"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>SUMMARY</Text>
          {lines.map((l) => (
            <View key={l.id} style={styles.summaryItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {l.name}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ${l.price.toLocaleString("en-US")}
                </Text>
              </View>
              <Text style={styles.summaryItemQty}>x{l.quantity}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>SUBTOTAL</Text>
            <Text style={styles.calcVal}>${subtotal.toLocaleString("en-US")}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>SHIPPING</Text>
            <Text style={styles.calcVal}>${shipping.toLocaleString("en-US")}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>VAT (INCLUDED)</Text>
            <Text style={styles.calcVal}>${vat.toLocaleString("en-US")}</Text>
          </View>
          <View style={[styles.calcRow, { marginTop: 12 }]}>
            <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
            <Text style={styles.grandTotalVal}>${grandTotal.toLocaleString("en-US")}</Text>
          </View>

          <TouchableOpacity
            style={styles.payBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.payBtnText}>CONTINUE & PAY</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={!!confirmedOrder} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.checkIconCircle}>
              <Ionicons name="checkmark" size={32} color={colors.white} />
            </View>
            <Text style={styles.confirmTitle}>THANK YOU FOR YOUR ORDER</Text>
            <Text style={styles.confirmSub}>
              Your order has been recorded in Supabase. A receipt has been prepared for {confirmedOrder?.email}.
            </Text>

            {/* Order Items Preview */}
            {confirmedOrder && confirmedOrder.items.length > 0 && (
              <View style={styles.confirmItemsBox}>
                <View style={styles.confirmFirstItem}>
                  <View style={styles.confirmItemInfo}>
                    <Text style={styles.confirmItemName} numberOfLines={1}>
                      {confirmedOrder.items[0].name}
                    </Text>
                    <Text style={styles.confirmItemPrice}>
                      ${confirmedOrder.items[0].price.toLocaleString("en-US")}
                    </Text>
                  </View>
                  <Text style={styles.confirmItemQty}>
                    x{confirmedOrder.items[0].quantity}
                  </Text>
                </View>

                {confirmedOrder.items.length > 1 && (
                  <View style={styles.confirmMoreDivider}>
                    <Text style={styles.confirmMoreText}>
                      and {confirmedOrder.items.length - 1} other item{confirmedOrder.items.length > 2 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.refBox}>
              <Text style={styles.refLabel}>ORDER REFERENCE</Text>
              <Text style={styles.refValue}>{confirmedOrder?.orderId}</Text>
            </View>

            <View style={styles.grandTotalBox}>
              <Text style={styles.gtLabel}>GRAND TOTAL</Text>
              <Text style={styles.gtVal}>
                ${(confirmedOrder?.grandTotal || 0).toLocaleString("en-US")}
              </Text>
            </View>

            <View style={{ gap: 10, width: "100%" }}>
              {onGoToOrders && (
                <TouchableOpacity
                  style={styles.ordersBtn}
                  onPress={() => {
                    const oid = confirmedOrder!.orderId;
                    setConfirmedOrder(null);
                    onGoToOrders(oid);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="receipt-outline" size={16} color={colors.white} />
                  <Text style={styles.ordersBtnText}>VIEW IN MY ORDERS</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => {
                  const oid = confirmedOrder!.orderId;
                  setConfirmedOrder(null);
                  onOrderSuccess(oid);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.homeBtnText}>BACK TO HOME</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: fonts.sans,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    fontFamily: fonts.sans,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  radioOptionSelected: {
    borderColor: colors.primary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 1,
    marginBottom: 16,
  },
  summaryItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryItemName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  summaryItemPrice: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  summaryItemQty: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calcLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "700",
  },
  calcVal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 1,
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },
  payBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  payBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmModal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  checkIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    lineHeight: 26,
    marginBottom: 10,
  },
  confirmSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  refBox: {
    backgroundColor: colors.lightGray,
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  refLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
    marginBottom: 4,
  },
  refValue: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 1,
  },
  grandTotalBox: {
    backgroundColor: colors.ink,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  gtLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "700",
    marginBottom: 4,
  },
  gtVal: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.white,
  },
  confirmItemsBox: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  confirmFirstItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  confirmItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  confirmItemName: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  confirmItemPrice: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  confirmItemQty: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  confirmMoreDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(19, 19, 19, 0.08)",
    marginTop: 10,
    paddingTop: 8,
    alignItems: "center",
  },
  confirmMoreText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
  },
  ordersBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ordersBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  homeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  homeBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  authGateWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  authGateCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  authGateIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(201, 138, 82, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  authGateTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 6,
    textAlign: "center",
  },
  authGateSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  authGateBtn: {
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    width: "100%",
  },
  authGateBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
