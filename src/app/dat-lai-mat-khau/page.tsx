import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PasswordResetFlow } from "@/components/auth/PasswordResetFlow";
import { RESET_COOKIE, hasResetGrant } from "@/lib/passwordReset";
export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  if (!await hasResetGrant(cookieStore.get(RESET_COOKIE)?.value)) redirect("/quen-mat-khau");
  return <PasswordResetFlow initialStep="password" />;
}
