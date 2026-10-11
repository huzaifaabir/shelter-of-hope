import { AVAILABILITY, BLOOD_GROUPS } from "../lib/constants";

export function BloodGroupFilter({ value, onChange }) {
  return (
    <fieldset>
      <legend className="label">রক্তের গ্রুপ</legend>
      <div className="flex flex-wrap gap-2">
        {["", ...BLOOD_GROUPS].map((g) => (
          <button
            key={g || "all"}
            type="button"
            aria-pressed={value === g}
            onClick={() => onChange(g)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${value === g ? "border-transparent bg-gradient-to-br from-brand-500 to-brand-700 text-white" : "border-line bg-white text-ink hover:border-brand-500"}`}
          >
            {g || "সব"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function AvailabilityFilter({ value, onChange }) {
  return (
    <div>
      <label htmlFor="avail" className="label">রক্ত দেওয়ার অবস্থা</label>
      <select id="avail" className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">সব</option>
        <option value="available">{AVAILABILITY.available}</option>
        <option value="unavailable">{AVAILABILITY.unavailable}</option>
      </select>
    </div>
  );
}

export default function DonorSearch({ search, onSearch, bloodGroup, onBloodGroup, availability, onAvailability, onReset }) {
  return (
    <section className="card space-y-5 p-5" aria-label="রক্তদাতা খোঁজার ফিল্টার">
      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <div>
          <label htmlFor="q" className="label">নাম অথবা এলাকা দিয়ে খুঁজুন</label>
          <input id="q" type="search" className="input" placeholder="নাম, গ্রাম, উপজেলা, জেলা বা বিভাগ" value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <AvailabilityFilter value={availability} onChange={onAvailability} />
      </div>
      <BloodGroupFilter value={bloodGroup} onChange={onBloodGroup} />
      {(search || bloodGroup || availability) && (
        <button type="button" onClick={onReset} className="text-sm font-semibold text-brand-700 hover:underline">ফিল্টার মুছে ফেলুন</button>
      )}
    </section>
  );
}
