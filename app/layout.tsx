import type { Metadata } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "RestoMind — Predict Waste, Share Abundance",
    template: "%s | RestoMind",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
