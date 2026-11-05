"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product, CartItem, Voucher, Coupon } from "@/types";
import { sampleVouchers } from "@/data/initialData";

export interface FlyingItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  appliedVoucher: Voucher | null;
  applyVoucher: (code: string) => { success: boolean; message: string };
  removeVoucher: () => void;
  addToCart: (
    product: Product,
    quantity?: number,
    sourceElement?: HTMLElement | null
  ) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  flyingItems: FlyingItem[];
  removeFlyingItem: (id: string) => void;
  isBadgeBouncing: boolean;
  cartIconRef: React.RefObject<HTMLButtonElement | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>(sampleVouchers);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isBadgeBouncing, setIsBadgeBouncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const cartIconRef = React.useRef<HTMLButtonElement | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("hv_cart");
      if (savedCart) {
        const parsed: unknown = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          // Restore persisted cart only after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCart(parsed.filter((item): item is CartItem => Boolean(item && typeof item === "object" && item.product && typeof item.product._id === "string" && Number.isInteger(item.quantity) && item.quantity > 0)));
        }
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("hv_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  }, [cart, isLoaded]);

  // Load real coupons managed by Admin, while retaining built-in vouchers.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/coupons", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const coupons = (await response.json()) as Coupon[];
        if (cancelled) return;
        const now = Date.now();
        const databaseVouchers: Voucher[] = coupons
          .filter((coupon) => coupon.isActive && new Date(coupon.startAt).getTime() <= now && new Date(coupon.endAt).getTime() > now)
          .map((coupon) => ({
            code: coupon.code,
            discountPercent: coupon.discountType === "percent" ? coupon.discountValue : undefined,
            discountAmount: coupon.discountType === "fixed" ? coupon.discountValue : undefined,
            minOrderValue: coupon.minOrderValue,
            description: coupon.description,
          }));
        const merged = new Map(sampleVouchers.map((voucher) => [voucher.code, voucher]));
        databaseVouchers.forEach((voucher) => merged.set(voucher.code, voucher));
        setAvailableVouchers([...merged.values()]);
      })
      .catch((error) => console.error("Failed to load coupons", error));
    return () => { cancelled = true; };
  }, []);

  // Calculations
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  // Một kiện hàng chỉ tính mức phí cao nhất trong các sản phẩm, không cộng lặp.
  const productShippingFee = cart.reduce(
    (highest, item) => Math.max(highest, Number(item.product.shippingFee) || 0),
    0
  );
  const shippingFee = subtotal === 0 || appliedVoucher?.code === "FREESHIP" ? 0 : productShippingFee;

  // Calculate discount
  let discount = 0;
  if (appliedVoucher && subtotal >= appliedVoucher.minOrderValue) {
    if (appliedVoucher.discountPercent) {
      discount = Math.round((subtotal * appliedVoucher.discountPercent) / 100);
    } else if (appliedVoucher.discountAmount) {
      discount = appliedVoucher.discountAmount;
    }
  }

  const total = Math.max(0, subtotal - discount + shippingFee);

  const applyVoucher = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = availableVouchers.find((v) => v.code === cleanCode);

    if (!found) {
      return { success: false, message: "Mã giảm giá không hợp lệ." };
    }

    if (subtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Đơn hàng chưa đạt mức tối thiểu ${new Intl.NumberFormat("vi-VN").format(
          found.minOrderValue
        )}₫ để áp dụng mã này.`,
      };
    }

    setAppliedVoucher(found);
    return { success: true, message: `Đã áp dụng mã ${found.code} thành công!` };
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  // Fly-to-cart trigger
  const triggerFlyToCartAnimation = (
    imageSrc: string,
    sourceElement?: HTMLElement | null
  ) => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (sourceElement) {
      const rect = sourceElement.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    let endX = window.innerWidth - 60;
    let endY = 35;

    if (cartIconRef.current) {
      const cartRect = cartIconRef.current.getBoundingClientRect();
      endX = cartRect.left + cartRect.width / 2;
      endY = cartRect.top + cartRect.height / 2;
    }

    const newItem: FlyingItem = {
      id: `fly-${Date.now()}-${Math.random()}`,
      startX,
      startY,
      endX,
      endY,
      image: imageSrc,
    };

    setFlyingItems((prev) => [...prev, newItem]);

    // Trigger bounce on arrival
    setTimeout(() => {
      setIsBadgeBouncing(true);
      setTimeout(() => setIsBadgeBouncing(false), 600);
    }, 700);
  };

  const removeFlyingItem = (id: string) => {
    setFlyingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    sourceElement?: HTMLElement | null
  ) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    const img = product.images?.[0] || "";
    triggerFlyToCartAnimation(img, sourceElement);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedVoucher(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        shippingFee,
        discount,
        total,
        appliedVoucher,
        applyVoucher,
        removeVoucher,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        flyingItems,
        removeFlyingItem,
        isBadgeBouncing,
        cartIconRef,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
