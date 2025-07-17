/**
 * Currency formatting utilities for Indonesian Rupiah (IDR)
 */

/**
 * Format number as Indonesian Rupiah with full formatting
 * @param amount - The amount to format
 * @returns Formatted string like "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "Rp 0"
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number as compact Indonesian Rupiah (with K, Jt, M abbreviations)
 * @param amount - The amount to format
 * @returns Formatted string like "Rp 15rb" or "Rp 1,2Jt"
 */
export function formatRupiahCompact(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "Rp 0"
  }

  // For amounts less than 1000, show full amount
  if (amount < 1000) {
    return formatRupiah(amount)
  }

  // For amounts less than 1 million, show in thousands (rb)
  if (amount < 1000000) {
    const thousands = amount / 1000
    return `Rp ${thousands.toFixed(thousands < 10 ? 1 : 0)}rb`
  }

  // For amounts less than 1 billion, show in millions (Jt)
  if (amount < 1000000000) {
    const millions = amount / 1000000
    return `Rp ${millions.toFixed(millions < 10 ? 1 : 0)}Jt`
  }

  // For amounts 1 billion and above, show in billions (M)
  const billions = amount / 1000000000
  return `Rp ${billions.toFixed(billions < 10 ? 1 : 0)}M`
}

/**
 * Format percentage with Indonesian locale
 * @param value - The percentage value (0-100)
 * @returns Formatted string like "15,5%"
 */
export function formatPercentage(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return "0%"
  }

  return new Intl.NumberFormat("id-ID", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Parse Indonesian Rupiah string to number
 * @param rupiahString - String like "Rp 15.000" or "15000"
 * @returns Parsed number
 */
export function parseRupiah(rupiahString: string): number {
  if (!rupiahString) return 0

  // Remove currency symbol, spaces, and dots (thousand separators)
  const cleanString = rupiahString.replace(/Rp\s?/g, "").replace(/\./g, "").replace(/,/g, "").trim()

  const parsed = Number.parseFloat(cleanString)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Validate if a string is a valid Rupiah amount
 * @param rupiahString - String to validate
 * @returns Boolean indicating if valid
 */
export function isValidRupiah(rupiahString: string): boolean {
  if (!rupiahString) return false

  const parsed = parseRupiah(rupiahString)
  return !isNaN(parsed) && parsed >= 0
}

/**
 * Format number as Indonesian number (with dots as thousand separators)
 * @param amount - The number to format
 * @returns Formatted string like "15.000"
 */
export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "0"
  }

  return new Intl.NumberFormat("id-ID").format(amount)
}

/**
 * Convert USD to IDR (for migration purposes)
 * @param usdAmount - Amount in USD
 * @param exchangeRate - USD to IDR exchange rate (default: 15000)
 * @returns Amount in IDR
 */
export function convertUsdToIdr(usdAmount: number, exchangeRate = 15000): number {
  if (isNaN(usdAmount) || usdAmount === null || usdAmount === undefined) {
    return 0
  }

  return Math.round(usdAmount * exchangeRate)
}
