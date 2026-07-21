"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useRouter } from "@/i18n/routing"
import {
  fetchCartAction,
  addToCartAction,
  removeFromCartAction,
  updateCartQuantityAction,
  clearCartAction,
} from "@/features/cart/actions"
import {
  getFavoritesAction,
  addFavoriteAction,
  removeFavoriteAction,
} from "@/features/favorites/actions"
import type { ApiCart } from "@/features/cart/api/type"
import { ApiProduct } from "@/features/products/api/type"

interface CartItem {
  product: ApiProduct
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  wishlist: string[]
  addToCart: (product: ApiProduct, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  toggleWishlist: (productId: string) => void
  clearCart: () => void
  refreshCart: () => Promise<void>
  cartCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function mapApiCartToClientCart(apiCart: ApiCart): CartItem[] {
  if (!apiCart || !Array.isArray(apiCart.items)) return []
  return apiCart.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
  }))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const { isAuthenticated, isHydrated } = useAuth()
  const router = useRouter()
  const t = useTranslations("Cart")

  // Helper: Enforce authentication guard check
  const checkAuthOrRedirect = useCallback((): boolean => {
    if (!isAuthenticated) {
      toast.error(t("loginToContinue"))
      router.push("/login")
      return false
    }
    return true
  }, [isAuthenticated, router, t])

  useEffect(() => {
    if (!isHydrated) return

    let isMounted = true

    if (isAuthenticated) {
      const fetchData = async () => {
        const [cartRes, favsRes] = await Promise.all([
          fetchCartAction(),
          getFavoritesAction(),
        ])

        if (!isMounted) return

        if (cartRes.success) {
          setCart(mapApiCartToClientCart(cartRes.data))
        }

        if (favsRes.success) {
          setWishlist(favsRes.data.map((p) => p._id))
        }
      }

      fetchData()
    } else {
      queueMicrotask(() => {
        if (isMounted) {
          setCart((prev) => (prev.length > 0 ? [] : prev))
          setWishlist((prev) => (prev.length > 0 ? [] : prev))
        }
      })
    }

    return () => {
      isMounted = false
    }
  }, [isHydrated, isAuthenticated])

  // Guarded Add to Cart action
  const addToCart = async (product: ApiProduct, quantity = 1) => {
    // STRICT AUTH GUARD: Immediately redirect to login if unauthenticated and ABORT
    if (!checkAuthOrRedirect()) return

    // Optimistic UI update
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product._id === product._id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevCart, { product, quantity }]
    })

    toast.success(t("addedToCart"))

    // Server API call
    const res = await addToCartAction({ productId: product._id, quantity })
    if (res.success) {
      setCart(mapApiCartToClientCart(res.data))
    } else if (res.error === "UNAUTHENTICATED") {
      router.push("/login")
    }
  }

  // Guarded Remove from Cart action
  const removeFromCart = async (productId: string) => {
    // STRICT AUTH GUARD
    if (!checkAuthOrRedirect()) return

    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId))
    toast.success(t("removedFromCart"))

    const res = await removeFromCartAction(productId)
    if (res.success) {
      setCart(mapApiCartToClientCart(res.data))
    } else if (res.error === "UNAUTHENTICATED") {
      router.push("/login")
    }
  }

  // Guarded Update Quantity action
  const updateQuantity = async (productId: string, quantity: number) => {
    // STRICT AUTH GUARD
    if (!checkAuthOrRedirect()) return

    if (quantity <= 0) {
      return removeFromCart(productId)
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    )

    const res = await updateCartQuantityAction(productId, quantity)
    if (res.success) {
      setCart(mapApiCartToClientCart(res.data))
    } else if (res.error === "UNAUTHENTICATED") {
      router.push("/login")
    }
  }

  // Guarded Toggle Wishlist/Favorite action
  const toggleWishlist = async (productId: string) => {
    // STRICT AUTH GUARD: Immediately redirect to login if unauthenticated and ABORT
    if (!checkAuthOrRedirect()) return

    const wasFavorite = wishlist.includes(productId)

    // Immediate optimistic UI update
    setWishlist((prevWishlist) =>
      wasFavorite
        ? prevWishlist.filter((id) => id !== productId)
        : [...prevWishlist, productId]
    )

    toast.success(t(wasFavorite ? "removedFromFavorites" : "addedToFavorites"))

    // Call server action directly
    const res = wasFavorite
      ? await removeFavoriteAction(productId)
      : await addFavoriteAction(productId)

    if (!res.success) {
      if (res.error === "UNAUTHENTICATED") {
        router.push("/login")
      } else {
        // Revert optimistic update on error
        setWishlist((prevWishlist) =>
          wasFavorite
            ? [...prevWishlist, productId]
            : prevWishlist.filter((id) => id !== productId)
        )
      }
    }
  }

  // Guarded Clear Cart action
  const clearCart = async () => {
    // STRICT AUTH GUARD
    if (!checkAuthOrRedirect()) return

    setCart([])
    toast.success(t("cartCleared"))
    const res = await clearCartAction()
    if (res && !res.success && res.error === "UNAUTHENTICATED") {
      router.push("/login")
    }
  }

  // Re-sync local cart from the server (e.g. after placing an order empties it)
  const refreshCart = useCallback(async () => {
    const res = await fetchCartAction()
    if (res.success) {
      setCart(mapApiCartToClientCart(res.data))
    }
  }, [])

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0)
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        clearCart,
        refreshCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
