import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onOpenCart: () => void;
  onOpenAuthOrAccount: () => void;
  onOpenSearch?: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenAuthOrAccount,
  onOpenSearch,
  onGoHome,
}) => {
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.8} onPress={onGoHome} style={styles.logoContainer}>
        <Text style={styles.logo}>
          sonora<Text style={styles.logoDot}>.</Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.rightActions}>
        {/* Quick Search */}
        {onOpenSearch && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenSearch}
            style={styles.iconButton}
            accessibilityLabel="Search catalog"
          >
            <Ionicons name="search-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Cart Icon with badge */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenCart}
          style={styles.cartButton}
          accessibilityLabel="Shopping Cart"
        >
          <Ionicons name="cart-outline" size={22} color={colors.white} />
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Profile / Auth */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenAuthOrAccount}
          style={styles.authButton}
          accessibilityLabel="User Account"
        >
          <Ionicons
            name={user ? "person-circle-outline" : "person-outline"}
            size={22}
            color={user ? colors.primary : colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  logoContainer: {
    paddingVertical: 6,
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -0.5,
  },
  logoDot: {
    color: colors.accent,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconButton: {
    padding: 4,
  },
  authButton: {
    padding: 4,
  },
  cartButton: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 9,
    fontWeight: "800",
  },
});
