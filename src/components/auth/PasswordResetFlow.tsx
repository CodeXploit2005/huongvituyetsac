"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useLanguage } from "@/context/LanguageContext";
import { resetCopy } from "@/data/passwordResetTranslations";

type Step = "email" | "otp" | "password" | "success";
type ErrorCode = keyof typeof resetCopy.vi.errors;
type PasswordResetApiError = Error & { retryAfter?: number };
const inputClass = "w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-base text-stone-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-700 dark:bg-black/25 dark:text-white";
const primaryClass = "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-5 py-4 text-sm font-extrabold text-stone-950 shadow-lg shadow-amber-600/15 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

export function PasswordResetFlow({ initialStep = "email" }: { initialStep?: "email" | "password" }) {
  const { language } = useLanguage();
  const c = resetCopy[language];
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [notice, setNotice] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const activeStep = step === "email" ? 0 : step === "otp" ? 1 : 2;
  useEffect(() => {
    if (!resendAt) return;
    const timer = setInterval(() => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))), 500);
    return () => clearInterval(timer);
  }, [resendAt]);
  async function callApi(payload: object) {
    const response = await fetch("/api/auth/password-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.code || "UNAVAILABLE") as PasswordResetApiError;
      if (typeof data.retryAfter === "number") error.retryAfter = data.retryAfter;
      throw error;
    }
    return data;
  }
  async function submit(event?: FormEvent, resend = false) {
    event?.preventDefault();
    if (busy) return;
    setError(null); setNotice(false);
    if (step === "password" && password !== confirm) { setError("PASSWORD_MISMATCH"); return; }
    setBusy(true);
    try {
      if (step === "email" || resend) {
        const data = await callApi({ action: "request", email, language });
        setOtp(""); setStep("otp"); setRemaining(data.retryAfter); setResendAt(Date.now() + data.retryAfter * 1000); setNotice(resend);
      } else if (step === "otp") {
        await callApi({ action: "verify", otp });
        router.push("/dat-lai-mat-khau");
        return;
      } else if (step === "password") {
        await callApi({ action: "reset", password, confirmPassword: confirm });
        setPassword(""); setConfirm(""); setStep("success");
      }
    } catch (e) {
      const requestError = e instanceof Error ? e as PasswordResetApiError : undefined;
      const code = requestError?.message || "NETWORK";
      if (code === "RATE_LIMITED" && requestError?.retryAfter) {
        setRemaining(requestError.retryAfter);
        setResendAt(Date.now() + requestError.retryAfter * 1000);
      }
      setError(code in c.errors ? code as ErrorCode : "NETWORK");
    }
    setBusy(false);
  }
  const rules = [password.length >= 8, /[a-zA-Z]/.test(password) && /\d/.test(password), new TextEncoder().encode(password).length <= 72];
  return (
    <section className="relative overflow-hidden bg-stone-100 px-4 py-10 sm:px-6 sm:py-16 dark:bg-[#0b0907]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-7">
          <Link href="/tai-khoan" className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-300"><ArrowLeft size={16} />{c.back}</Link>
        </div>
        <div className="grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-2xl shadow-stone-950/5 md:grid-cols-[0.85fr_1.15fr] dark:border-amber-300/10 dark:bg-[#15110d]">
          <aside className="relative hidden flex-col justify-between gap-12 bg-[#0c0a07] p-9 text-white md:flex lg:p-12">
            <div><BrandLogo className="mb-8 h-28 w-28" /><p className="mb-3 text-[10px] font-bold tracking-[0.25em] text-amber-300">{c.eyebrow}</p><h1 className="text-4xl font-black leading-tight tracking-tight">{c.brand}</h1><p className="mt-5 text-sm leading-7 text-stone-400">{c.intro}</p></div>
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-5"><ShieldCheck className="mb-3 text-amber-300" size={27} /><p className="text-sm font-bold text-amber-100">{c.secure}</p><p className="mt-2 text-xs leading-6 text-stone-400">{c.secureBody}</p></div>
          </aside>
          <div className="p-6 sm:p-9 lg:p-12">
            <BrandLogo className="mx-auto mb-6 h-20 w-20 md:hidden" />
            <ol className="mb-10 grid grid-cols-3 gap-2" aria-label={language === "vi" ? "Tiến trình" : "Progress"}>
              {c.steps.map((label, index) => <li key={index} aria-current={index === activeStep ? "step" : undefined} className="flex flex-col items-center gap-2 text-center"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index <= activeStep ? "bg-amber-400 text-stone-950" : "bg-stone-100 text-stone-400 dark:bg-stone-800"}`}>{index < activeStep || step === "success" ? <Check size={14} /> : index + 1}</span><span className={`text-[10px] font-bold sm:text-xs ${index === activeStep ? "text-stone-950 dark:text-amber-200" : "text-stone-400"}`}>{label}</span></li>)}
            </ol>
            {step === "success" ? <div role="status" className="py-4 text-center"><CheckCircle2 size={56} className="mx-auto mb-6 text-emerald-500" /><h2 className="text-2xl font-black text-stone-950 dark:text-white">{c.successTitle}</h2><p className="mb-8 mt-4 text-sm leading-7 text-stone-500 dark:text-stone-400">{c.successBody}</p>{/* A full navigation reloads the auth provider after invalidating the session. */}<a href="/tai-khoan" className={primaryClass}>{c.login}<ArrowRight size={17}/></a></div> : <>
              <h2 className="text-2xl font-black tracking-tight text-stone-950 sm:text-3xl dark:text-white">{step === "email" ? c.emailTitle : step === "otp" ? c.otpTitle : c.passwordTitle}</h2>
              <p className="mb-7 mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">{step === "email" ? c.emailSubtitle : step === "otp" ? c.otpSubtitle : c.passwordSubtitle}</p>
              {step === "otp" && <p className="mb-5 break-all rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:bg-amber-300/10 dark:text-amber-200">{email}</p>}
              <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
                {step === "email" && <div><label htmlFor="reset-email" className="mb-2 flex items-center gap-2 text-xs font-bold"><Mail size={15}/>{c.email}</label><input id="reset-email" autoFocus type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} disabled={busy}/></div>}
                {step === "otp" && <div><label htmlFor="reset-otp" className="mb-3 block text-xs font-bold">{c.otp}</label><div className="relative rounded-xl focus-within:ring-4 focus-within:ring-amber-400/20"><div aria-hidden="true" className="grid grid-cols-6 gap-2">{Array.from({length:6},(_,i)=><span key={i} className={`flex h-14 items-center justify-center rounded-xl border text-2xl font-bold tabular-nums sm:h-16 ${otp[i] ? "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200" : "border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-black/25"}`}>{otp[i] || "·"}</span>)}</div><input id="reset-otp" autoFocus type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required aria-describedby="otp-help" aria-invalid={Boolean(error)} value={otp} onChange={e => {setOtp(e.target.value.replace(/\D/g,"").slice(0,6));setError(null);}} className="absolute inset-0 h-full w-full cursor-text rounded-xl border-0 bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent" disabled={busy}/></div><p id="otp-help" className="mt-3 text-xs leading-5 text-stone-500">{c.otpHelp}</p></div>}
                {step === "password" && <>
                  <div><label htmlFor="reset-password" className="mb-2 flex items-center gap-2 text-xs font-bold"><KeyRound size={15}/>{c.password}</label><div className="relative"><input id="reset-password" autoFocus type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} className={`${inputClass} pr-12`} disabled={busy}/><button type="button" aria-label={showPassword?c.hide:c.show} onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-4 text-stone-500">{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>
                  <ul className="space-y-2 text-xs">{[c.ruleLength,c.ruleLetter,c.ruleMax].map((rule,i)=><li key={i} className={`flex items-start gap-2 ${password && rules[i] ? "text-emerald-600 dark:text-emerald-400":"text-stone-500"}`}><Check size={14} className="shrink-0"/>{rule}</li>)}</ul>
                  <div><label htmlFor="reset-confirm" className="mb-2 block text-xs font-bold">{c.confirm}</label><input id="reset-confirm" type={showPassword?"text":"password"} autoComplete="new-password" required minLength={8} maxLength={72} value={confirm} onChange={e=>setConfirm(e.target.value)} className={inputClass} disabled={busy}/></div>
                </>}
                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{c.errors[error]}</p>}
                {notice && <p role="status" className="text-xs leading-5 text-emerald-600 dark:text-emerald-400">{c.resent}</p>}
                <button type="submit" disabled={busy || (step === "email" && remaining > 0) || (step === "otp" && otp.length !== 6) || (step === "password" && !rules.every(Boolean))} className={primaryClass}>{busy?<Loader2 size={18} className="animate-spin"/>:null}{busy?c.loading:step==="email" && remaining>0?`${c.resendWait} ${remaining} ${c.seconds}`:step==="email"?c.send:step==="otp"?c.verify:c.save}{!busy && remaining === 0 && <ArrowRight size={17}/>}</button>
              </form>
              {step === "otp" && <div className="mt-6 space-y-4 text-center"><p className="text-xs leading-5 text-stone-500">{c.spam}</p><button type="button" disabled={busy || remaining > 0} onClick={()=>void submit(undefined,true)} className="text-sm font-bold text-amber-700 disabled:text-stone-400 dark:text-amber-300">{remaining>0?`${c.resendWait} ${remaining} ${c.seconds}`:c.resend}</button><br/><button type="button" disabled={busy} onClick={()=>{setStep("email");setOtp("");setError(null);setNotice(false);}} className="text-xs text-stone-500 underline underline-offset-4">{c.changeEmail}</button></div>}
              {error === "RESET_EXPIRED" && <Link href="/quen-mat-khau" className="mt-5 block text-center text-sm font-bold text-amber-600">{c.restart}</Link>}
              <p className="mt-8 flex items-center justify-center gap-2 text-[10px] text-stone-400"><ShieldCheck size={14}/>{c.protected}</p>
            </>}
          </div>
        </div>
      </div>
    </section>
  );
}
