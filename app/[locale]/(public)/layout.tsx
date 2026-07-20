import Footer from "@/components/common/Footer"
import Navbar from "@/components/common/Navbar"
import { CartProvider } from "@/hooks/use-cart"
import { setRequestLocale } from "next-intl/server"

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

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
