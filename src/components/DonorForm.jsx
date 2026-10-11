import { useState } from "react";
import { BLOOD_GROUPS, DIVISIONS, LOCATIONS } from "../lib/constants";
import { isValidPhone } from "../lib/bn";
import { Field } from "./Feedback";
import ImageUpload from "./ImageUpload";

const TODAY = new Date().toISOString().slice(0, 10);

const empty = {
  name: "", image: "", bloodGroup: "", availability: "available", lastDonationDate: "", phone: "", phonePublic: true,
  division: "", district: "", upazila: "", unionOrThana: "", village: "", additionalInfo: "", donationCount: 0, consent: false,
};

export function validateDonor(f, { needConsent = true } = {}) {
  const e = {};
  if (!f.name.trim()) e.name = "অনুগ্রহ করে আপনার নাম লিখুন।";
  if (!f.bloodGroup) e.bloodGroup = "অনুগ্রহ করে রক্তের গ্রুপ নির্বাচন করুন।";
  if (!f.phone.trim()) e.phone = "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।";
  else if (!isValidPhone(f.phone)) e.phone = "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।";
  if (!f.division) e.division = "অনুগ্রহ করে বিভাগ নির্বাচন করুন।";
  if (!f.district) e.district = "অনুগ্রহ করে জেলা নির্বাচন করুন।";
  if (!f.upazila.trim()) e.upazila = "অনুগ্রহ করে উপজেলা লিখুন।";
  if (!f.village.trim()) e.village = "অনুগ্রহ করে গ্রামের নাম লিখুন।";
  if (needConsent && !f.consent) e.consent = "অনুগ্রহ করে সম্মতি প্রদান করুন।";
  return e;
}

export default function DonorForm({ initial, onSubmit, submitText = "রক্তদাতা হিসেবে নিবন্ধন করুন", editing = false, serverErrors = {}, imageFolder = "donors", showCount = false }) {
  const [f, setF] = useState(() => ({
    ...empty,
    ...(initial || {}),
    lastDonationDate: initial?.lastDonationDate ? String(initial.lastDonationDate).slice(0, 10) : "",
    consent: editing ? true : false,
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const err = { ...serverErrors, ...errors };
  const props = (k) => ({
    id: k,
    "aria-invalid": !!err[k],
    "aria-describedby": err[k] ? `${k}-err` : undefined,
    value: f[k],
    onChange: (e) => set(k, e.target.value),
  });

  async function submit(e) {
    e.preventDefault();
    const v = validateDonor(f, { needConsent: !editing });
    setErrors(v);
    if (Object.keys(v).length) {
      document.getElementById(Object.keys(v)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ ...f, lastDonationDate: f.lastDonationDate || null });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div>
        <span className="label">প্রোফাইল ছবি</span>
        <ImageUpload value={f.image} onChange={(u) => set("image", u)} folder={imageFolder} round label="ছবি আপলোড করুন" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="নাম" required error={err.name}><input className="input" placeholder="আপনার পূর্ণ নাম" autoComplete="name" {...props("name")} /></Field>
        <Field id="bloodGroup" label="রক্তের গ্রুপ" required error={err.bloodGroup}>
          <select className="input" {...props("bloodGroup")}>
            <option value="">নির্বাচন করুন</option>
            {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field id="availability" label="রক্ত দেওয়ার বর্তমান অবস্থা">
          <select className="input" {...props("availability")}>
            <option value="available">রক্ত দিতে পারবেন</option>
            <option value="unavailable">বর্তমানে অনুপলব্ধ</option>
          </select>
        </Field>
        <Field id="lastDonationDate" label="সর্বশেষ রক্তদানের তারিখ" error={err.lastDonationDate} hint="আগে রক্ত না দিয়ে থাকলে ফাঁকা রাখুন">
          <input type="date" className="input" max={TODAY} {...props("lastDonationDate")} />
        </Field>
        <Field id="phone" label="মোবাইল নম্বর" required error={err.phone}><input type="tel" inputMode="tel" className="input" placeholder="01XXXXXXXXX" autoComplete="tel" {...props("phone")} /></Field>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[#c2005a]" checked={f.phonePublic} onChange={(e) => set("phonePublic", e.target.checked)} />
            আমার মোবাইল নম্বর সবার জন্য দৃশ্যমান থাকুক
          </label>
        </div>
        <Field id="division" label="বিভাগ" required error={err.division}>
          <select className="input" id="division" aria-invalid={!!err.division} value={f.division} onChange={(e) => setF((s) => ({ ...s, division: e.target.value, district: "" }))}>
            <option value="">নির্বাচন করুন</option>
            {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field id="district" label="জেলা" required error={err.district}>
          <select className="input" disabled={!f.division} {...props("district")}>
            <option value="">{f.division ? "নির্বাচন করুন" : "আগে বিভাগ নির্বাচন করুন"}</option>
            {(LOCATIONS[f.division] || []).map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field id="upazila" label="উপজেলা" required error={err.upazila}><input className="input" placeholder="যেমন: সাভার" {...props("upazila")} /></Field>
        <Field id="unionOrThana" label="ইউনিয়ন/থানা"><input className="input" {...props("unionOrThana")} /></Field>
        <Field id="village" label="গ্রাম" required error={err.village}><input className="input" {...props("village")} /></Field>
        {showCount && <Field id="donationCount" label="মোট রক্তদানের সংখ্যা"><input type="number" min="0" className="input" {...props("donationCount")} /></Field>}
      </div>
      <Field id="additionalInfo" label="অতিরিক্ত তথ্য">
        <textarea rows={3} maxLength={1000} className="input" placeholder="যেমন: কোন সময়ে যোগাযোগ করা ভালো" {...props("additionalInfo")} />
      </Field>
      {!editing && (
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input id="consent" type="checkbox" className="mt-1 h-4 w-4 accent-[#c2005a]" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} aria-invalid={!!err.consent} />
            <span>আমি স্বেচ্ছায় রক্তদাতা তালিকায় আমার নাম, রক্তের গ্রুপ ও এলাকার তথ্য প্রকাশ করার সম্মতি দিচ্ছি। প্রয়োজনে যেকোনো সময় আমি নিজেকে এই তালিকা থেকে সরিয়ে নিতে পারব।</span>
          </label>
          {err.consent && <p role="alert" className="mt-1 text-sm text-red-600">{err.consent}</p>}
        </div>
      )}
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? "সংরক্ষণ করা হচ্ছে..." : submitText}</button>
    </form>
  );
}
