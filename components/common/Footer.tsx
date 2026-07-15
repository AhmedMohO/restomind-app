// ============================================================================
// TEAMMATE PART: This is a placeholder footer.
// Remove or exclude this file when pushing to git if your teammate has their own.
// ============================================================================
import React from "react"
import Link from "next/link"


export default function Footer() {
  return (
    <footer className="bg-[#FAF7F2] border-t border-border mt-auto transition-colors dark:bg-neutral-950 dark:border-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="font-serif text-xl font-bold text-primary dark:text-[#E68A49]">
              Restumint Bakery
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs dark:text-neutral-400">
              Stone-baked Egyptian flatbreads, laminated croissants, and traditional pastries baked fresh every single hour in the heart of Cairo.
            </p>
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-primary dark:text-[#E68A49] mb-4">
              Shop Menu
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-primary dark:text-neutral-400 dark:hover:text-[#E68A49]">
                  Breads & Flatbreads
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-primary dark:text-neutral-400 dark:hover:text-[#E68A49]">
                  Laminated Pastries
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-primary dark:text-neutral-400 dark:hover:text-[#E68A49]">
                  Eid Cookies & Biscuits
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-primary dark:text-neutral-400 dark:hover:text-[#E68A49]">
                  Traditional Trays
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-primary dark:text-[#E68A49] mb-4">
              Our Story
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#story" className="text-muted-foreground hover:text-primary dark:text-neutral-400 dark:hover:text-[#E68A49]">
                  About Restumint
                </Link>
              </li>
              <li>
                <Link href="#sourcing" className="text-muted-foreground hover:text-primary dark:text-neutral-400 dark:hover:text-[#E68A49]">
                  Premium Ghee & Flour
                </Link>
              </li>
              <li>
                <Link href="#careers" className="text-muted-foreground hover:text-primary dark:text-neutral-400 dark:hover:text-[#E68A49]">
                  Join Our Bakeries
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-primary dark:text-[#E68A49] mb-4">
              Freshness Guarantee
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed dark:text-neutral-400">
              We bake around the clock. Your order is prepared within hours of delivery to ensure a warm, golden, shatteringly crisp experience.
            </p>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground dark:border-neutral-900">
          <p>© {new Date().getFullYear()} Restumint Bakery. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Made with ❤️ in Cairo, Egypt</p>
        </div>
      </div>
    </footer>
  )
}
