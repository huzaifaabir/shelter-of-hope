import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const value = { success: (m) => push(m, "success"), error: (m) => push(m, "error") };
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`max-w-md rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
            <span aria-hidden="true">{t.type === "error" ? "⚠ " : "✓ "}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
