export function Loading({ text = "তথ্য লোড হচ্ছে..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-hidden="true" />
      {text}
    </div>
  );
}

export function EmptyState({ text = "বর্তমানে কোনো রক্তদাতা পাওয়া যায়নি।", children }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-slate-50 px-6 py-14 text-center text-muted">
      <p>{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function ErrorState({ message = "তথ্য লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline btn-sm mt-4">
          আবার চেষ্টা করুন
        </button>
      )}
    </div>
  );
}

export function Field({ label, error, required, children, hint, id }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-brand-600" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="border-b border-line bg-gradient-to-b from-brand-50 to-white">
      <div className="container-x py-10 sm:py-14">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {children && <p className="mt-3 max-w-2xl text-muted">{children}</p>}
      </div>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="পৃষ্ঠা পরিবর্তন">
      <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        আগের পাতা
      </button>
      <span className="text-sm text-muted">
        পাতা {new Intl.NumberFormat("bn-BD").format(page)} / {new Intl.NumberFormat("bn-BD").format(pages)}
      </span>
      <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        পরের পাতা
      </button>
    </nav>
  );
}
