import type { Metadata } from "next"
import { getAlternates } from "@/lib/seo/metadata"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const shortId = id.slice(-8).toUpperCase()
  const title = locale === "ar" ? `تفاصيل الطلب #${shortId} — RestoMind` : `Order Details #${shortId} — RestoMind`

  return {
    title,
    description: "View itemized details, status, and delivery information for your order.",
    alternates: getAlternates(locale, `/orders/${id}`),
    robots: { index: false, follow: false },
  }
}

export default function OrderDetailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
