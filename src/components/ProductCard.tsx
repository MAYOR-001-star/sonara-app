import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onQuickAdd: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onQuickAdd,
}) => {
  const imageUrl = product.images?.hero;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
          />
        ) : null}
        {product.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW PRODUCT</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>
          ${product.price.toLocaleString("en-US")}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.viewButtonText}>SEE DETAILS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={onQuickAdd}
            activeOpacity={0.8}
            accessibilityLabel={`Add ${product.name} to cart`}
          >
            <Ionicons name="cart-outline" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    height: 220,
    backgroundColor: colors.lightGray,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  newBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  newBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  content: {
    padding: 18,
  },
  category: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    lineHeight: 24,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  viewButton: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  quickAddButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
