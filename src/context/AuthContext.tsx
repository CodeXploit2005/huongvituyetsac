"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserAddress } from "@/types";
import { DEFAULT_AVATAR } from "@/lib/mediaUpload";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  updateAvatar: (avatar: string | null) => Promise<void>;
  addAddress: (address: Omit<UserAddress, "id">) => Promise<{ success: boolean; message?: string }>;
  updateAddress: (addressId: string, address: Omit<UserAddress, "id">) => Promise<{ success: boolean; message?: string }>;
  removeAddress: (addressId: string) => Promise<{ success: boolean; message?: string }>;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapApiUser(u: Record<string, unknown>): User {
  return {
    id: String(u._id || u.id),
    name: String(u.name || ""),
    email: String(u.email || ""),
    phone: String(u.phone || ""),
    role: u.role === "admin" ? "admin" : "user",
    avatar: u.avatar ? String(u.avatar) : DEFAULT_AVATAR,
    addresses: Array.isArray(u.addresses) ? (u.addresses as UserAddress[]) : [],
    wishlist: Array.isArray(u.wishlist) ? (u.wishlist as string[]) : [],
    createdAt: String(u.createdAt || new Date().toISOString()),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the authenticated database session.
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ? mapApiUser(data.user) : null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    if (!emailOrPhone.trim()) {
      return { success: false, message: "Vui lòng nhập Email hoặc Số điện thoại." };
    }

    // Try authenticating via MongoDB API
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailOrPhone.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const u = data.user;
        const mappedUser: User = {
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          role: u.role === "admin" ? "admin" : "user",
          avatar: u.avatar || DEFAULT_AVATAR,
          addresses: u.addresses || [],
          wishlist: u.wishlist || [],
          createdAt: u.createdAt || new Date().toISOString(),
        };
        setUser(mappedUser);
        return { success: true };
      }
      return {
        success: false,
        message: data.error || "Tài khoản hoặc mật khẩu không chính xác.",
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Không thể kết nối máy chủ.";
      return { success: false, message };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    if (!name || !email) {
      return { success: false, message: "Vui lòng điền đầy đủ Họ tên và Email." };
    }

    // Try registering via MongoDB API
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const u = data.user;
        const mappedUser: User = {
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          role: u.role === "admin" ? "admin" : "user",
          avatar: u.avatar || DEFAULT_AVATAR,
          addresses: u.addresses || [],
          wishlist: u.wishlist || [],
          createdAt: u.createdAt || new Date().toISOString(),
        };
        setUser(mappedUser);
        return { success: true };
      } else if (data.error) {
        return { success: false, message: data.error };
      }
    } catch (e) {
      const data = e instanceof Error ? e.message : "Không thể kết nối máy chủ.";
      return { success: false, message: data };
    }

    return { success: false, message: "Đăng ký thất bại." };
  };

  const logout = () => {
    setUser(null);
    void fetch("/api/auth/logout", { method: "POST" });
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  const updateAvatar = async (avatar: string | null) => {
    const response = await fetch("/api/account/avatar", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar }),
    });
    const data = await response.json() as { avatar?: string | null; error?: string };
    if (!response.ok) throw new Error(data.error || "Không thể lưu ảnh đại diện.");
    setUser(current => current && current.id === user?.id ? { ...current, avatar: data.avatar || DEFAULT_AVATAR } : current);
  };

  const saveAddress = async (newAddr: Omit<UserAddress, "id">, addressId?: string) => {
    if (!user) return { success: false, message: "Vui lòng đăng nhập để lưu địa chỉ." };
    try {
      const response = await fetch("/api/account/addresses", {
        method: addressId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddr, addressId }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.error || "Không thể lưu địa chỉ." };
      setUser((current) => current ? { ...current, addresses: data.addresses || [] } : current);
      return { success: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Không thể kết nối máy chủ." };
    }
  };

  const addAddress = (address: Omit<UserAddress, "id">) => saveAddress(address);
  const updateAddress = (addressId: string, address: Omit<UserAddress, "id">) => saveAddress(address, addressId);

  const removeAddress = async (addressId: string) => {
    if (!user) return { success: false, message: "Vui lòng đăng nhập để xóa địa chỉ." };
    try {
      const response = await fetch("/api/account/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.error || "Không thể xóa địa chỉ." };
      setUser((current) => current ? { ...current, addresses: data.addresses || [] } : current);
      return { success: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Không thể kết nối máy chủ." };
    }
  };

  const toggleWishlist = (productId: string) => {
    if (!user) return;
    const exists = user.wishlist.includes(productId);
    const newWishlist = exists
      ? user.wishlist.filter((id) => id !== productId)
      : [...user.wishlist, productId];
    setUser({ ...user, wishlist: newWishlist });
  };

  const isInWishlist = (productId: string): boolean => {
    return user ? user.wishlist.includes(productId) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updateAvatar,
        addAddress,
        updateAddress,
        removeAddress,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
