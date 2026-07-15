import Header from "@/components/common/Header"
import Footer from "@/components/common/Footer"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
