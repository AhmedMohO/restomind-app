/**
 * Generates an array of page numbers and ellipsis strings for pagination controls.
 */
export const getPageNumbers = (
  current: number,
  totalPages: number
): (number | string)[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = [1]
  if (current > 3) pages.push("...")

  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) pages.push(i)
  }

  if (current < totalPages - 2) pages.push("...")
  if (!pages.includes(totalPages)) pages.push(totalPages)

  return pages
}
