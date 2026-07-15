import Footer from "@/components/common/Footer"
import Navbar from "@/components/common/Navbar"
import { CartProvider } from "@/hooks/use-cart"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <>
        <Navbar />
        {children}
        <Footer />
      </>
    </CartProvider>
  )
}
