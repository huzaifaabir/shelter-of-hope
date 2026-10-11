import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authMessage, fetchMe } from "../services/authService";
import { Field, Loading } from "../components/Feedback";
import { iconMark } from "../components/Brand";
import Seo from "../components/Seo";

export default function AdminLogin() {
  const { login, logout, isStaff, user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (user && isStaff) return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!f.email.trim() || !f.password) return setError("অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিন।");
    setBusy(true);
    try {
      await login(f.email, f.password);
      const me = await fetchMe(); // role verified by the backend
      if (me.role !== "administrator" && me.role !== "editor") {
        await logout();
        return setError("আপনার এই প্যানেলে প্রবেশের অনুমতি নেই।");
      }
      await refreshProfile();
      navigate("/admin", { replace: true });
    } catch (er) {
      setError(er.status ? er.message : authMessage(er));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Seo title="অ্যাডমিন লগইন" />
      <div className="card w-full max-w-sm p-7">
        <img src={iconMark} alt="Shelter of Hope" className="mx-auto h-14 w-auto" />
        <h1 className="mt-4 text-center text-xl">অ্যাডমিন প্যানেল</h1>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <Field id="email" label="ইমেইল"><input id="email" type="email" className="input" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field id="password" label="পাসওয়ার্ড"><input id="password" type="password" className="input" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "অপেক্ষা করুন..." : "অ্যাডমিন প্যানেলে প্রবেশ করুন"}</button>
        </form>
        {user && !isStaff && (
          <button className="mt-3 w-full text-sm text-muted underline" onClick={logout}>লগআউট</button>
        )}
        <Link to="/" className="mt-5 block text-center text-sm text-muted hover:text-brand-700">← ওয়েবসাইটে ফিরে যান</Link>
      </div>
    </div>
  );
}
