import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export type TabKey = "home" | "catalog" | "cart" | "account";

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { count } = useCart();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 8);

  const tabs: {
    key: TabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
    badge?: number;
  }[] = [
    {
      key: "home",
      label: "Discover",
      icon: "home-outline",
      activeIcon: "home",
    },
    {
      key: "catalog",
      label: "Catalog",
      icon: "grid-outline",
      activeIcon: "grid",
    },
    {
      key: "cart",
      label: "Cart",
      icon: "cart-outline",
      activeIcon: "cart",
      badge: count,
    },
    {
      key: "account",
      label: user ? "Account" : "Sign In",
      icon: "person-outline",
      activeIcon: "person",
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomInset,
          height: 56 + bottomInset,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? colors.primary : "rgba(255, 255, 255, 0.45)"}
              />
              {!!tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>

            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 6,
    position: "relative",
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    position: "relative",
  },
  iconContainer: {
    position: "relative",
    width: 32,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  tabLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.45)",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: colors.white,
    fontWeight: "800",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
