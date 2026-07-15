import Navbar from "@/components/common/Navbar"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      {children}
    </div>
  )
}
