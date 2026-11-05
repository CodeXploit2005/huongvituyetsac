"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

export const AUTH_TRANSITION_EVENT = "hv:auth-transition";

type TransitionDetail = {
  kind: "login" | "register";
  name?: string;
  destination?: string;
};

type TransitionState = TransitionDetail & { stage: "covering" | "welcome" };

export function AuthTransitionOverlay() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const handleTransition = (event: Event) => {
      const detail = (event as CustomEvent<TransitionDetail>).detail;
      const requestedPath = detail.destination || "/";
      const destination = requestedPath.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
      clearTimers();
      router.prefetch(destination);
      setTransition({ ...detail, destination, stage: "covering" });

      const navigationDelay = reduceMotion ? 30 : 430;
      timers.current.push(setTimeout(() => {
        router.replace(destination, { scroll: true, transitionTypes: ["auth-success"] });
        setTransition((current) => current ? { ...current, stage: "welcome" } : null);
      }, navigationDelay));
      timers.current.push(setTimeout(() => setTransition(null), reduceMotion ? 180 : 1650));
    };

    window.addEventListener(AUTH_TRANSITION_EVENT, handleTransition);
    return () => {
      window.removeEventListener(AUTH_TRANSITION_EVENT, handleTransition);
      clearTimers();
    };
  }, [reduceMotion, router]);

  return (
    <AnimatePresence>
      {transition && (
        <motion.div
          key="auth-transition"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.28 }}
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-[#100909]/95 px-5 text-white backdrop-blur-xl"
        >
          <motion.div aria-hidden className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-red-700/25 blur-3xl" animate={reduceMotion ? undefined : { x: [0, 45, 0], scale: [1, 1.12, 1] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.div aria-hidden className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" animate={reduceMotion ? undefined : { x: [0, -40, 0], scale: [1.1, 0.95, 1.1] }} transition={{ duration: 3.4, repeat: Infinity }} />

          <motion.div
            initial={{ y: 16, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.38, ease: "easeOut" }}
            className="relative w-full max-w-sm text-center"
          >
            <motion.div
              initial={{ scale: 0.55, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-red-600 via-red-700 to-amber-500 shadow-2xl shadow-red-900/50"
            >
              {transition.stage === "covering" ? <Sparkles size={34} /> : <Check size={38} strokeWidth={3} />}
              <span className="absolute inset-0 animate-ping rounded-[26px] border border-amber-300/30 motion-reduce:animate-none" />
            </motion.div>

            <motion.div key={transition.stage} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-400">
                {transition.kind === "register" ? "Tài khoản đã sẵn sàng" : "Đăng nhập thành công"}
              </p>
              <h2 className="text-2xl font-black sm:text-3xl">
                {transition.kind === "register" && transition.name ? `Chào mừng ${transition.name}` : "Chào mừng bạn trở lại"}
              </h2>
              <p className="text-sm text-stone-300">
                {transition.stage === "covering" ? "Đang chuẩn bị trải nghiệm dành cho bạn..." : "Chúc bạn có trải nghiệm mua sắm thật tuyệt."}
              </p>
            </motion.div>

            <div className="mx-auto mt-7 h-1 w-44 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: reduceMotion ? 0 : 1.25, ease: "easeInOut" }} className="h-full w-full rounded-full bg-gradient-to-r from-red-500 to-amber-400" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
