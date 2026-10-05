import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { Order } from "../types";

interface AccountScreenProps {
  onClose?: () => void;
  onOpenAuth?: () => void;
  onExploreShop?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onClose,
  onOpenAuth,
  onExploreShop,
}) => {
  const { user, token, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModal, setSelectedModal] = useState<"support" | "privacy" | "terms" | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders(token);
      setOrders(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      fetchOrders().finally(() => setLoadingOrders(false));

      // Subscribe to realtime orders updates in Supabase
      const unsubscribe = api.subscribeToOrders(user.id, () => {
        fetchOrders();
      });

      return () => {
        unsubscribe();
      };
    } else {
      setOrders([]);
    }
  }, [user, token]);

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Route Guard: Gated for unauthenticated visitors (matching HNG stage 2 /account protection)
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>MY ACCOUNT</Text>
          </View>

          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.gateWrapper}>
          <View style={styles.guestCard}>
            <View style={styles.guestIconBox}>
              <Ionicons name="lock-closed" size={30} color={colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Sign In Required</Text>
            <Text style={styles.guestSub}>
              Account details and order history are protected. Sign in with your Sonora account to view your past purchases and receipts.
            </Text>

            {onOpenAuth && (
              <TouchableOpacity
                style={styles.signInPrimaryBtn}
                onPress={onOpenAuth}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={18} color={colors.white} />
                <Text style={styles.signInPrimaryBtnText}>SIGN IN / CREATE ACCOUNT</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>MY ACCOUNT</Text>
        </View>

        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile or Guest Sign-in Card */}
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {(user.fullName || user.email || "S")[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName}>{user.fullName || "Sonora Member"}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.uidBadge}>
              <Ionicons name="finger-print-outline" size={12} color={colors.textMuted} />
              <Text style={styles.uidText} numberOfLines={1}>
                {user.id}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={async () => {
                await signOut();
                if (onClose) onClose();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color={colors.danger} />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconBox}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Sonora Audiophile Account</Text>
            <Text style={styles.guestSub}>
              Sign in with Supabase Auth to track orders, access receipts, and sync your audio cart.
            </Text>

            {onOpenAuth && (
              <TouchableOpacity
                style={styles.signInPrimaryBtn}
                onPress={onOpenAuth}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={18} color={colors.white} />
                <Text style={styles.signInPrimaryBtnText}>SIGN IN / CREATE ACCOUNT</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Orders Section */}
        <View style={styles.ordersSection}>
          <View style={styles.ordersHeaderRow}>
            <Text style={styles.sectionTitle}>ORDER HISTORY</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshIconBtn}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={styles.refreshIconText}>Sync</Text>
            </TouchableOpacity>
          </View>

          {loadingOrders ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loaderText}>Connecting to Supabase orders...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptyText}>
                {user
                  ? "You haven't placed any orders yet. Browse our catalog to find studio reference sound."
                  : "Sign in to see your past orders, or place a new order today."}
              </Text>

              {onExploreShop && (
                <TouchableOpacity
                  style={styles.exploreBtn}
                  onPress={onExploreShop}
                  activeOpacity={0.85}
                >
                  <Text style={styles.exploreBtnText}>EXPLORE GEAR</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            orders.map((o) => (
              <View key={o.id || o.order_id} style={styles.orderCard}>
                <View style={styles.orderCardHeader}>
                  <View>
                    <View style={styles.orderRefRow}>
                      <Ionicons name="cube-outline" size={16} color={colors.primary} />
                      <Text style={styles.orderRef}>{o.order_id}</Text>
                    </View>
                    <Text style={styles.orderDate}>
                      {new Date(o.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{o.status.toUpperCase()}</Text>
                  </View>
                </View>

                {o.order_items && o.order_items.length > 0 && (
                  <View style={styles.itemsPreview}>
                    {o.order_items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                        <Text style={styles.itemLineText} numberOfLines={1}>
                          {item.product_name}
                        </Text>
                        <Text style={styles.itemLineTotal}>
                          ${(item.line_total || item.unit_price * item.quantity).toLocaleString("en-US")}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.orderDivider} />

                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.paymentMethodText}>
                      Paid via {o.payment_method}
                    </Text>
                    {o.shipping_address ? (
                      <Text style={styles.shippingPreview} numberOfLines={1}>
                        Ships to: {o.shipping_address.split("\n")[0]}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalVal}>
                      ${Number(o.grand_total).toLocaleString("en-US")}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* =========================================================================
            SHOWROOM & DEMO FACILITY (From Brand Footer)
        ========================================================================= */}
        <View style={styles.showroomCard}>
          <View style={styles.showroomIdBadge}>
            <Ionicons name="business-outline" size={14} color={colors.accent} />
            <Text style={styles.showroomIdText}>FLAGSHIP SHOWROOM</Text>
          </View>
          <Text style={styles.showroomTitle}>Experience Sonora in Person</Text>
          <Text style={styles.showroomDesc}>
            Sonora is an all-in-one stop to fulfil your audio needs. We are a small team of music
            lovers and sound specialists devoted to helping you get the most out of your audio.
          </Text>
          <View style={styles.showroomDetailRow}>
            <Ionicons name="time-outline" size={16} color={colors.ink} />
            <Text style={styles.showroomDetailText}>Demo Facility Open 7 Days a Week • NYC</Text>
          </View>
        </View>

        {/* =========================================================================
            SUPPORT & LEGAL SECTION (Native Mobile Replacement for Web Footer)
        ========================================================================= */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>SUPPORT & LEGAL</Text>

          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setSelectedModal("support")}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="chatbubbles-outline" size={18} color={colors.ink} />
              </View>
              <Text style={styles.menuItemText}>Customer Support & Sound Advice</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuItemDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setSelectedModal("privacy")}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="shield-outline" size={18} color={colors.ink} />
              </View>
              <Text style={styles.menuItemText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuItemDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setSelectedModal("terms")}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="document-text-outline" size={18} color={colors.ink} />
              </View>
              <Text style={styles.menuItemText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================================================================
            SOCIAL CHANNELS & COPYRIGHT
        ========================================================================= */}
        <View style={styles.communitySection}>
          <Text style={styles.communityTitle}>CONNECT WITH SONORA</Text>
          <View style={styles.socialRow}>
            <View style={styles.socialPill}>
              <Ionicons name="logo-facebook" size={16} color={colors.ink} />
              <Text style={styles.socialText}>Facebook</Text>
            </View>
            <View style={styles.socialPill}>
              <Ionicons name="logo-twitter" size={16} color={colors.ink} />
              <Text style={styles.socialText}>Twitter</Text>
            </View>
            <View style={styles.socialPill}>
              <Ionicons name="logo-instagram" size={16} color={colors.ink} />
              <Text style={styles.socialText}>Instagram</Text>
            </View>
          </View>

          <Text style={styles.appVersionText}>Sonora Mobile App v1.0.0</Text>
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} Sonora Audio Store. All Rights Reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Info / Legal Modal */}
      {selectedModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedModal === "support" && "Customer Support"}
                {selectedModal === "privacy" && "Privacy Policy"}
                {selectedModal === "terms" && "Terms of Service"}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedModal(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedModal === "support" && (
                <View style={styles.modalTextWrap}>
                  <Text style={styles.modalParagraph}>
                    Need assistance with sound calibration, order shipments, or warranty coverage?
                  </Text>
                  <Text style={styles.modalSubheading}>Email Support</Text>
                  <Text style={styles.modalHighlight}>support@sonora.audio</Text>
                  <Text style={styles.modalSubheading}>Flagship Demonstration Rooms</Text>
                  <Text style={styles.modalParagraph}>
                    Visit our listening studios in SoHo, New York. Open 10:00 AM – 7:00 PM EST daily.
                  </Text>
                  <Text style={styles.modalSubheading}>Warranty & Replacements</Text>
                  <Text style={styles.modalParagraph}>
                    All Sonora headphones and speakers include a 2-year international audiophile warranty.
                  </Text>
                </View>
              )}

              {selectedModal === "privacy" && (
                <View style={styles.modalTextWrap}>
                  <Text style={styles.modalParagraph}>
                    At Sonora, we respect your privacy. All checkout transactions, authentication tokens,
                    and customer profiles are securely encrypted through Supabase Row-Level Security (RLS).
                  </Text>
                  <Text style={styles.modalSubheading}>1. Information We Collect</Text>
                  <Text style={styles.modalParagraph}>
                    We only collect email addresses, shipping destinations, and order items necessary
                    to fulfill your audio purchases.
                  </Text>
                  <Text style={styles.modalSubheading}>2. Data Security</Text>
                  <Text style={styles.modalParagraph}>
                    Your passwords are cryptographically hashed and never stored in plain text.
                  </Text>
                </View>
              )}

              {selectedModal === "terms" && (
                <View style={styles.modalTextWrap}>
                  <Text style={styles.modalParagraph}>
                    By purchasing from Sonora Audio Store, you agree to our standard terms of sale:
                  </Text>
                  <Text style={styles.modalSubheading}>1. Shipping & Delivery</Text>
                  <Text style={styles.modalParagraph}>
                    Standard tracked courier shipping is applied to all domestic and international shipments.
                  </Text>
                  <Text style={styles.modalSubheading}>2. 30-Day In-Ear / Over-Ear Audition</Text>
                  <Text style={styles.modalParagraph}>
                    Experience studio sound in your own environment. Return in pristine condition within 30 days for a full refund.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarLetter: {
    fontFamily: fonts.display,
    fontSize: 26,
    fontWeight: "900",
    color: colors.white,
  },
  userName: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  uidBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
    maxWidth: "85%",
  },
  uidText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(214, 69, 69, 0.3)",
    backgroundColor: "rgba(214, 69, 69, 0.04)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutBtnText: {
    fontFamily: fonts.sans,
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  gateWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  guestCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  guestIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(201, 138, 82, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  guestTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 6,
    textAlign: "center",
  },
  guestSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  signInPrimaryBtn: {
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    width: "100%",
  },
  signInPrimaryBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  ordersSection: {
    marginTop: 4,
  },
  ordersHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 1,
  },
  refreshIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshIconText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  loaderBox: {
    backgroundColor: colors.white,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  loaderText: {
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: colors.white,
    padding: 36,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  exploreBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderRefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  orderRef: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 0.5,
  },
  orderDate: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 0,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 1.5,
  },
  itemsPreview: {
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemQuantity: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    width: 24,
  },
  itemLineText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.ink,
    fontWeight: "600",
  },
  itemLineTotal: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 8,
  },
  orderDivider: {
    height: 1,
    backgroundColor: "rgba(19, 19, 19, 0.06)",
    marginBottom: 10,
  },
  orderFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  paymentMethodText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  shippingPreview: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: 180,
    marginTop: 2,
  },
  totalLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
  },
  totalVal: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "900",
    color: colors.primary,
  },

  /* SHOWROOM */
  showroomCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  showroomIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  showroomIdText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 1,
  },
  showroomTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 6,
  },
  showroomDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  showroomDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.mist,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  showroomDetailText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },

  /* SETTINGS / MENU */
  settingsSection: {
    marginTop: 24,
  },
  menuGroup: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    marginTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 60,
  },

  /* COMMUNITY & COPYRIGHT */
  communitySection: {
    marginTop: 28,
    alignItems: "center",
  },
  communityTitle: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  socialPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  socialText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  appVersionText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: 4,
  },
  copyrightText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
  },

  /* MODAL */
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalTextWrap: {
    gap: 12,
  },
  modalParagraph: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalSubheading: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 6,
  },
  modalHighlight: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
});
