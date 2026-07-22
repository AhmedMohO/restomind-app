"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
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
import type { ApiCartItem } from "@/features/cart/api/type"
import type { ApiOffer } from "@/features/offers/api/type"

export type CartItem = ApiCartItem

interface CartContextType {
  cart: ApiCartItem[]
  wishlist: string[]
  isWishlistLoaded: boolean
  addToCart: (offer: ApiOffer, quantity?: number) => void
  removeFromCart: (offerId: string) => void
  updateQuantity: (offerId: string, quantity: number) => void
  toggleWishlist: (offerId: string) => void
  clearCart: () => void
  refreshCart: () => Promise<void>
  cartCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ApiCartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [isWishlistLoaded, setIsWishlistLoaded] = useState(false)
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
          setCart(cartRes.data.items)
        }

        if (favsRes.success) {
          setWishlist(favsRes.data.map((o) => o._id))
        }
        setIsWishlistLoaded(true)
      }

      fetchData()
    } else {
      queueMicrotask(() => {
        if (isMounted) {
          setCart((prev) => (prev.length > 0 ? [] : prev))
          setWishlist((prev) => (prev.length > 0 ? [] : prev))
          setIsWishlistLoaded(true)
        }
      })
    }

    return () => {
      isMounted = false
    }
  }, [isHydrated, isAuthenticated])

  // Guarded Add to Cart action
  const addToCart = async (offer: ApiOffer, quantity = 1) => {
    // STRICT AUTH GUARD: Immediately redirect to login if unauthenticated and ABORT
    if (!checkAuthOrRedirect()) return

    // Optimistic UI update
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.offer._id === offer._id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.offer._id === offer._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [
        ...prevCart,
        {
          offer,
          quantity,
          unitOriginalPrice: offer.originalPrice,
          unitOfferPrice: offer.offerPrice,
          totalItemPrice: offer.offerPrice * quantity,
        },
      ]
    })

    toast.success(t("addedToCart"))

    // Server API call
    const res = await addToCartAction({ offerId: offer._id, quantity })
    if (res.success) {
      setCart(res.data.items)
    } else if (res.error === "UNAUTHENTICATED") {
      router.push("/login")
    }
  }

  // Guarded Remove from Cart action
  const removeFromCart = async (offerId: string) => {
    // STRICT AUTH GUARD
    if (!checkAuthOrRedirect()) return

    setCart((prevCart) => prevCart.filter((item) => item.offer._id !== offerId))
    toast.success(t("removedFromCart"))

    const res = await removeFromCartAction(offerId)
    if (res.success) {
      setCart(res.data.items)
    } else if (res.error === "UNAUTHENTICATED") {
      router.push("/login")
    }
  }

  // Guarded Update Quantity action
  const updateQuantity = async (offerId: string, quantity: number) => {
    // STRICT AUTH GUARD
    if (!checkAuthOrRedirect()) return

    if (quantity <= 0) {
      return removeFromCart(offerId)
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.offer._id === offerId ? { ...item, quantity } : item
      )
    )

    const res = await updateCartQuantityAction(offerId, quantity)
    if (res.success) {
      setCart(res.data.items)
    } else if (res.error === "UNAUTHENTICATED") {
      router.push("/login")
    }
  }

  // Guarded Toggle Wishlist/Favorite action
  const toggleWishlist = async (offerId: string) => {
    // STRICT AUTH GUARD: Immediately redirect to login if unauthenticated and ABORT
    if (!checkAuthOrRedirect()) return

    const wasFavorite = wishlist.includes(offerId)

    // Immediate optimistic UI update
    setWishlist((prevWishlist) =>
      wasFavorite
        ? prevWishlist.filter((id) => id !== offerId)
        : [...prevWishlist, offerId]
    )

    // Call server action directly
    const res = wasFavorite
      ? await removeFavoriteAction(offerId)
      : await addFavoriteAction(offerId)

    if (res.success) {
      toast.success(
        t(wasFavorite ? "removedFromFavorites" : "addedToFavorites")
      )
    } else {
      if (res.error === "UNAUTHENTICATED") {
        router.push("/login")
      } else {
        // Revert optimistic update on error
        setWishlist((prevWishlist) =>
          wasFavorite
            ? [...prevWishlist, offerId]
            : prevWishlist.filter((id) => id !== offerId)
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
    (total, item) =>
      total +
      (item.unitOfferPrice ?? item.offer.offerPrice ?? 0) * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        isWishlistLoaded,
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
