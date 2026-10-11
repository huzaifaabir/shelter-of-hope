import { useEffect, useRef } from "react";

export default function ConfirmModal({ open, title, message, confirmText = "হ্যাঁ, নিশ্চিত", cancelText = "বাতিল", onConfirm, onCancel, busy, danger = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="cm-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="cm-title" className="text-lg">{title}</h2>
        <p className="mt-2 text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={ref} className="btn-outline" onClick={onCancel} disabled={busy}>{cancelText}</button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm} disabled={busy}>{busy ? "অপেক্ষা করুন..." : confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`my-8 w-full ${wide ? "max-w-3xl" : "max-w-xl"} rounded-xl bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-2xl leading-none text-muted hover:text-ink" aria-label="বন্ধ করুন">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
