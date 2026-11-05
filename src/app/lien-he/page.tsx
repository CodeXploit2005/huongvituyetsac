"use client";

import { useState } from "react";
import { Phone, Mail, Clock3, UserRound, MessageSquare, Send, LockKeyhole, LoaderCircle } from "lucide-react";
import { ContactSubjectSelect } from "@/components/common/ContactSubjectSelect";

export default function ContactPage() {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ error: false, text: "" });
  const [social, setSocial] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectInvalid, setSubjectInvalid] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    if (!subject) {
      setSubjectInvalid(true);
      document.getElementById("contact-subject")?.focus();
      return;
    }
    const form = event.currentTarget;
    setSending(true); setFeedback({ error: false, text: "" });
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể gửi tin nhắn.");
      form.reset();
      setSubject("");
      setSubjectInvalid(false);
      setFeedback({ error: false, text: "Đã gửi tin nhắn thành công! Cảm ơn bạn, chúng tôi sẽ phản hồi qua email sớm nhất." });
    } catch (error) { setFeedback({ error: true, text: error instanceof Error ? error.message : "Không thể kết nối. Vui lòng thử lại." }); }
    finally { setSending(false); }
  }
  return (
    <div className="contact-page relative isolate overflow-hidden bg-[#faf7f2] dark:bg-[#0d0d0d]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px] bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.72),rgba(0,0,0,.78)),url(https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1920&q=85)" }} />
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-14 text-center text-white sm:pb-24 sm:pt-20">
        <p className="flex items-center justify-center gap-3 text-[11px] font-extrabold tracking-[.2em] text-amber-400"><span className="h-px w-8 bg-amber-400" />LIÊN HỆ VỚI CHÚNG TÔI<span className="h-px w-8 bg-amber-400" /></p>
        <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Chúng tôi luôn sẵn sàng <span className="text-amber-400">lắng nghe bạn !</span></h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-stone-300">Mọi thắc mắc, góp ý hay hợp tác, hãy liên hệ với Hương Vị Tuyệt Sắc.<br className="hidden sm:block" /> Chúng tôi luôn trân trọng từng ý kiến của bạn !</p>
      </section>
      <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:px-6 lg:grid-cols-[.9fr_1.1fr]">
        <section className="contact-card">
          <h2 className="text-2xl font-extrabold">Thông tin <span className="contact-accent">liên hệ</span></h2>
          <p className="contact-description">Bạn có thể liên hệ với chúng tôi qua các kênh dưới đây.<br />Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
          <div className="my-6 space-y-3">
            {[{ icon: Phone, label: "Số điện thoại", value: "Đang cập nhật" }, { icon: Mail, label: "Email", value: "huongvituyetsac@gmail.com", href: "mailto:huongvituyetsac@gmail.com" }, { icon: Clock3, label: "Thời gian làm việc", value: "24/7" }].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/5 dark:bg-white/[.025]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"><Icon size={22} /></span>
                <div className="min-w-0"><p className="text-xs text-stone-500 dark:text-stone-400">{label}</p><p className="mt-1 break-words text-sm font-bold">{href ? <a href={href} className="hover:text-amber-600">{value}</a> : value}</p></div>
              </div>
            ))}
          </div>
          <h3 className="mb-3 text-sm font-bold">Kết nối với chúng tôi</h3>
          <div className="flex gap-3">{["Facebook", "Zalo"].map(label => <button key={label} type="button" onClick={() => setSocial(`Kênh ${label} đang cập nhật. Bạn vui lòng liên hệ qua email hoặc biểu mẫu bên cạnh.`)} className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-100 px-4 py-2.5 text-sm font-bold transition hover:border-amber-500 dark:border-white/10 dark:bg-white/5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white">{label === "Facebook" ? <span className="text-xl font-black">f</span> : <span className="text-[9px]">Zalo</span>}</span>{label}</button>)}</div>
          <p role="status" className="mt-3 text-xs text-stone-500 dark:text-stone-400">{social}</p>
        </section>
        <section className="contact-card">
          <h2 className="text-2xl font-extrabold">Gửi tin nhắn <span className="contact-accent">cho chúng tôi</span></h2>
          <p className="contact-description">Hãy điền đầy đủ thông tin bên dưới, chúng tôi sẽ liên hệ lại với bạn sớm nhất.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="contact-field"><UserRound size={18} /><span className="sr-only">Họ và tên *</span><input name="name" required maxLength={100} autoComplete="name" placeholder="Họ và tên *" /></label>
              <label className="contact-field"><Mail size={18} /><span className="sr-only">Email *</span><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Email *" /></label>
            </div>
            <label className="contact-field"><Phone size={18} /><span className="sr-only">Số điện thoại</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={25} pattern={String.raw`[+]?[0-9\s\(\)\.\-]{9,25}`} title="Nhập số điện thoại từ 9–15 chữ số, có thể kèm mã quốc gia." placeholder="Số điện thoại" /></label>
            <ContactSubjectSelect value={subject} invalid={subjectInvalid} onChange={value => { setSubject(value); setSubjectInvalid(false); }} />
            <label className="contact-field items-start"><MessageSquare size={18} className="mt-1" /><span className="sr-only">Nội dung tin nhắn *</span><textarea name="message" required maxLength={5000} rows={5} placeholder="Nội dung tin nhắn *" /></label>
            <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-extrabold text-stone-950 shadow-lg shadow-amber-500/10 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{sending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}{sending ? "Đang gửi..." : "Gửi tin nhắn"}</button>
            <p role={feedback.error ? "alert" : "status"} className={`text-sm ${feedback.error ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{feedback.text}</p>
            <p className="flex items-center justify-center gap-2 text-center text-[11px] text-stone-500 dark:text-stone-400"><LockKeyhole size={13} />Thông tin của bạn được bảo mật tuyệt đối.</p>
          </form>
        </section>
      </div>
    </div>
  );
}

