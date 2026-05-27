"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { locales, LanguageType } from "@/lib/locales";

export interface Product {
  id: number;
  brand: string;
  model: string;
  priceUsd: number;
  isWholesalePrice: boolean;
  basePriceUsd: number;
  wholesalePriceUsd: number;
  stockQuantity: number;
  statusTag: "all" | "new" | "imported" | "promo";
  imageUrl: string;
  description: string;
  isActive?: boolean;
  batteryCapacity?: number | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  totalUsd: number;
  currencyUsed: "USD" | "KGS";
  exchangeRate: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  deliveryType: "local" | "pre-order";
  createdAt: string;
  items: string;
  user: {
    name: string;
    username: string;
    phone: string | null;
  } | null;
}

export interface TgLog {
  id: number;
  timestamp: string;
  payload: string;
}

interface StoreContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  currency: "USD" | "KGS";
  setCurrency: (curr: "USD" | "KGS") => void;
  section: "instock" | "preorder" | "admin";
  setSection: (sec: "instock" | "preorder" | "admin") => void;
  
  // Products
  products: Product[];
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  isLoadingProducts: boolean;
  refetchProducts: () => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (productId: number) => void;
  updateCartQty: (productId: number, delta: number) => void;
  removeFromCart: (productId: number) => void;
  checkout: () => Promise<void>;

  // Settings
  exchangeRate: number;
  dubaiCost: number;
  koreaCost: number;
  saveSettings: (rate: number, dubai: number, korea: number) => Promise<boolean>;

  // Admin Logs
  orders: Order[];
  tgLogs: TgLog[];
  refetchAdminData: () => void;

  // Modal Auth
  isAuthOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  loginGoogle: (email: string) => Promise<void>;
  loginTelegram: (username: string) => Promise<void>;
  logout: () => void;

  // Pre-orders
  submitPreorder: (productId: number, qty: number, hub: "dubai" | "korea") => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [language, setLanguage] = useState<LanguageType>("ru");
  const [currency, setCurrency] = useState<"USD" | "KGS">("USD");
  const [section, setSection] = useState<"instock" | "preorder" | "admin">("instock");

  // Filter States
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Loaded DB data
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState<boolean>(false);
  const [isAuthOpen, setAuthOpen] = useState<boolean>(false);

  // Settings state loaded from DB
  const [exchangeRate, setExchangeRate] = useState<number>(90.0);
  const [dubaiCost, setDubaiCost] = useState<number>(35.0);
  const [koreaCost, setKoreaCost] = useState<number>(30.0);

  // Admin data loaded from DB
  const [orders, setOrders] = useState<Order[]>([]);
  const [tgLogs, setTgLogs] = useState<TgLog[]>([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 1. Fetch system settings on load
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setExchangeRate(data.usdToKgsRate);
        setDubaiCost(data.dubaiShippingCostUsd);
        setKoreaCost(data.koreaShippingCostUsd);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  // 2. Fetch products list based on filters and roles
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const brandQ = selectedBrand !== "all" ? `&brand=${selectedBrand}` : "";
      const statusQ = selectedStatus !== "all" ? `&status=${selectedStatus}` : "";
      
      const res = await fetch(`/api/products?t=${Date.now()}${brandQ}${statusQ}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // 3. Fetch Admin orders and TG logs
  const fetchAdminData = async () => {
    if (!session?.user) return;
    const role = (session.user as any).role;
    if (role !== "owner" && role !== "admin") return;

    try {
      const oRes = await fetch("/api/orders");
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData.orders);
      }
      const tRes = await fetch("/api/telegram");
      if (tRes.ok) {
        const tData = await tRes.json();
        setTgLogs(tData.logs);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  // Trigger loads
  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedBrand, selectedStatus, session]);

  useEffect(() => {
    if (section === "admin") {
      fetchAdminData();
    }
  }, [section, session]);

  // Sync Cart quantities with updated product lists (e.g. if stock changes)
  useEffect(() => {
    if (products.length > 0 && cart.length > 0) {
      const updatedCart = cart.map(item => {
        const liveProd = products.find(p => p.id === item.product.id);
        if (liveProd) {
          return {
            product: liveProd,
            quantity: Math.min(item.quantity, liveProd.stockQuantity)
          };
        }
        return item;
      }).filter(item => item.product.stockQuantity > 0 && item.quantity > 0);
      
      setCart(updatedCart);
    }
  }, [products]);

  // Cart Actions
  const addToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stockQuantity <= 0) return;

    const existing = cart.find(item => item.product.id === productId);
    if (existing) {
      if (existing.quantity < product.stockQuantity) {
        setCart(cart.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setCartOpen(true);
  };

  const updateCartQty = (productId: number, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
    } else if (newQty <= item.product.stockQuantity) {
      setCart(cart.map(i => 
        i.product.id === productId 
          ? { ...i, quantity: newQty }
          : i
      ));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(i => i.product.id !== productId));
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          currencyUsed: currency,
          exchangeRate,
        }),
      });

      if (res.ok) {
        setCart([]);
        setCartOpen(false);
        fetchProducts();
        alert(locales[language].orderSubmittedAlert);
      } else {
        const err = await res.json();
        alert(`Ошибка оформления: ${err.error}`);
      }
    } catch (err) {
      console.error("Checkout submit error:", err);
    }
  };

  // Preorders Submit Action
  const submitPreorder = async (productId: number, qty: number, hub: "dubai" | "korea") => {
    try {
      const res = await fetch("/api/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: qty,
          originHub: hub,
          currencyUsed: currency,
          exchangeRate,
        }),
      });

      if (res.ok) {
        fetchProducts();
        alert(locales[language].preorderSubmittedAlert);
      } else {
        const err = await res.json();
        alert(`Ошибка предзаказа: ${err.error}`);
      }
    } catch (err) {
      console.error("Pre-order API error:", err);
    }
  };

  // Save Settings
  const saveSettings = async (rate: number, dubai: number, korea: number) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usdToKgsRate: rate,
          dubaiShippingCostUsd: dubai,
          koreaShippingCostUsd: korea,
        }),
      });

      if (res.ok) {
        setExchangeRate(rate);
        setDubaiCost(dubai);
        setKoreaCost(korea);
        fetchProducts(); // refetch prices
        return true;
      }
      return false;
    } catch (err) {
      console.error("Save settings error:", err);
      return false;
    }
  };

  // Google/Telegram Authentication Methods
  const loginGoogle = async (email: string) => {
    await signIn("credentials", {
      email,
      redirect: false,
    });
    setAuthOpen(false);
    setSection("instock");
  };

  const loginTelegram = async (username: string) => {
    await signIn("credentials", {
      telegram: username,
      redirect: false,
    });
    setAuthOpen(false);
    setSection("instock");
  };

  const logout = () => {
    signOut({ redirect: false });
    setSection("instock");
  };

  return (
    <StoreContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        section,
        setSection,
        products,
        selectedBrand,
        setSelectedBrand,
        selectedStatus,
        setSelectedStatus,
        isLoadingProducts,
        refetchProducts: fetchProducts,
        cart,
        cartCount,
        isCartOpen,
        setCartOpen,
        addToCart,
        updateCartQty,
        removeFromCart,
        checkout,
        exchangeRate,
        dubaiCost,
        koreaCost,
        saveSettings,
        orders,
        tgLogs,
        refetchAdminData: fetchAdminData,
        isAuthOpen,
        setAuthOpen,
        loginGoogle,
        loginTelegram,
        logout,
        submitPreorder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
