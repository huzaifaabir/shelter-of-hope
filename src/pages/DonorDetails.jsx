import { Link, useParams } from "react-router-dom";
import { Avatar, AvailabilityBadge } from "../components/DonorCard";
import { Loading, ErrorState } from "../components/Feedback";
import { getDonor } from "../services/donorService";
import { useAsync } from "../lib/useAsync";
import { formatDate, toBn } from "../lib/bn";
import Seo from "../components/Seo";

const Row = ({ k, v }) => (
  <div className="flex justify-between gap-4 border-b border-line py-3 last:border-0">
    <dt className="text-muted">{k}</dt>
    <dd className="text-right font-medium">{v || "—"}</dd>
  </div>
);

export default function DonorDetails() {
  const { id } = useParams();
  const { data: d, loading, error, reload } = useAsync(() => getDonor(id), [id]);
  if (loading) return <Loading />;
  if (error) return <div className="container-x section"><ErrorState message={error} onRetry={reload} /><Link to="/donors" className="btn-outline mt-4">তালিকায় ফিরে যান</Link></div>;
  return (
    <div className="container-x section max-w-3xl">
      <Seo title={`${d.name} — ${d.bloodGroup} রক্তদাতা`} description={`${d.district}, ${d.upazila} এলাকার ${d.bloodGroup} গ্রুপের রক্তদাতা।`} />
      <Link to="/donors" className="text-sm font-semibold text-brand-700">← সব রক্তদাতা</Link>
      <article className="card mt-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar src={d.image} name={d.name} size="h-24 w-24" />
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl">{d.name}</h1>
            <div className="mt-2"><AvailabilityBadge value={d.availability} /></div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-3 text-center text-white">
            <div className="text-xs">রক্তের গ্রুপ</div>
            <div className="text-3xl font-extrabold">{d.bloodGroup}</div>
          </div>
        </div>
        <dl className="mt-6">
          <Row k="মোবাইল নম্বর" v={d.phone || "গোপন রাখা হয়েছে"} />
          <Row k="বিভাগ" v={d.division} />
          <Row k="জেলা" v={d.district} />
          <Row k="উপজেলা" v={d.upazila} />
          <Row k="ইউনিয়ন/থানা" v={d.unionOrThana} />
          <Row k="গ্রাম" v={d.village} />
          <Row k="সর্বশেষ রক্তদানের তারিখ" v={d.lastDonationDate ? formatDate(d.lastDonationDate) : ""} />
          <Row k="মোট রক্তদান" v={`${toBn(d.donationCount || 0)} বার`} />
          <Row k="নিবন্ধনের তারিখ" v={formatDate(d.createdAt)} />
        </dl>
        {d.additionalInfo && (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
            <h2 className="mb-1 text-base">অতিরিক্ত তথ্য</h2>
            <p className="text-muted">{d.additionalInfo}</p>
          </div>
        )}
        {d.phone && <a href={`tel:${d.phone}`} className="btn-primary mt-6 w-full sm:w-auto">কল করুন</a>}
      </article>
    </div>
  );
}
