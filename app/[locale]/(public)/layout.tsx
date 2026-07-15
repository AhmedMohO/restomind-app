import Navbar from "@/components/common/Navbar"
import { CartProvider } from "@/hooks/use-cart"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <CartProvider>
    <div className="relative min-h-screen">
      <Navbar />
      {children}
    </div>
      </CartProvider>
  )
}

