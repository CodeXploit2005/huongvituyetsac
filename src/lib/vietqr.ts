export const VIETQR_BANK = {
  id: "TCB",
  name: "Techcombank (TCB)",
  accountNumber: "19076685491017",
  formattedAccountNumber: "1907 6685 4910 17",
} as const;

export function buildVietQRUrl(total: number, orderCode: string, retryAttempt = 0) {
  const baseUrl = `https://img.vietqr.io/image/${VIETQR_BANK.id}-${VIETQR_BANK.accountNumber}-qr_only.png`;
  const paymentData = `amount=${total}&addInfo=${encodeURIComponent(orderCode)}`;
  const cacheBuster = retryAttempt > 0 ? `&retry=${retryAttempt}` : "";

  return `${baseUrl}?${paymentData}${cacheBuster}`;
}
