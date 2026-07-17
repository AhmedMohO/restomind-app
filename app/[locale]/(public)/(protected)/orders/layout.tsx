import type { Metadata } from "next"
import { getAlternates } from "@/lib/seo/metadata"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "My Orders",
    description: "Track and manage your order history with RestoMind.",
    alternates: getAlternates(locale, "/orders"),
    robots: { index: false, follow: false },
  }
}

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
