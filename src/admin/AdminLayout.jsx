
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { iconMark } from "../components/Brand";
import { ROLE_LABEL } from "../lib/constants";
import { listMissingAdmin } from "../services/adminService";

const nav = [
  ["/admin", "ড্যাশবোর্ড", false, true],
  ["/admin/donors", "রক্তদাতা", false],
  ["/admin/hero", "হিরো সেকশন", false],
  ["/admin/homepage", "হোমপেজ", false],
  ["/admin/missing-children", "নিখোঁজ ব্যক্তি", false],
  ["/admin/emergency", "জরুরি সহায়তা", false],
  ["/admin/complaints", "অভিযোগ", false],
  ["/admin/contact", "যোগাযোগ", false],
  ["/admin/users", "ব্যবহারকারী", true],
  ["/admin/settings", "ওয়েবসাইট সেটিংস", true],
  ["/admin/team-members", "টিম সদস্য", false],
];

export default function AdminLayout() {
  const { profile, isAdministrator, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pendingMissing, setPendingMissing] = useState(0);
  const navigate = useNavigate();

  const items = nav.filter(
    ([, , adminOnly]) => !adminOnly || isAdministrator
  );

  // Pending রিপোর্টের সংখ্যা Backend থেকে নেওয়া হবে।
  useEffect(() => {
    let active = true;
    let loading = false;

    const loadPendingMissing = async () => {
      if (loading) return;
      loading = true;

      try {
        const response = await listMissingAdmin();
        const reports = Array.isArray(response?.items)
          ? response.items
          : [];

        const count = reports.filter(
          (report) => report.published !== true
        ).length;

        if (active) {
          setPendingMissing(count);
        }
      } catch (error) {
        // সাময়িক API সমস্যা হলে আগের সংখ্যা রাখা হবে।
        console.error("Pending missing reports load failed:", error);
      } finally {
        loading = false;
      }
    };

    const isStaff =
      profile?.role === "administrator" ||
      profile?.role === "editor";

    if (isStaff) {
      loadPendingMissing();

      // প্রতি 15 সেকেন্ডে সংখ্যা আপডেট হবে।
      const timer = setInterval(loadPendingMissing, 15000);

      // Admin tab-এ ফিরে এলে দ্রুত আপডেট।
      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          loadPendingMissing();
        }
      };

      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        active = false;
        clearInterval(timer);
        document.removeEventListener(
          "visibilitychange",
          handleVisibility
        );
      };
    }

    setPendingMissing(0);

    return () => {
      active = false;
    };
  }, [profile?.role]);

  const link = ({ isActive }) =>
    `flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-50 text-brand-700"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded p-1.5 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="মেনু"
            aria-expanded={open}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <img src={iconMark} alt="" className="h-8 w-auto" />
          <span className="font-bold">অ্যাডমিন প্যানেল</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">
            {profile?.name || profile?.email} ·{" "}
            {ROLE_LABEL[profile?.role]}
          </span>

          <Link to="/" className="text-brand-700">
            ওয়েবসাইট
          </Link>

          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={async () => {
              await logout();
              navigate("/admin/login");
            }}
          >
            লগআউট
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <aside
          className={`${
            open ? "block" : "hidden"
          } fixed inset-x-0 top-14 z-30 border-b border-line bg-white p-3 lg:static lg:block lg:min-h-[calc(100vh-56px)] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r`}
        >
          <nav
            className="space-y-1"
            aria-label="অ্যাডমিন মেনু"
            onClick={() => setOpen(false)}
          >
            {items.map(([to, label, , end]) => {
              const isMissingMenu =
                to === "/admin/missing-children";

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={!!end}
                  className={link}
                >
                  <span>{label}</span>

                  {isMissingMenu && pendingMissing > 0 && (
                    <span
                      className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white shadow-sm"
                      title={`${pendingMissing}টি রিপোর্ট যাচাইয়ের অপেক্ষায়`}
                      aria-label={`${pendingMissing}টি Pending রিপোর্ট`}
                    >
                      {pendingMissing > 99 ? "99+" : pendingMissing}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
