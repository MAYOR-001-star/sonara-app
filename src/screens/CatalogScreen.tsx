import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import { seedProducts } from "../services/seed-data";
import type { Product, Category } from "../types";

interface CatalogScreenProps {
  initialCategory?: Category | "all";
  onSelectProduct: (product: Product) => void;
  onOpenCart: () => void;
}

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  initialCategory = "all",
  onSelectProduct,
  onOpenCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    initialCategory
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { addItem, count } = useCart();

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      if (data && data.length > 0) {
        setProducts(data);
      }
    } catch {
      // Fallback to seedProducts
    }
  };

  useEffect(() => {
    loadProducts();

    const unsubscribe = api.subscribeToProducts(() => {
      loadProducts();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleQuickAdd = (product: Product) => {
    addItem(product, 1);
    setToastMessage(`Added ${product.name} to cart!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // Filter by Category
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.features.some((f) => f.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const categories: { key: Category | "all"; label: string; count: number }[] = [
    { key: "all", label: "All Products", count: products.length },
    {
      key: "headphones",
      label: "Headphones",
      count: products.filter((p) => p.category === "headphones").length,
    },
    {
      key: "speakers",
      label: "Speakers",
      count: products.filter((p) => p.category === "speakers").length,
    },
    {
      key: "earphones",
      label: "Earphones",
      count: products.filter((p) => p.category === "earphones").length,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Toast Feedback */}
      {toastMessage && (
        <TouchableOpacity
          style={styles.toast}
          onPress={onOpenCart}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.ink} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </TouchableOpacity>
      )}

      {/* Header Search & Filter */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search audio gear, specs..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoryPillsList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(item.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.pillBadge,
                    isSelected && styles.pillBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillBadgeText,
                      isSelected && styles.pillBadgeTextActive,
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Sort Controls Bar */}
        <View style={styles.subBar}>
          <Text style={styles.resultCount}>
            {filteredAndSortedProducts.length} product
            {filteredAndSortedProducts.length === 1 ? "" : "s"} found
          </Text>

          <View style={styles.sortOptionsRow}>
            <TouchableOpacity
              onPress={() =>
                setSortBy((s) => (s === "featured" ? "price-asc" : s === "price-asc" ? "price-desc" : s === "price-desc" ? "newest" : "featured"))
              }
              style={styles.sortBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-vertical" size={14} color={colors.primary} />
              <Text style={styles.sortBtnText}>
                {sortBy === "featured"
                  ? "Featured"
                  : sortBy === "price-asc"
                  ? "Price: Low to High"
                  : sortBy === "price-desc"
                  ? "Price: High to Low"
                  : "Newest"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredAndSortedProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>
              We couldn&apos;t find any gear matching &quot;{searchQuery}&quot;. Try adjusting your search query or filter.
            </Text>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              <Text style={styles.clearBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => onSelectProduct(item)}
          >
            <View style={styles.cardImageContainer}>
              {item.images?.hero ? (
                <Image
                  source={{ uri: item.images.hero }}
                  style={styles.cardImage}
                  contentFit="contain"
                />
              ) : null}
              {item.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
              <Text style={styles.cardName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.cardBottomRow}>
                <Text style={styles.cardPrice}>
                  ${item.price.toLocaleString("en-US")}
                </Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => onSelectProduct(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewBtnText}>DETAILS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickAddBtn}
                    onPress={() => handleQuickAdd(item)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Quick add ${item.name} to cart`}
                  >
                    <Ionicons name="cart-outline" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  toast: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
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
  searchHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mist,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  categoryPillsList: {
    gap: 8,
    paddingBottom: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mist,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: colors.ink,
  },
  categoryPillText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  categoryPillTextActive: {
    color: colors.white,
  },
  pillBadge: {
    backgroundColor: "rgba(19, 19, 19, 0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pillBadgeActive: {
    backgroundColor: colors.primary,
  },
  pillBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
  },
  pillBadgeTextActive: {
    color: colors.white,
  },
  subBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    paddingBottom: 4,
  },
  resultCount: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  sortOptionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortBtnText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageContainer: {
    height: 180,
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  newBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1,
  },
  cardContent: {
    padding: 16,
  },
  cardCategory: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardName: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(19, 19, 19, 0.05)",
    paddingTop: 12,
  },
  cardPrice: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  viewBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  quickAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  clearBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
});
