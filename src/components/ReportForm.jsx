import { useRef, useState } from "react";
import { Field } from "./Feedback";
import { isValidPhone } from "../lib/bn";
import { submitReport } from "../services/adminService";
import { useToast } from "../context/ToastContext";

const CFG = {
  emergency: { subject: "বিষয়", submit: "জরুরি সহায়তার অনুরোধ পাঠান", needName: true, needPhone: true, location: true, files: true },
  complaint: { subject: "অভিযোগের বিষয়", submit: "অভিযোগ জমা দিন", needName: false, needPhone: false, location: false, files: true },
  contact: { subject: "বিষয়", submit: "বার্তা পাঠান", needName: true, needPhone: false, location: false, files: false },
};
const MAX_FILES = 3;
const MAX_MB = 25;

export default function ReportForm({ kind }) {
  const c = CFG[kind];
  const toast = useToast();
  const [f, setF] = useState({ name: "", phone: "", email: "", subject: "", details: "", location: "" });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const p = (k) => ({ id: k, value: f[k], onChange: set(k), "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-err` : undefined });

  function addFiles(e) {
    const picked = [...e.target.files];
    e.target.value = "";
    const bad = picked.find((x) => x.size > MAX_MB * 1024 * 1024);
    if (bad) return toast.error(`প্রতিটি ফাইলের আকার সর্বোচ্চ ${MAX_MB} এমবি হতে পারবে।`);
    setFiles((cur) => [...cur, ...picked].slice(0, MAX_FILES));
  }

  async function submit(e) {
    e.preventDefault();
    const v = {};
    if (c.needName && !f.name.trim()) v.name = "অনুগ্রহ করে আপনার নাম লিখুন।";
    if (c.needPhone && !f.phone.trim()) v.phone = "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।";
    else if (f.phone.trim() && !isValidPhone(f.phone)) v.phone = "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।";
    if (kind === "contact" && !f.email.trim() && !f.phone.trim()) v.email = "ইমেইল অথবা মোবাইল নম্বর দিন।";
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) v.email = "সঠিক ইমেইল ঠিকানা দিন।";
    if (!f.details.trim()) v.details = "অনুগ্রহ করে বিস্তারিত লিখুন।";
    setErrors(v);
    if (Object.keys(v).length) return document.getElementById(Object.keys(v)[0])?.focus();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, val]) => fd.append(k, val));
      files.forEach((x) => fd.append("evidence", x));
      await submitReport(kind, fd);
      setDone(true);
    } catch (er) {
      if (er.errors) setErrors(er.errors);
      toast.error(er.message);
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-800">আপনার অনুরোধটি সফলভাবে জমা দেওয়া হয়েছে।</p>
        <p className="mt-2 text-sm text-emerald-700">আমাদের প্রতিনিধি বিষয়টি পর্যালোচনা করবেন। ধন্যবাদ।</p>
        <button className="btn-outline mt-5" onClick={() => { setDone(false); setF({ name: "", phone: "", email: "", subject: "", details: "", location: "" }); setFiles([]); }}>আরও একটি জমা দিন</button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="নাম" required={c.needName} error={errors.name}><input className="input" autoComplete="name" {...p("name")} /></Field>
        <Field id="phone" label="মোবাইল নম্বর" required={c.needPhone} error={errors.phone}><input type="tel" className="input" placeholder="01XXXXXXXXX" {...p("phone")} /></Field>
        {kind !== "emergency" && <Field id="email" label="ইমেইল" error={errors.email}><input type="email" className="input" {...p("email")} /></Field>}
        <Field id="subject" label={c.subject}><input className="input" {...p("subject")} /></Field>
      </div>
      {c.location && <Field id="location" label="অবস্থান / ঠিকানা"><input className="input" placeholder="কোথায় সহায়তা প্রয়োজন" {...p("location")} /></Field>}
      <Field id="details" label="বিস্তারিত" required error={errors.details}><textarea rows={5} maxLength={4000} className="input" {...p("details")} /></Field>
      {c.files && (
        <div>
          <span className="label">ছবি, অডিও বা ভিডিও (ঐচ্ছিক, সর্বোচ্চ {MAX_FILES}টি)</span>
          <input ref={fileRef} type="file" multiple accept="image/*,audio/*,video/*" className="sr-only" id="evidence" onChange={addFiles} />
          <button type="button" className="btn-outline btn-sm" onClick={() => fileRef.current.click()} disabled={files.length >= MAX_FILES}>ফাইল যুক্ত করুন</button>
          <ul className="mt-2 space-y-1 text-sm">
            {files.map((x, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                <span className="truncate">{x.name}</span>
                <button type="button" className="ml-3 text-red-600" onClick={() => setFiles(files.filter((_, n) => n !== i))} aria-label={`${x.name} সরিয়ে দিন`}>সরান</button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">আপনার পাঠানো ফাইল ও তথ্য জনসমক্ষে প্রকাশ করা হবে না।</p>
        </div>
      )}
      <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? "পাঠানো হচ্ছে..." : c.submit}</button>
    </form>
  );
}
