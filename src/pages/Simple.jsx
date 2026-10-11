import { PageHeader, Loading } from "../components/Feedback";
import ReportForm from "../components/ReportForm";
import { getContent } from "../services/heroService";
import { useAsync } from "../lib/useAsync";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export function Emergency() {
  return (
    <>
      <Seo title="জরুরি সহায়তা" description="জরুরি বা সংকটকালীন সহায়তার জন্য আপনার অনুরোধ জানান।" />
      <PageHeader eyebrow="জরুরি সহায়তা" title="জরুরি সহায়তার অনুরোধ">আপনার বা অন্য কারও জরুরি সহায়তা প্রয়োজন হলে নিচের ফর্মটি পূরণ করুন। আপনার তথ্য গোপন রাখা হবে।</PageHeader>
      <div className="container-x section !pt-8 max-w-3xl">
        <div role="note" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          প্রাণঘাতী বা অত্যন্ত জরুরি পরিস্থিতিতে প্রথমে <strong>৯৯৯</strong> নম্বরে কল করুন। এই ফর্মের অনুরোধ পর্যালোচনায় কিছু সময় লাগতে পারে।
        </div>
        <div className="card p-6 sm:p-8"><ReportForm kind="emergency" /></div>
      </div>
    </>
  );
}

export function Complaints() {
  return (
    <>
      <Seo title="অভিযোগ" description="অভিযোগ বা উদ্বেগের বিষয় নিরাপদে জানান।" />
      <PageHeader eyebrow="অভিযোগ ও মতামত" title="অভিযোগ জানান">কোনো অনিয়ম বা উদ্বেগের বিষয় থাকলে এখানে জানান। আপনার তথ্য জনসমক্ষে প্রকাশ করা হবে না।</PageHeader>
      <div className="container-x section !pt-8 max-w-3xl"><div className="card p-6 sm:p-8"><ReportForm kind="complaint" /></div></div>
    </>
  );
}

const Item = ({ k, v }) => (
  <div><dt className="text-sm text-muted">{k}</dt><dd className="font-medium">{v || "শীঘ্রই যুক্ত করা হবে"}</dd></div>
);

export function Contact() {
  const { data: s, loading } = useAsync(() => getContent("settings"), []);
  return (
    <>
      <Seo title="যোগাযোগ" description="Shelter of Hope-এর সঙ্গে যোগাযোগ করুন।" />
      <PageHeader eyebrow="যোগাযোগ" title="আমাদের সঙ্গে যোগাযোগ করুন">আপনার প্রশ্ন বা পরামর্শ আমাদের জানান।</PageHeader>
      <div className="container-x section !pt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="card h-fit p-6">
          {loading ? <Loading /> : (
            <dl className="space-y-4">
              <Item k="প্রতিষ্ঠান" v={s?.orgName} />
              <Item k="ঠিকানা" v={s?.address} />
              <Item k="ফোন" v={s?.phone} />
              <Item k="ইমেইল" v={s?.email} />
              <div>
                <dt className="text-sm text-muted">সোশ্যাল মিডিয়া</dt>
                <dd className="flex gap-4 font-medium">
                  {s?.facebook ? <a className="text-brand-700" href={s.facebook} target="_blank" rel="noopener noreferrer">ফেসবুক</a> : null}
                  {s?.youtube ? <a className="text-brand-700" href={s.youtube} target="_blank" rel="noopener noreferrer">ইউটিউব</a> : null}
                  {!s?.facebook && !s?.youtube && "শীঘ্রই যুক্ত করা হবে"}
                </dd>
              </div>
            </dl>
          )}
          <p className="mt-6 border-t border-line pt-4 text-sm text-muted">জরুরি সহায়তার জন্য <Link to="/emergency" className="font-semibold text-brand-700">এই পাতায়</Link> যান।</p>
        </aside>
        <div className="card p-6 sm:p-8"><h2 className="mb-5 text-xl">বার্তা পাঠান</h2><ReportForm kind="contact" /></div>
      </div>
    </>
  );
}

export function NotFound() {
  return (
    <div className="container-x section text-center">
      <Seo title="পাতাটি পাওয়া যায়নি" />
      <h1 className="text-3xl">পাতাটি পাওয়া যায়নি</h1>
      <p className="mt-2 text-muted">আপনি যে পাতাটি খুঁজছেন তা নেই অথবা সরিয়ে নেওয়া হয়েছে।</p>
      <Link to="/" className="btn-primary mt-6">হোম পেজে ফিরে যান</Link>
    </div>
  );
}
