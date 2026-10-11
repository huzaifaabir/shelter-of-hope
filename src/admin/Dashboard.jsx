import { Link } from "react-router-dom";
import { AsyncView, Title } from "./AdminUI";
import { getStats } from "../services/adminService";
import { useAsync } from "../lib/useAsync";
import { useAuth } from "../context/AuthContext";
import { toBn, formatDate } from "../lib/bn";

const Card = ({ label, value, to }) => {
  const body = (
    <div className="card p-5 transition hover:border-brand-500/50">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-brand-700">{toBn(value)}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

export default function Dashboard() {
  const state = useAsync(getStats, []);
  const { isAdministrator } = useAuth();
  const s = state.data;
  return (
    <>
      <Title>ড্যাশবোর্ড</Title>
      <AsyncView state={state}>
        {s && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Card label="মোট রক্তদাতা" value={s.totalDonors} to="/admin/donors" />
              <Card label="বর্তমানে রক্ত দিতে পারবেন" value={s.available} />
              <Card label="বর্তমানে অনুপলব্ধ" value={s.unavailable} />
              <Card label="মোট ব্যবহারকারী" value={s.totalUsers} to={isAdministrator ? "/admin/users" : undefined} />
              <Card label="মোট Editor" value={s.editors} to={isAdministrator ? "/admin/users" : undefined} />
              <Card label="মোট Administrator" value={s.administrators} to={isAdministrator ? "/admin/users" : undefined} />
              <Card label="মোট নিখোঁজ শিশু" value={s.totalMissing} to="/admin/missing-children" />
              <Card label="মোট জরুরি আবেদন" value={s.totalEmergency} to="/admin/emergency" />
              <Card label="মোট অভিযোগ" value={s.totalComplaints} to="/admin/complaints" />
              <Card label="নতুন জরুরি অনুরোধ" value={s.newEmergency} to="/admin/emergency" />
              <Card label="নতুন অভিযোগ" value={s.newComplaints} to="/admin/complaints" />
              <Card label="চলমান নিখোঁজ শিশুর কেস" value={s.missing} to="/admin/missing-children" />
            </div>
            <h2 className="mb-3 mt-10 text-lg">সাম্প্রতিক রক্তদাতা</h2>
            <div className="card divide-y divide-line">
              {s.recent.length ? s.recent.map((d) => (
                <div key={d.donorId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium">{d.name} <span className="text-brand-700">{d.bloodGroup}</span></span>
                  <span className="text-muted">{d.upazila}, {d.district} · {formatDate(d.createdAt)}</span>
                </div>
              )) : <p className="p-6 text-center text-muted">বর্তমানে কোনো রক্তদাতা পাওয়া যায়নি।</p>}
            </div>
          </>
        )}
      </AsyncView>
    </>
  );
}
