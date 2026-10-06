"use client";

import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  show: (toast: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DISMISS_AFTER_MS = 3500;

const TONES: Record<ToastTone, { className: string; icon: ReactNode }> = {
  success: { className: "border-leaf-200 bg-leaf-50 text-leaf-700", icon: <CircleCheck className="size-6" /> },
  error: { className: "border-cherry-100 bg-cherry-50 text-cherry-700", icon: <CircleAlert className="size-6" /> },
  info: { className: "border-sky-100 bg-sky-50 text-sky-700", icon: <Info className="size-6" /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), DISMISS_AFTER_MS);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              role="status"
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border-2 px-4 py-3",
                TONES[toast.tone].className,
              )}
            >
              <span aria-hidden>{TONES[toast.tone].icon}</span>
              <div>
                <p className="font-extrabold">{toast.title}</p>
                {toast.description && <p className="text-sm font-semibold">{toast.description}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>.");
  return context;
}
