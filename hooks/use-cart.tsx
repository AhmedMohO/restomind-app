"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Product } from "@/features/products/types"

interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  wishlist: string[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  toggleWishlist: (productId: string) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("restumint_cart")
    const savedWishlist = localStorage.getItem("restumint_wishlist")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error(e)
      }
    }
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("restumint_cart", JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem("restumint_wishlist", JSON.stringify(wishlist))
  }, [wishlist])

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevCart, { product, quantity }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const toggleWishlist = (productId: string) => {
    setWishlist((prevWishlist) =>
      prevWishlist.includes(productId)
        ? prevWishlist.filter((id) => id !== productId)
        : [...prevWishlist, productId]
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0)

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
