import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { storeArt, categoryArt, seedProducts } from "../services/seed-data";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import type { Product, Category } from "../types";

const { width } = Dimensions.get("window");

interface HomeScreenProps {
  onSelectProduct: (product: Product) => void;
  onSelectCategory?: (category: Category) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectProduct,
  onSelectCategory,
}) => {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>(seedProducts);

  useEffect(() => {
    let mounted = true;
    const fetchLiveProducts = async () => {
      try {
        const live = await api.getProducts();
        if (mounted && live && live.length > 0) {
          setProducts(live);
        }
      } catch {
        // Fallback to seedProducts
      }
    };

    fetchLiveProducts();

    const unsubscribe = api.subscribeToProducts(() => {
      fetchLiveProducts();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const heroProduct = products[0] || seedProducts[0];
  const featured = products.slice(1, 4);
  const zx9 = products.find((p) => p.slug.includes("zx9") || p.id.includes("zx9")) || seedProducts[3];
  const zx7 = products.find((p) => p.slug.includes("zx7") || p.id.includes("zx7")) || seedProducts[4];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* =========================================================================
          HERO SECTION (Replicating exact website hero)
      ========================================================================= */}
      <View style={styles.heroSection}>
        {/* Large Headphone Artwork Silhouette in background */}
        <Image
          source={{ uri: storeArt.hero }}
          style={styles.heroImageBackdrop}
          resizeMode="contain"
        />

        {/* Overlay Hero Copy */}
        <View style={styles.heroCopyContainer}>
          <Text style={styles.heroPretitle}>NEW PRODUCT</Text>
          <Text style={styles.heroTitle}>XX99 MARK II{"\n"}HEADPHONES</Text>
          <Text style={styles.heroDescription}>
            The new XX99 Mark II headphones is the pinnacle of pristine audio. It
            redefines your premium headphone experience by reproducing the balanced
            depth and precision of studio quality sound.
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            activeOpacity={0.8}
            onPress={() => onSelectProduct(heroProduct)}
          >
            <Text style={styles.heroButtonText}>SEE PRODUCT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =========================================================================
          CATEGORY TILES (Headphones, Speakers, Earphones)
      ========================================================================= */}
      <View style={styles.categoryTilesSection}>
        <View style={styles.categoryTilesGrid}>
          {/* Headphones */}
          <TouchableOpacity
            style={styles.categoryTile}
            activeOpacity={0.85}
            onPress={() => onSelectCategory?.("headphones")}
          >
            <Image
              source={{ uri: categoryArt.headphones }}
              style={styles.categoryTileImage}
              resizeMode="contain"
            />
            <Text style={styles.categoryTileTitle}>HEADPHONES</Text>
            <Text style={styles.categoryTileLink}>Shop ›</Text>
          </TouchableOpacity>

          {/* Speakers */}
          <TouchableOpacity
            style={styles.categoryTile}
            activeOpacity={0.85}
            onPress={() => onSelectCategory?.("speakers")}
          >
            <Image
              source={{ uri: categoryArt.speakers }}
              style={styles.categoryTileImage}
              resizeMode="contain"
            />
            <Text style={styles.categoryTileTitle}>SPEAKERS</Text>
            <Text style={styles.categoryTileLink}>Shop ›</Text>
          </TouchableOpacity>

          {/* Earphones */}
          <TouchableOpacity
            style={styles.categoryTile}
            activeOpacity={0.85}
            onPress={() => onSelectCategory?.("earphones")}
          >
            <Image
              source={{ uri: categoryArt.earphones }}
              style={styles.categoryTileImage}
              resizeMode="contain"
            />
            <Text style={styles.categoryTileTitle}>EARPHONES</Text>
            <Text style={styles.categoryTileLink}>Shop ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =========================================================================
          FEATURED PRODUCTS SECTION
      ========================================================================= */}
      <View style={styles.featuredSection}>
        <View style={styles.featuredHeader}>
          <Text style={styles.featuredTitle}>Featured</Text>
          <TouchableOpacity onPress={() => onSelectCategory?.("headphones")}>
            <Text style={styles.shopAllLink}>Shop all ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuredGrid}>
          {featured.map((product) => (
            <View key={product.id} style={styles.featuredCard}>
              <View style={styles.featuredCardImgBox}>
                <Image
                  source={{ uri: product.images?.hero }}
                  style={styles.featuredCardImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.featuredCardName}>{product.name}</Text>
              <TouchableOpacity
                style={styles.featuredCardBtn}
                onPress={() => onSelectProduct(product)}
                activeOpacity={0.8}
              >
                <Text style={styles.featuredCardBtnText}>SEE PRODUCT</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* =========================================================================
          SPOTLIGHT BANNER 1: ZX9 SPEAKER
      ========================================================================= */}
      <View style={styles.spotlightContainer}>
        <View style={styles.zx9Banner}>
          <Image
            source={{ uri: storeArt.ringLights }}
            style={styles.zx9Rings}
            resizeMode="contain"
          />
          <View style={styles.zx9ImageBox}>
            <Image
              source={{ uri: zx9.images?.hero }}
              style={styles.zx9Image}
              resizeMode="contain"
            />
          </View>
          <View style={styles.zx9CopyBox}>
            <Text style={styles.zx9Title}>ZX9{"\n"}SPEAKER</Text>
            <Text style={styles.zx9Desc}>{zx9.description}</Text>
            <View style={styles.bannerActions}>
              <TouchableOpacity
                style={styles.zx9DarkBtn}
                onPress={() => onSelectProduct(zx9)}
                activeOpacity={0.8}
              >
                <Text style={styles.zx9DarkBtnText}>SEE PRODUCT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.zx9OutlineBtn}
                onPress={() => addItem(zx9, 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.zx9OutlineBtnText}>ADD TO CART</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* =========================================================================
          SPOTLIGHT BANNER 2: ZX7 SPEAKER
      ========================================================================= */}
      <View style={styles.spotlightContainer}>
        <View style={styles.zx7Banner}>
          <View style={styles.zx7ImageBox}>
            <Image
              source={{ uri: zx7.images?.hero }}
              style={styles.zx7Image}
              resizeMode="contain"
            />
          </View>
          <View style={styles.zx7CopyBox}>
            <Text style={styles.zx7Title}>ZX7{"\n"}SPEAKER</Text>
            <Text style={styles.zx7Desc}>{zx7.description}</Text>
            <View style={styles.bannerActions}>
              <TouchableOpacity
                style={styles.zx7InverseBtn}
                onPress={() => onSelectProduct(zx7)}
                activeOpacity={0.8}
              >
                <Text style={styles.zx7InverseBtnText}>SHOP THE ZX7</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.zx7OutlineBtn}
                onPress={() => addItem(zx7, 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.zx7OutlineBtnText}>ADD TO CART</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* =========================================================================
          ABOUT SECTION ("Bringing you the best audio gear")
      ========================================================================= */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* HERO */
  heroSection: {
    backgroundColor: colors.ink,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  heroImageBackdrop: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.35,
  },
  heroCopyContainer: {
    zIndex: 10,
    alignItems: "center",
    maxWidth: 360,
  },
  heroPretitle: {
    fontFamily: fonts.sans,
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  heroDescription: {
    fontFamily: fonts.sans,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  heroButton: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    paddingVertical: 14,
    paddingHorizontal: 30,
    backgroundColor: "transparent",
  },
  heroButtonText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  /* CATEGORY TILES */
  categoryTilesSection: {
    paddingHorizontal: 16,
    paddingVertical: 36,
  },
  categoryTilesGrid: {
    gap: 16,
  },
  categoryTile: {
    backgroundColor: colors.mist,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 8,
  },
  categoryTileImage: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  categoryTileTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.ink,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  categoryTileLink: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.accent,
    textTransform: "uppercase",
  },

  /* FEATURED PRODUCTS */
  featuredSection: {
    backgroundColor: colors.mist,
    paddingHorizontal: 16,
    paddingVertical: 36,
  },
  featuredHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  featuredTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    textTransform: "uppercase",
  },
  shopAllLink: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  featuredGrid: {
    gap: 24,
  },
  featuredCard: {
    alignItems: "center",
  },
  featuredCardImgBox: {
    width: "100%",
    height: 240,
    backgroundColor: colors.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginBottom: 16,
  },
  featuredCardImg: {
    width: "100%",
    height: "100%",
  },
  featuredCardName: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.ink,
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  featuredCardBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    width: "100%",
  },
  featuredCardBtnText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  /* SPOTLIGHT BANNERS */
  spotlightContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  zx9Banner: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  zx9Rings: {
    position: "absolute",
    width: width * 1.6,
    height: width * 1.6,
    opacity: 0.35,
  },
  zx9ImageBox: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  zx9Image: {
    width: "100%",
    height: "100%",
  },
  zx9CopyBox: {
    alignItems: "center",
  },
  zx9Title: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center",
    lineHeight: 34,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  zx9Desc: {
    fontFamily: fonts.sans,
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  bannerActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  zx9DarkBtn: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingVertical: 14,
    alignItems: "center",
  },
  zx9DarkBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  zx9OutlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.white,
    paddingVertical: 14,
    alignItems: "center",
  },
  zx9OutlineBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  /* ZX7 */
  zx7Banner: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    overflow: "hidden",
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  zx7ImageBox: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  zx7Image: {
    width: "100%",
    height: "100%",
  },
  zx7CopyBox: {
    alignItems: "center",
  },
  zx7Title: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center",
    lineHeight: 34,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  zx7Desc: {
    fontFamily: fonts.sans,
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  zx7InverseBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    paddingVertical: 14,
    alignItems: "center",
  },
  zx7InverseBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  zx7OutlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.white,
    paddingVertical: 14,
    alignItems: "center",
  },
  zx7OutlineBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  /* ABOUT */
  aboutSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  aboutImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.mist,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginBottom: 28,
  },
  aboutImage: {
    width: "100%",
    height: "100%",
  },
  aboutTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 18,
    textTransform: "uppercase",
  },
  aboutText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
