import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useCart } from "../context/CartContext";
import { seedProducts, storeArt } from "../services/seed-data";
import type { Product, Category } from "../types";

interface ProductDetailScreenProps {
  product: Product;
  onBack: () => void;
  onOpenCart: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCategory?: (category: Category) => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onBack,
  onOpenCart,
  onSelectProduct,
  onSelectCategory,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, count } = useCart();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  const related = seedProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(seedProducts.filter((p) => p.id !== product.id && p.category !== product.category))
    .slice(0, 3);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2500);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerBackBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.category.toUpperCase()}
        </Text>

        <TouchableOpacity onPress={onOpenCart} style={styles.headerCartBtn} activeOpacity={0.7}>
          <Ionicons name="cart-outline" size={22} color={colors.ink} />
          {count > 0 && (
            <View style={styles.headerCartBadge}>
              <Text style={styles.headerCartBadgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Added Toast */}
      {added && (
        <TouchableOpacity
          style={styles.toast}
          onPress={onOpenCart}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.ink} />
          <Text style={styles.toastText}>
            Added {quantity}x to cart! Tap to view
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Product Showcase Box */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images?.hero }}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Details Header */}
        <View style={styles.detailsBlock}>
          {product.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW PRODUCT</Text>
            </View>
          )}

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDesc}>{product.description}</Text>
          <Text style={styles.productPrice}>
            ${product.price.toLocaleString("en-US")}
          </Text>
        </View>

        {/* Gallery Strip matching hng stage 2 */}
        {product.images?.gallery && product.images.gallery.length > 0 && (
          <View style={styles.galleryStripSection}>
            <View style={styles.galleryStackedCol}>
              {product.images.gallery.slice(0, 2).map((src, i) => (
                <View key={i} style={styles.gallerySmallCard}>
                  <Image source={{ uri: src }} style={styles.galleryImg} resizeMode="contain" />
                </View>
              ))}
            </View>
            {product.images.gallery[2] && (
              <View style={styles.galleryLargeCard}>
                <Image source={{ uri: product.images.gallery[2] }} style={styles.galleryImg} resizeMode="contain" />
              </View>
            )}
          </View>
        )}

        {/* Features Section */}
        {product.features && product.features.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>FEATURES</Text>
            {product.features.map((feat, index) => (
              <View key={index} style={styles.featureItemRow}>
                <Ionicons name="volume-high-outline" size={16} color={colors.primary} style={{ marginTop: 3 }} />
                <Text style={styles.featText}>{feat}</Text>
              </View>
            ))}
          </View>
        )}

        {/* In the Box Section */}
        {product.inTheBox && product.inTheBox.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>IN THE BOX</Text>
            <View style={styles.boxList}>
              {product.inTheBox.map((item, index) => (
                <View key={index} style={styles.boxRow}>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.boxQty}>1x</Text>
                  </View>
                  <Text style={styles.boxName}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* You May Also Like */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>YOU MAY ALSO LIKE</Text>
            <View style={styles.relatedGrid}>
              {related.map((rel) => (
                <View key={rel.id} style={styles.relatedCard}>
                  <View style={styles.relatedCardTop}>
                    <View style={styles.relatedImgBox}>
                      <Image
                        source={{ uri: rel.images?.hero }}
                        style={styles.relatedImg}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.relatedName} numberOfLines={1}>{rel.name}</Text>
                    <Text style={styles.relatedPrice}>${rel.price.toLocaleString("en-US")}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.relatedBtn}
                    activeOpacity={0.85}
                    onPress={() => onSelectProduct?.(rel)}
                  >
                    <Text style={styles.relatedBtnText} numberOfLines={1} ellipsizeMode="clip">
                      SEE PRODUCT
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About Section matching website */}
        <View style={styles.aboutSection}>
          <View style={styles.aboutImageContainer}>
            <Image
              source={{ uri: storeArt.model }}
              style={styles.aboutImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.aboutTitle}>
            BRINGING YOU THE <Text style={{ color: colors.accent }}>BEST</Text> AUDIO GEAR
          </Text>
          <Text style={styles.aboutText}>
            Located at the heart of New York City, Sonora is the premier store for
            high end headphones, earphones, speakers, and audio accessories. We have a
            large showroom and luxury demonstration rooms available for you to browse
            and experience a wide range of our products.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset }]}>
        <View style={styles.bottomPriceBox}>
          <Text style={styles.bottomPriceLabel}>Total Price</Text>
          <Text style={styles.bottomPriceVal}>
            ${(product.price * quantity).toLocaleString("en-US")}
          </Text>
        </View>

        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={styles.stepperBtn}
          >
            <Text style={styles.stepperBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperVal}>{quantity}</Text>
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.min(10, q + 1))}
            style={styles.stepperBtn}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <Ionicons name="cart" size={18} color={colors.white} />
          <Text style={styles.addToCartBtnText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  topHeader: {
    height: 54,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  headerCartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginRight: -4,
  },
  headerCartBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  headerCartBadgeText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  toast: {
    position: "absolute",
    top: 64,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontWeight: "800",
    fontSize: 13,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: colors.mist,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginBottom: 14,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  thumbnailBox: {
    flex: 1,
    height: 72,
    backgroundColor: colors.mist,
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
  },
  detailsBlock: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  newBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(201, 138, 82, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 10,
  },
  newBadgeText: {
    fontFamily: fonts.sans,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  productName: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    lineHeight: 30,
    marginBottom: 12,
  },
  productDesc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  productPrice: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
  },
  sectionBlock: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 1,
    marginBottom: 16,
  },
  featureItemRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  featText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  boxList: {
    gap: 12,
  },
  boxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBadge: {
    backgroundColor: colors.mist,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  boxQty: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
  boxName: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  relatedSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  relatedGrid: {
    flexDirection: "row",
    gap: 8,
  },
  relatedCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 8,
    paddingBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "space-between",
  },
  relatedCardTop: {
    width: "100%",
    alignItems: "center",
  },
  relatedImgBox: {
    width: "100%",
    height: 84,
    backgroundColor: colors.mist,
    borderRadius: 8,
    marginBottom: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedImg: {
    width: "100%",
    height: "100%",
  },
  relatedName: {
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  relatedPrice: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  relatedBtn: {
    backgroundColor: colors.ink,
    height: 32,
    paddingHorizontal: 2,
    borderRadius: 6,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  relatedBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  tilesSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  tilesHeading: {
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  tilesGrid: {
    flexDirection: "row",
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tileImg: {
    width: 44,
    height: 44,
    marginBottom: 6,
  },
  tileTitle: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 1,
    marginBottom: 2,
  },
  tileLink: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceBox: {
    marginRight: 4,
  },
  bottomPriceLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
  },
  bottomPriceVal: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mist,
    borderRadius: 8,
    paddingHorizontal: 4,
    height: 42,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperBtnText: {
    fontFamily: fonts.sans,
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  stepperVal: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    minWidth: 20,
    textAlign: "center",
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    height: 42,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addToCartBtnText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1,
  },
  /* Gallery matching website */
  galleryStripSection: {
    gap: 16,
    marginBottom: 24,
  },
  galleryStackedCol: {
    gap: 16,
  },
  gallerySmallCard: {
    height: 180,
    backgroundColor: colors.mist,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  galleryLargeCard: {
    height: 280,
    backgroundColor: colors.mist,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  galleryImg: {
    width: "100%",
    height: "100%",
  },
  /* About section */
  aboutSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  aboutImageContainer: {
    width: "100%",
    height: 240,
    backgroundColor: colors.mist,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  aboutImage: {
    width: "100%",
    height: "100%",
  },
  aboutTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 14,
    lineHeight: 28,
  },
  aboutText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
