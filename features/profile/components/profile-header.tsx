import { useTranslations } from "next-intl"
import { Mail, Camera, Navigation, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { FullUser, UserAddress } from "../api/profile"

interface ProfileHeaderProps {
  user: FullUser
  activeAddress?: UserAddress | null
  onAvatarSelect?: (file: File) => void
  onAddressClick?: () => void
  isUploading?: boolean
}

export function ProfileHeader({
  user,
  activeAddress,
  onAvatarSelect,
  onAddressClick,
  isUploading = false,
}: ProfileHeaderProps) {
  const t = useTranslations("Profile")

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onAvatarSelect) {
      onAvatarSelect(file)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* User Basic Info */}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          {/* Avatar with Camera upload button */}
          <div className="group relative shrink-0">
            <Avatar className="size-24 rounded-full ring-1 ring-border sm:size-28">
              <AvatarImage
                src={user.image?.secure_url}
                alt={`${user.firstName} ${user.lastName}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-muted text-2xl font-semibold text-muted-foreground sm:text-3xl">
                {initials || "RM"}
              </AvatarFallback>
            </Avatar>

            {onAvatarSelect && (
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100"
                title="Change Profile Picture"
              >
                <Camera className="size-6" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-xs">
                <div className="size-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex flex-col items-center text-center sm:items-start sm:text-start">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {user.firstName} {user.lastName}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Mail className="size-4" />
                <span className="font-mono text-xs sm:text-sm">
                  {user.email}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Active Address Card */}
        {activeAddress ? (
          <button
            type="button"
            onClick={onAddressClick}
            className="flex max-w-sm min-w-[260px] shrink-0 cursor-pointer flex-col gap-2 rounded-xl border border-border/80 bg-muted/30 p-4 text-start transition-all hover:border-primary/40 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Navigation className="size-4 shrink-0 text-primary" />
                <p className="truncate text-sm font-bold text-foreground">
                  {activeAddress.label || activeAddress.street}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="shrink-0 px-2 py-0.5 text-[11px] font-medium"
              >
                {t("defaultBadge")}
              </Badge>
            </div>

            <div className="space-y-0.5 pt-1">
              <p className="truncate text-xs text-muted-foreground">
                {activeAddress.street}, {activeAddress.city}
                {activeAddress.country ? `, ${activeAddress.country}` : ""}
              </p>
              <p className="pt-0.5 font-mono text-[11px] text-muted-foreground/80">
                {activeAddress.phoneNumber}
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={onAddressClick}
            className="flex min-w-[240px] shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span>{t("noActiveAddress")}</span>
          </button>
        )}
      </div>
    </div>
  )
}
