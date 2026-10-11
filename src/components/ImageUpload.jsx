import { useRef, useState } from "react";
import { checkImage, uploadImage } from "../services/mediaService";

// Reusable single-image uploader with preview / replace / remove.
export default function ImageUpload({ value, onChange, folder = "donors", label = "ছবি আপলোড করুন", round = false, id }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = checkImage(file);
    if (err) return setError(err);
    setError("");
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (er) {
      setError(er.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-line bg-slate-50 text-xs text-muted ${round ? "rounded-full" : "rounded-lg"}`}>
          {value ? <img src={value} alt="নির্বাচিত ছবির প্রিভিউ" className="h-full w-full object-cover" /> : "ছবি নেই"}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={input} id={id} type="file" accept="image/*" className="sr-only" onChange={pick} />
          <button type="button" className="btn-outline btn-sm" onClick={() => input.current.click()} disabled={busy}>
            {busy ? "আপলোড হচ্ছে..." : value ? "ছবি পরিবর্তন করুন" : label}
          </button>
          {value && !busy && (
            <button type="button" className="btn-outline btn-sm" onClick={() => onChange("")}>
              সরিয়ে দিন
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
