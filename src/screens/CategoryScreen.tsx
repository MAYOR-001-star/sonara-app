import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { seedProducts, storeArt } from "../services/seed-data";
import type { Product, Category } from "../types";

interface CategoryScreenProps {
  category: Category;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: Category) => void;
}

export const CategoryScreen: React.FC<CategoryScreenProps> = ({
  category,
  onBack,
  onSelectProduct,
  onSelectCategory,
}) => {
  const categoryProducts = seedProducts.filter((p) => p.category === category);
  const featured = categoryProducts[0];
  const rest = categoryProducts.slice(1);

  const categoryTitles: Record<Category, string> = {
    headphones: "HEADPHONES",
    speakers: "SPEAKERS",
    earphones: "EARPHONES",
  };

  const otherCategories = (["headphones", "speakers", "earphones"] as Category[]).filter(
    (c) => c !== category
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Category Header Band */}
      <View style={styles.headerBand}>
        <TouchableOpacity onPress={onBack} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>‹ Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryTitles[category]}</Text>
      </View>

      {/* Featured Product in Category */}
      {featured && (
        <View style={styles.featuredSection}>
          <View style={styles.featuredImageBox}>
            <Image
              source={{ uri: featured.images?.hero }}
              style={styles.featuredImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.featuredCopy}>
            {featured.isNew && (
              <Text style={styles.newProductBadge}>NEW PRODUCT</Text>
            )}
            <Text style={styles.featuredName}>{featured.name}</Text>
            <Text style={styles.featuredDesc}>{featured.description}</Text>
            <TouchableOpacity
              style={styles.seeProductBtn}
              activeOpacity={0.85}
              onPress={() => onSelectProduct(featured)}
            >
              <Text style={styles.seeProductBtnText}>SEE PRODUCT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* More Products in this Category */}
      {rest.length > 0 && (
        <View style={styles.moreSection}>
          <Text style={styles.sectionHeading}>
            More {categoryTitles[category].toLowerCase()}
          </Text>
          <View style={styles.moreGrid}>
            {rest.map((p) => (
              <View key={p.id} style={styles.productCard}>
                <View style={styles.cardImgBox}>
                  <Image
                    source={{ uri: p.images?.hero }}
                    style={styles.cardImg}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.cardName}>{p.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {p.description}
                </Text>
                <TouchableOpacity
                  style={styles.cardBtn}
                  activeOpacity={0.85}
                  onPress={() => onSelectProduct(p)}
                >
                  <Text style={styles.cardBtnText}>SEE PRODUCT</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* About Band matching website */}
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
          and experience a wide range of our products. Stop by our store to meet
          some of the fantastic people who make Sonora the best place to buy your
          portable audio equipment.
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
    paddingBottom: 48,
  },
  headerBand: {
    backgroundColor: colors.ink,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
  },
  goBackBtn: {
    position: "absolute",
    left: 20,
    top: 36,
  },
  goBackText: {
    fontFamily: fonts.sans,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "700",
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  featuredSection: {
    paddingHorizontal: 20,
    paddingVertical: 36,
    alignItems: "center",
  },
  featuredImageBox: {
    width: "100%",
    height: 280,
    backgroundColor: colors.mist,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginBottom: 24,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredCopy: {
    alignItems: "center",
    maxWidth: 360,
  },
  newProductBadge: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3,
    color: colors.accent,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  featuredName: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  featuredDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(19, 19, 19, 0.65)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  seeProductBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  seeProductBtnText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  moreSection: {
    backgroundColor: colors.mist,
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  sectionHeading: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    textTransform: "capitalize",
    marginBottom: 24,
  },
  moreGrid: {
    gap: 24,
  },
  productCard: {
    alignItems: "center",
  },
  cardImgBox: {
    width: "100%",
    height: 220,
    backgroundColor: colors.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginBottom: 14,
  },
  cardImg: {
    width: "100%",
    height: "100%",
  },
  cardName: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: "rgba(19, 19, 19, 0.6)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  cardBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    width: "100%",
    alignItems: "center",
  },
  cardBtnText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  tilesSection: {
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  tilesHeading: {
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: "center",
  },
  tilesGrid: {
    gap: 16,
  },
  tile: {
    backgroundColor: colors.mist,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 8,
  },
  tileImg: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  tileTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 2,
    marginBottom: 6,
  },
  tileLink: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.accent,
    textTransform: "uppercase",
  },
  aboutSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  aboutTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 14,
  },
  aboutText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
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
});
