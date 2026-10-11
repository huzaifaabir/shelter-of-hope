import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading } from "./Feedback";

// Any logged-in public user
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}

function Denied() {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl">প্রবেশ নিষিদ্ধ</h1>
      <p role="alert" className="max-w-md text-muted">আপনার অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।</p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary">হোম পেজে যান</Link>
        <button className="btn-outline" onClick={logout}>লগআউট</button>
      </div>
    </div>
  );
}

// Admin area: Editor or Administrator (role verified by backend /api/me)
export function RequireStaff({ children, administratorOnly = false }) {
  const { user, loading, isStaff, isAdministrator, profile } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!profile) return <Loading />;
  if (!isStaff || (administratorOnly && !isAdministrator)) return <Denied />;
  return children;
}
