
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Logo } from "./Brand";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/", "হোম"],
  ["/about", "আমাদের সম্পর্কে"],
  ["/missing-children", "নিখোঁজ ব্যক্তির তথ্য"],
  ["/emergency", "জরুরি সহায়তা"],
  ["/contact", "যোগাযোগ"],
  ["/donors", "রক্তদাতা"],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const cls = ({ isActive }) =>
    `rounded-md px-2.5 py-2 text-[15px] font-medium transition ${
      isActive
        ? "text-brand-700"
        : "text-slate-700 hover:text-brand-700"
    }`;

  async function handleLogout() {
    try {
      await logout();
      setOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-x flex h-[68px] items-center justify-between gap-4">
        <Logo className="h-11" />

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="প্রধান মেনু"
        >
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={cls}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop account buttons */}
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/profile" className="btn-outline btn-sm">
                প্রোফাইল
              </Link>

              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={handleLogout}
              >
                লগআউট
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary btn-sm">
              লগইন
            </Link>
          )}

          {isStaff && (
            <Link
              to="/admin"
              className="text-xs text-muted hover:text-brand-700"
            >
              অ্যাডমিন প্যানেল
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="rounded-md p-2 lg:hidden"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-line bg-white lg:hidden"
        >
          <nav
            className="container-x flex flex-col py-3"
            aria-label="মোবাইল মেনু"
            onClick={() => setOpen(false)}
          >
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={cls}
              >
                {label}
              </NavLink>
            ))}

            <NavLink to="/be-a-donor" className={cls}>
              ＋ রক্তদাতা হোন
            </NavLink>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              {user ? (
                <>
                  <Link to="/profile" className="btn-outline btn-sm">
                    প্রোফাইল
                  </Link>

                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={handleLogout}
                  >
                    লগআউট
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-primary btn-sm">
                    লগইন
                  </Link>

                  <Link to="/register" className="btn-outline btn-sm">
                    নতুন অ্যাকাউন্ট
                  </Link>
                </>
              )}

              <Link
                to="/admin/login"
                className="ml-auto text-xs text-muted"
              >
                অ্যাডমিন লগইন
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
