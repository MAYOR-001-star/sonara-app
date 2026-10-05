# Sonora Mobile App (React Native & Expo)

A premier cross-platform mobile e-commerce application replicating the **Sonora Audio Store** ([`hng stage 2`](../hng%20stage%202)) built with **React Native**, **Expo SDK 57**, **TypeScript**, and **Supabase**.

Engineered with mobile-first UX best practices:
1. **Supabase Direct Integration**: Uses Supabase Postgres tables (`products`, `orders`, `order_items`) and Supabase Auth with RLS (Row Level Security).
2. **Mobile-First Tab Navigation**: Ergonomic bottom tab bar (**Discover**, **Catalog**, **Cart** with dynamic badge count, **Account** with order history) designed for single-hand mobile reach.
3. **Instant Search & Interactive Catalog**: Live filtering by keyword, category pill switcher (All, Headphones, Speakers, Earphones), sorting (Featured, Price, Newest), and pull-to-refresh (`RefreshControl`).
4. **Interactive Product Experience**: Multi-angle image gallery switcher, in-the-box accessory checklist, studio acoustic features, related recommendations, and a sticky bottom action bar with quantity stepper and animated toast feedback.
5. **Real-Time Cart & Cross-Platform Sync**: Instant cross-device synchronization via Supabase Realtime broadcast channels and persistent local cache.
6. **Robust Checkout Flow**: Multi-section form with validation, payment method selector (e-Money / Cash on Delivery), direct Supabase database order insertion, and Sonora's signature Order Confirmation modal with order reference (`AP-XXXXXX`).
7. **Account & Realtime Order Tracking**: Live orders fetched directly from Supabase, order status badges, expandable line items breakdown, and real-time order update subscriptions.

---

## Supabase Database & Security

Shares the exact database schema and credentials as `hng stage 2`:
- **Database URL**: `https://ayhniexiswjeosvreowc.supabase.co`
- **Tables**:
  - `products`: Publicly readable audio catalog (Headphones, Speakers, Earphones).
  - `orders`: Stores customer details, shipping address, payment method, subtotal, shipping ($50 flat), VAT (20%), grand total, and status (`confirmed`). Enforces user ownership via RLS.
  - `order_items`: Line items linked by order UUID with product ID, unit price, quantity, and line total.
- **Supabase Auth**:
  - Email & Password registration and authentication.
  - Secure session storage with `@react-native-async-storage/async-storage`.
  - User profile metadata (full name, user ID).

---

## Mobile Architecture & Screens

```
mobile/
├── App.tsx                     # Main mobile orchestrator, tab switcher & modal coordinator
├── app.json                    # Expo configuration
├── package.json
└── src/
    ├── components/
    │   ├── BottomTabBar.tsx    # Native bottom navigation with live cart badge
    │   ├── Header.tsx          # Sonora wordmark, Supabase cloud indicator, quick search & cart
    │   └── ProductCard.tsx     # Elevation card with artwork, tag, price, and quick-add
    ├── context/
    │   ├── AuthContext.tsx     # Supabase Auth provider with session persistence & listeners
    │   └── CartContext.tsx     # Cart state, VAT calculations, and Supabase Realtime sync
    ├── screens/
    │   ├── HomeScreen.tsx      # Sonora hero showcase, spotlight banners (ZX9, ZX7), story
    │   ├── CatalogScreen.tsx   # Instant search, category pills, sorting, pull-to-refresh
    │   ├── ProductDetailScreen.tsx # Multi-angle gallery, specs, in-the-box, sticky bottom CTA
    │   ├── CartScreen.tsx      # Live cart, item steppers, cost breakdown with VAT & shipping
    │   ├── CheckoutScreen.tsx  # Billing/shipping validation, payment selector, Supabase insert
    │   ├── AuthScreen.tsx      # Supabase Sign In, Sign Up with full name, password reset
    │   └── AccountScreen.tsx   # Supabase user profile, live order tracking with pull-to-refresh
    ├── services/
    │   ├── api.ts              # Supabase queries, order placement, and realtime subscriptions
    │   ├── supabase.ts         # Supabase client with AsyncStorage session persistence
    │   └── seed-data.ts        # Bundled seed products with SVG artwork for offline resilience
    ├── theme/
    │   ├── colors.ts           # Sonora brand palette (ink #131313, bronze #c98a52, mist #f1f2f4)
    │   └── typography.ts       # Archivo (display) and Manrope (body) font configuration
    └── types/
        └── index.ts            # Type definitions for products, orders, cart lines, and checkout
```

---

## Getting Started

### Prerequisites
- Node.js 20+

### Run Locally

Navigate into the `mobile` directory:
```bash
cd mobile
```

#### Run on Web
```bash
npm run web
```
Opens in your browser at `http://localhost:8081`.

#### Run on Android / iOS (via Expo Go or Emulator)
```bash
npm run android
# or
npm run ios
```
