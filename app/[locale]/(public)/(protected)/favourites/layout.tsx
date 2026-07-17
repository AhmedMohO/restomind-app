import type { Metadata } from "next"
import { getAlternates } from "@/lib/seo/metadata"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "My Favourites",
    description: "Your handpicked delicious treats and daily fresh offers.",
    alternates: getAlternates(locale, "/favourites"),
    robots: { index: false, follow: false },
  }
}

export default function FavouritesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
