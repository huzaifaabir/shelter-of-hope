
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
  ["/admin/missing", "নিখোঁজ ব্যক্তি", false],
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

  // Backend থেকে Pending নিখোঁজ রিপোর্টের সংখ্যা লোড করা।
  useEffect(() => {
    let active = true;
    let loading = false;

    const isStaff =
      profile?.role === "administrator" ||
      profile?.role === "editor";

    if (!isStaff) {
      setPendingMissing(0);

      return () => {
        active = false;
      };
    }

    const loadPendingMissing = async () => {
      if (!active || loading) return;

      loading = true;

      try {
        const response = await listMissingAdmin();

        // API response-এ items array থাকতে হবে।
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
        console.error(
          "Pending missing reports load failed:",
          error
        );

        // API ব্যর্থ হলে আগের কাউন্ট মুছে না দিয়ে রাখা হবে।
      } finally {
        loading = false;
      }
    };

    loadPendingMissing();

    // প্রতি ১৫ সেকেন্ডে Pending রিপোর্টের সংখ্যা আপডেট।
    const timer = setInterval(() => {
      loadPendingMissing();
    }, 15000);

    // ট্যাবে ফিরে এলে আবার রিপোর্ট লোড করা।
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadPendingMissing();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      active = false;

      clearInterval(timer);

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [profile?.role]);

  const link = ({ isActive }) =>
    `flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-50 text-brand-700"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  async function handleLogout() {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded p-1.5 lg:hidden"
            onClick={() => setOpen((previous) => !previous)}
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
              strokeLinejoin="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <img
            src={iconMark}
            alt=""
            className="h-8 w-auto"
          />

          <span className="font-bold">
            অ্যাডমিন প্যানেল
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">
            {profile?.name || profile?.email}
            {" · "}
            {ROLE_LABEL[profile?.role] || ""}
          </span>

          <Link
            to="/"
            className="text-brand-700"
          >
            ওয়েবসাইট
          </Link>

          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={handleLogout}
          >
            লগআউট
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
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
                to === "/admin/missing";

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
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white shadow-sm"
                      title={`${pendingMissing}টি রিপোর্ট যাচাইয়ের অপেক্ষায়`}
                      aria-label={`${pendingMissing}টি Pending রিপোর্ট`}
                    >
                      {pendingMissing > 99
                        ? "99+"
                        : pendingMissing}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Page content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
