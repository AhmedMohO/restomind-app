import { Restaurant } from "../types"

export function formatOwner(owner: Restaurant["ownerUserId"]): string {
    if (!owner) return "—"
    return (
        `${owner?.firstName || ""} ${owner?.lastName || ""} (${owner?.email || ""})` ||
        "—"
    )
}