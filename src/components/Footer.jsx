import { Link } from "react-router-dom";
import { iconMark } from "./Brand";
import { getContent } from "../services/heroService";
import { useAsync } from "../lib/useAsync";

export default function Footer() {
  const { data: s } = useAsync(() => getContent("settings"), []);
  const col = "space-y-2 text-sm text-slate-300";
  const a = "hover:text-white";
  return (
    <footer className="mt-10 bg-[#1a0610] text-slate-300">
      <div className="container-x grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={iconMark} alt="" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white">Shelter of Hope</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7">{s?.footerText || "নারী ও শিশু সুরক্ষা ও মানবিক সহায়তার একটি উদ্যোগ।"}</p>
          <div className="mt-4 flex gap-4 text-sm">
            {s?.facebook && <a className={a} href={s.facebook} target="_blank" rel="noopener noreferrer">ফেসবুক</a>}
            {s?.youtube && <a className={a} href={s.youtube} target="_blank" rel="noopener noreferrer">ইউটিউব</a>}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-base !text-white">গুরুত্বপূর্ণ লিংক</h2>
          <ul className={col}>
            <li><Link className={a} to="/donors">রক্তদাতা খুঁজুন</Link></li>
            <li><Link className={a} to="/be-a-donor">রক্তদাতা হোন</Link></li>
            <li><Link className={a} to="/missing-children">নিখোঁজ শিশু</Link></li>
            <li><Link className={a} to="/emergency">জরুরি সহায়তা</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-base !text-white">সংস্থা</h2>
          <ul className={col}>
            <li><Link className={a} to="/about">আমাদের সম্পর্কে</Link></li>
            <li><Link className={a} to="/complaints">অভিযোগ জানান</Link></li>
            <li><Link className={a} to="/contact">যোগাযোগ</Link></li>
            <li><Link className="text-xs text-slate-400 hover:text-white" to="/admin/login">অ্যাডমিন লগইন</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">© Shelter of Hope</div>
    </footer>
  );
}
