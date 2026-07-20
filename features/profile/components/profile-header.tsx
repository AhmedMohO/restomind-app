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
    if (file && onAvatarSelect) onAvatarSelect(file)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      {/* Everything lives in ONE centered group now, not spread edge-to-edge */}
      <div className="flex flex-col items-center gap-6 md:mx-auto md:w-fit md:flex-row md:items-center md:gap-8">
        {/* User Basic Info */}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="group relative shrink-0">
            <Avatar className="size-24 rounded-full shadow-md ring-2 ring-background sm:size-28">
              <AvatarImage
                src={user.image?.secure_url}
                alt={`${user.firstName} ${user.lastName}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-2xl font-semibold text-primary sm:text-3xl">
                {initials || "RM"}
              </AvatarFallback>
            </Avatar>

            {onAvatarSelect && (
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100"
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
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-xs">
                <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center text-center sm:items-start sm:text-start">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {user.firstName} {user.lastName}
            </h1>
            <span className="mt-2 flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
              <Mail className="size-3.5" />
              <span className="font-mono">{user.email}</span>
            </span>
          </div>
        </div>

        {/* Vertical divider — only shows on md+, this is what replaces the empty gap */}
        <div className="hidden h-16 w-px shrink-0 bg-border md:block" />

        {/* Active Address Card */}
        {activeAddress ? (
          <button
            type="button"
            onClick={onAddressClick}
            className="flex w-full max-w-sm shrink-0 flex-col gap-2 rounded-xl border border-border bg-background p-4 text-start shadow-xs transition-all hover:border-primary/50 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:w-[280px]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10">
                  <Navigation className="size-3.5 text-primary" />
                </span>
                <p className="truncate text-sm font-semibold text-foreground">
                  {activeAddress.label || activeAddress.street}
                </p>
              </div>
              <Badge className="shrink-0 border-none bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                {t("defaultBadge")}
              </Badge>
            </div>
            <div className="space-y-0.5 ps-9 pt-1">
              <p className="truncate text-xs text-muted-foreground">
                {activeAddress.street}, {activeAddress.city}
                {activeAddress.country ? `, ${activeAddress.country}` : ""}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground/70">
                {activeAddress.phoneNumber}
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={onAddressClick}
            className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm font-medium text-primary transition-all hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:w-[280px]"
          >
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span>{t("noActiveAddress")}</span>
          </button>
        )}
      </div>
    </div>
  )
}
