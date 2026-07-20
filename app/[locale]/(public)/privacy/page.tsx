import { getTranslations } from "next-intl/server"
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Cpu,
  Cookie,
  UserCheck,
  Mail,
  Baby,
} from "lucide-react"

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy")

  const sections = [
    {
      title: t("section1Title"),
      body: t("section1Body"),
      icon: Eye,
      id: "info-collect",
    },
    {
      title: t("section2Title"),
      body: t("section2Body"),
      icon: Database,
      id: "data-usage",
    },
    {
      title: t("section3Title"),
      body: t("section3Body"),
      icon: Lock,
      id: "data-sharing",
    },
    {
      title: t("section4Title"),
      body: t("section4Body"),
      icon: Cpu,
      id: "ai-analytics",
    },
    {
      title: t("section5Title"),
      body: t("section5Body"),
      icon: ShieldCheck,
      id: "security",
    },
    {
      title: t("section6Title"),
      body: t("section6Body"),
      icon: Cookie,
      id: "cookies",
    },
    {
      title: t("section7Title"),
      body: t("section7Body"),
      icon: UserCheck,
      id: "user-rights",
    },
    {
      title: t("section8Title"),
      body: t("section8Body"),
      icon: Baby,
      id: "children",
    },
    {
      title: t("section9Title"),
      body: t("section9Body"),
      icon: Mail,
      id: "contact",
    },
  ]

  return (
    <main className="w-full pb-20 dark:bg-neutral-950">
      {/* Header Banner */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat pt-32 pb-16 text-white md:pt-40 md:pb-20"
        style={{ backgroundImage: "url('/images/Landing/hero.webp')" }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-[2px]" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8">
          <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-[#E6BF8F] uppercase backdrop-blur-md">
            {t("badge")}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#E6BF8F] backdrop-blur-md">
              <ShieldCheck className="size-7" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {t("title")}
              </h1>
              <p className="mt-1 text-xs text-stone-300">{t("lastUpdated")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left: Quick Navigation Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-4 rounded-3xl border border-[#ECE6DB] bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="mb-4 border-b border-border/50 pb-2 font-serif text-base font-bold text-[#2B1B15] dark:text-neutral-100">
                  {t("topicsTitle")}
                </h3>
                <nav className="space-y-1.5">
                  {sections.map((s, i) => (
                    <a
                      key={i}
                      href={`#${s.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                    >
                      <s.icon className="size-3.5 shrink-0 text-[#7C4A27] dark:text-[#E68A49]" />
                      <span className="truncate">{s.title}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Right: Detailed Content Cards */}
            <div className="space-y-6 lg:col-span-8">
              {/* Intro Banner */}
              <div className="rounded-3xl border border-[#ECE6DB] bg-white p-6 shadow-sm sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t("intro")}
                </p>
              </div>

              {/* Sections Cards */}
              {sections.map((section, i) => {
                const Icon = section.icon
                return (
                  <div
                    key={i}
                    id={section.id}
                    className="scroll-mt-28 rounded-3xl border border-[#ECE6DB] bg-white p-6 shadow-sm transition-all hover:border-[#7C4A27]/30 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-[#E68A49]/30"
                  >
                    <div className="mb-4 flex items-center gap-3.5">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-[#7C4A27]/10 text-[#7C4A27] dark:bg-[#C2733C]/20 dark:text-[#E68A49]">
                        <Icon className="size-5" />
                      </div>
                      <h2 className="font-serif text-lg font-bold text-[#2B1B15] sm:text-xl dark:text-neutral-100">
                        {section.title}
                      </h2>
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {section.body}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
