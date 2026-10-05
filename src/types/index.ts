export type Category = "headphones" | "speakers" | "earphones";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  features: string[];
  inTheBox: string[];
  isNew: boolean;
  accent: "peach" | "mist" | "ink";
  images?: {
    hero: string;
    gallery: string[];
  };
};

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  accent: "peach" | "mist" | "ink";
};

export type User = {
  id: string;
  email: string;
  fullName?: string;
  createdAt?: string;
};

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  payment_method: string;
  subtotal: number;
  shipping: number;
  vat: number;
  grand_total: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
};

export type CheckoutPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  paymentMethod: "e-Money" | "Cash on Delivery";
  eMoneyNumber?: string;
  eMoneyPin?: string;
  lines: { id: string; quantity: number }[];
};
