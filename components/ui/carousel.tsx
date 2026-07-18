"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselContextProps = {
  carouselRef: React.RefObject<HTMLDivElement | null>
  canScrollPrev: boolean
  canScrollNext: boolean
  showArrows: boolean
  scrollPrev: () => void
  scrollNext: () => void
  isRtl: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

interface CarouselProps extends React.ComponentProps<"div"> {
  opts?: { align?: "start" | "center" | "end" }
  ref?: React.Ref<HTMLDivElement>
}

const Carousel = ({ className, children, ref, ...props }: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [showArrows, setShowArrows] = React.useState(false)
  const [isRtl, setIsRtl] = React.useState(false)

  const checkScroll = React.useCallback(() => {
    const el = carouselRef.current
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el
      const isRTL = window.getComputedStyle(el).direction === "rtl"
      setIsRtl(isRTL)

      const absScrollLeft = Math.abs(scrollLeft)
      const isStart = absScrollLeft < 4
      const isEnd = absScrollLeft + clientWidth >= scrollWidth - 4

      setShowArrows(scrollWidth > clientWidth)
      setCanScrollPrev(!isStart)
      setCanScrollNext(!isEnd)
    }
  }, [])

  React.useEffect(() => {
    const el = carouselRef.current
    if (el) {
      checkScroll()
      el.addEventListener("scroll", checkScroll)
      window.addEventListener("resize", checkScroll)

      const observer = new MutationObserver(checkScroll)
      observer.observe(el, { childList: true, subtree: true })

      return () => {
        el.removeEventListener("scroll", checkScroll)
        window.removeEventListener("resize", checkScroll)
        observer.disconnect()
      }
    }
  }, [checkScroll])

  const scrollPrev = React.useCallback(() => {
    const el = carouselRef.current
    if (el) {
      const scrollAmount = el.clientWidth * 0.8
      const isRTL = window.getComputedStyle(el).direction === "rtl"
      el.scrollBy({
        left: isRTL ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      })
    }
  }, [])

  const scrollNext = React.useCallback(() => {
    const el = carouselRef.current
    if (el) {
      const scrollAmount = el.clientWidth * 0.8
      const isRTL = window.getComputedStyle(el).direction === "rtl"
      el.scrollBy({
        left: isRTL ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }, [])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        canScrollPrev,
        canScrollNext,
        showArrows,
        scrollPrev,
        scrollNext,
        isRtl,
      }}
    >
      <div
        ref={ref}
        className={cn("relative w-full", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}
Carousel.displayName = "Carousel"

interface CarouselContentProps extends React.ComponentProps<"div"> {
  ref?: React.Ref<HTMLDivElement>
}

const CarouselContent = ({
  className,
  ref,
  ...props
}: CarouselContentProps) => {
  const { carouselRef } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className={cn(
        "grid snap-x snap-mandatory scrollbar-none overflow-x-auto scroll-smooth",
        className
      )}
      {...props}
    />
  )
}
CarouselContent.displayName = "CarouselContent"

interface CarouselItemProps extends React.ComponentProps<"div"> {
  ref?: React.Ref<HTMLDivElement>
}

const CarouselItem = ({ className, ref, ...props }: CarouselItemProps) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 snap-start", className)}
      {...props}
    />
  )
}
CarouselItem.displayName = "CarouselItem"

interface CarouselPreviousProps extends React.ComponentProps<typeof Button> {
  ref?: React.Ref<HTMLButtonElement>
}

const CarouselPrevious = ({
  className,
  variant = "outline",
  size = "icon",
  ref,
  ...props
}: CarouselPreviousProps) => {
  const { scrollPrev, canScrollPrev, showArrows, isRtl } = useCarousel()

  if (!showArrows) return null

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute z-10 h-8 w-8 cursor-pointer rounded-full border border-[#ECE6DB] bg-white shadow-sm transition-opacity duration-200 disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      {isRtl ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}
CarouselPrevious.displayName = "CarouselPrevious"

interface CarouselNextProps extends React.ComponentProps<typeof Button> {
  ref?: React.Ref<HTMLButtonElement>
}

const CarouselNext = ({
  className,
  variant = "outline",
  size = "icon",
  ref,
  ...props
}: CarouselNextProps) => {
  const { scrollNext, canScrollNext, showArrows, isRtl } = useCarousel()

  if (!showArrows) return null

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute z-10 h-8 w-8 cursor-pointer rounded-full border border-[#ECE6DB] bg-white shadow-sm transition-opacity duration-200 disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      {isRtl ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
      <span className="sr-only">Next slide</span>
    </Button>
  )
}
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselContextProps,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
