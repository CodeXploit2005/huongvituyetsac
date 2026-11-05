/**
 * Format currency in VND or USD based on language
 */
export function formatCurrency(amount: number, lang: "vi" | "en" = "vi"): string {
  if (lang === "en") {
    // Approx conversion rate for display: 1 USD ~ 25,000 VND
    const usd = amount / 25000;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usd);
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Format date in localized format
 */
export function formatDate(dateString: string, lang: "vi" | "en" = "vi"): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/** Order timestamps use Vietnam time consistently across devices. */
export function formatDateTime(dateString: string, lang: "vi" | "en" = "vi"): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
