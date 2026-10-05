import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { Header } from "./src/components/Header";
import { BottomTabBar, type TabKey } from "./src/components/BottomTabBar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { CategoryScreen } from "./src/screens/CategoryScreen";
import { CatalogScreen } from "./src/screens/CatalogScreen";
import { ProductDetailScreen } from "./src/screens/ProductDetailScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { colors } from "./src/theme/colors";
import type { Product, Category } from "./src/types";

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Protected Route Gate State (replicates HNG stage 2 src/proxy.ts PROTECTED_PREFIXES: /checkout, /account, /orders)
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<"checkout" | "account" | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const fontId = "sonora-google-fonts";
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap";
        document.head.appendChild(link);
      }
    }
  }, []);

  const openAuthWithRedirect = (route: "checkout" | "account", notice: string) => {
    setPendingRoute(route);
    setAuthNotice(notice);
    setAuthVisible(true);
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedProduct(null);
    setSelectedCategory(category);
  };

  const handleGoHome = () => {
    setSelectedProduct(null);
    setSelectedCategory(null);
    setActiveTab("home");
  };

  // Route Guard: Checkout requires authentication (matching Stage 2 /checkout)
  const handleProceedToCheckout = () => {
    if (!user) {
      openAuthWithRedirect(
        "checkout",
        "Sign in to complete your checkout. Guest checkout is disabled to ensure your order data and receipts remain private."
      );
      return;
    }
    setCheckoutVisible(true);
  };

  // Route Guard: Account & Orders require authentication (matching Stage 2 /account & /orders)
  const handleTabChange = (tab: TabKey) => {
    setSelectedProduct(null);
    setSelectedCategory(null);
    if (tab === "account" && !user) {
      openAuthWithRedirect(
        "account",
        "Sign in to access your account details, order history, and receipts."
      );
      return;
    }
    setActiveTab(tab);
  };

  const handleGoToOrders = (_orderId: string) => {
    setCheckoutVisible(false);
    setSelectedProduct(null);
    setSelectedCategory(null);
    setActiveTab("account");
  };

  const handleAuthSuccess = () => {
    setAuthVisible(false);
    const destination = pendingRoute;
    setPendingRoute(null);
    setAuthNotice(null);

    // Exact replica of Stage 2's post-login destination forwarding
    if (destination === "checkout") {
      setCheckoutVisible(true);
    } else if (destination === "account") {
      setActiveTab("account");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      {/* Clean Mobile Top Header with Sonora branding */}
      <Header
        onOpenCart={() => {
          setSelectedProduct(null);
          setSelectedCategory(null);
          setActiveTab("cart");
        }}
        onOpenSearch={() => {
          setSelectedProduct(null);
          setSelectedCategory(null);
          setActiveTab("catalog");
        }}
        onOpenAuthOrAccount={() => {
          setSelectedProduct(null);
          setSelectedCategory(null);
          if (user) {
            setActiveTab("account");
          } else {
            openAuthWithRedirect(
              "account",
              "Sign in to access your account details, order history, and receipts."
            );
          }
        }}
        onGoHome={handleGoHome}
      />

      {/* Main View Area */}
      <View style={styles.body}>
        {selectedProduct ? (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onOpenCart={() => {
              setSelectedProduct(null);
              setActiveTab("cart");
            }}
            onSelectProduct={(product) => setSelectedProduct(product)}
            onSelectCategory={handleSelectCategory}
          />
        ) : selectedCategory ? (
          <CategoryScreen
            category={selectedCategory}
            onBack={() => setSelectedCategory(null)}
            onSelectProduct={(product) => setSelectedProduct(product)}
            onSelectCategory={handleSelectCategory}
          />
        ) : activeTab === "home" ? (
          <HomeScreen
            onSelectProduct={(product) => setSelectedProduct(product)}
            onSelectCategory={handleSelectCategory}
          />
        ) : activeTab === "catalog" ? (
          <CatalogScreen
            onSelectProduct={(product) => setSelectedProduct(product)}
            onOpenCart={() => setActiveTab("cart")}
          />
        ) : activeTab === "cart" ? (
          <CartScreen
            onClose={() => setActiveTab("home")}
            onGoToCheckout={handleProceedToCheckout}
          />
        ) : (
          <AccountScreen
            onOpenAuth={() =>
              openAuthWithRedirect(
                "account",
                "Sign in to access your account details, order history, and receipts."
              )
            }
            onExploreShop={() => setActiveTab("catalog")}
          />
        )}
      </View>

      {/* Mobile Bottom Tab Bar */}
      {!selectedProduct && (
        <BottomTabBar
          activeTab={selectedCategory ? "catalog" : activeTab}
          onTabChange={handleTabChange}
        />
      )}

      {/* Checkout Screen Modal (Protected Route) */}
      <Modal
        visible={checkoutVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <CheckoutScreen
          onBack={() => setCheckoutVisible(false)}
          onRequireAuth={() => {
            setCheckoutVisible(false);
            openAuthWithRedirect(
              "checkout",
              "Sign in to complete your checkout. Guest checkout is disabled to ensure your order data and receipts remain private."
            );
          }}
          onOrderSuccess={() => {
            setCheckoutVisible(false);
            setSelectedProduct(null);
            setSelectedCategory(null);
            setActiveTab("account");
          }}
          onGoToOrders={handleGoToOrders}
        />
      </Modal>

      {/* Supabase Auth Modal (Route Gate Destination) */}
      <Modal
        visible={authVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setAuthVisible(false);
          setPendingRoute(null);
          setAuthNotice(null);
        }}
      >
        <AuthScreen
          contextNotice={authNotice}
          onClose={() => {
            setAuthVisible(false);
            setPendingRoute(null);
            setAuthNotice(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  body: {
    flex: 1,
    backgroundColor: colors.paper,
  },
});
