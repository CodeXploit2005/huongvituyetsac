export const supportSubjects = ["Tư vấn sản phẩm", "Hỗ trợ đơn hàng", "Góp ý & phản hồi", "Hợp tác kinh doanh", "Khác"] as const;
export const supportStatuses = { new: "Mới", processing: "Đang xử lý", resolved: "Đã xử lý" } as const;
export type SupportStatus = keyof typeof supportStatuses;
export interface SupportTicket {
  _id: string; name: string; email: string; subject: string; message: string;
  phone?: string; status: SupportStatus; note: string; createdAt: string; updatedAt?: string;
}
export function validateSupport(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (input.phone !== undefined && typeof input.phone !== "string") return null;
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  if (phone && (phone.length > 25 || !/^\+?[0-9\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 9 || phone.replace(/\D/g, "").length > 15)) return null;
  const fields = ["name", "email", "subject", "message"] as const;
  if (fields.some(key => typeof input[key] !== "string")) return null;
  const data = Object.fromEntries(fields.map(key => [key, (input[key] as string).trim()])) as Record<typeof fields[number], string>;
  if (!data.name || data.name.length > 100 || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !supportSubjects.some(s => s === data.subject) || !data.message || data.message.length > 5000) return null;
  return { ...data, phone, email: data.email.toLowerCase() };
}
