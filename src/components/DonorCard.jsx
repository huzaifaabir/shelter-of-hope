import { Link } from "react-router-dom";
import { AVAILABILITY } from "../lib/constants";

export const Avatar = ({ src, name, size = "h-16 w-16" }) =>
  src ? (
    <img src={src} alt={`${name}-এর ছবি`} loading="lazy" className={`${size} shrink-0 rounded-full border border-line object-cover`} />
  ) : (
    <div aria-hidden="true" className={`${size} flex shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-700`}>
      {name?.trim()?.[0] || "?"}
    </div>
  );

export const AvailabilityBadge = ({ value }) => (
  <span className={`badge ${value === "available" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
    <span aria-hidden="true" className="mr-1">{value === "available" ? "●" : "○"}</span>
    {AVAILABILITY[value]}
  </span>
);

export default function DonorCard({ donor }) {
  return (
    <article className="card flex flex-col p-5 transition hover:border-brand-500/50 hover:shadow-md">
      <div className="flex items-start gap-4">
        <Avatar src={donor.image} name={donor.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg">{donor.name}</h3>
          <p className="mt-0.5 text-sm text-muted">{[donor.upazila, donor.district].filter(Boolean).join(", ")}</p>
        </div>
        <span className="rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 px-2.5 py-1 text-lg font-bold text-white" aria-label={`রক্তের গ্রুপ ${donor.bloodGroup}`}>
          {donor.bloodGroup}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <AvailabilityBadge value={donor.availability} />
        <span className="text-sm text-muted">{donor.phone ? donor.phone : "ফোন নম্বর গোপন"}</span>
      </div>
      <Link to={`/donor/${donor.donorId}`} className="btn-outline btn-sm mt-4">বিস্তারিত দেখুন</Link>
    </article>
  );
}
