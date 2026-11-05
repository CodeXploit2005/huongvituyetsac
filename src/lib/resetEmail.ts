import "server-only";

export async function sendResetEmail(email: string, name: string, otp: string, language: "vi" | "en") {
  const en = language === "en";
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      ...(process.env.EMAILJS_PRIVATE_KEY ? { accessToken: process.env.EMAILJS_PRIVATE_KEY } : {}),
      template_params: {
        email,
        to_name: name,
        passcode: otp,
        language,
        subject: en ? "Your password reset code — Hương Vị Tuyệt Sắc" : "Mã đặt lại mật khẩu — Hương Vị Tuyệt Sắc",
        heading: en ? "Reset your password" : "Đặt lại mật khẩu",
        greeting: en ? `Hello ${name},` : `Xin chào ${name},`,
        message: en ? "Use the code below to reset your password. It expires in 10 minutes." : "Sử dụng mã bên dưới để đặt lại mật khẩu. Mã có hiệu lực trong 10 phút.",
        expiry_text: en ? "Valid for 10 minutes • Do not share this code" : "Hiệu lực 10 phút • Không chia sẻ mã này",
        security_note: en ? "If you did not request this, ignore this email. Your password has not changed." : "Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu của bạn chưa thay đổi.",
        expires_in: "10", brand_name: "Hương Vị Tuyệt Sắc",
      },
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    // Do not log provider responses: they can contain recipient data or template parameters.
    console.error(`EmailJS password reset delivery failed: HTTP ${response.status}`);
    throw new Error("EMAIL_DELIVERY_FAILED");
  }
}
