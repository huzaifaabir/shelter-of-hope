
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authMessage } from "../services/authService";
import { Field } from "../components/Feedback";
import Seo from "../components/Seo";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  bloodGroup: "",
  division: "",
  district: "",
  upazila: "",
  village: "",
  password: "",
  confirm: "",
};

const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export default function AuthPage({ mode = "login" }) {
  const isLogin = mode === "login";

  const { login, register, loginGoogle, resetPassword } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [f, setF] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.value;

    setF((previous) => ({
      ...previous,
      [key]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [key]: "",
    }));
  };

  function validate() {
    const validationErrors = {};

    if (!isLogin) {
      if (!f.name.trim()) {
        validationErrors.name = "আপনার নাম লিখুন।";
      }

      if (!f.phone.trim()) {
        validationErrors.phone = "ফোন নম্বর লিখুন।";
      } else if (!/^(?:\+?8801|01)[3-9]\d{8}$/.test(f.phone.trim())) {
        validationErrors.phone =
          "সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।";
      }

      if (!f.bloodGroup) {
        validationErrors.bloodGroup =
          "রক্তের গ্রুপ নির্বাচন করুন।";
      }

      if (!f.division.trim()) {
        validationErrors.division = "বিভাগ লিখুন।";
      }

      if (!f.district.trim()) {
        validationErrors.district = "জেলা লিখুন।";
      }

      if (!f.upazila.trim()) {
        validationErrors.upazila = "উপজেলা লিখুন।";
      }

      if (!f.village.trim()) {
        validationErrors.village =
          "গ্রাম বা এলাকার নাম লিখুন।";
      }
    }

    if (!f.email.trim()) {
      validationErrors.email = "ইমেইল ঠিকানা লিখুন।";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())
    ) {
      validationErrors.email =
        "সঠিক ইমেইল ঠিকানা লিখুন।";
    }

    if (!f.password) {
      validationErrors.password = "পাসওয়ার্ড লিখুন।";
    } else if (!isLogin && f.password.length < 6) {
      validationErrors.password =
        "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।";
    }

    if (!isLogin && f.confirm !== f.password) {
      validationErrors.confirm =
        "পাসওয়ার্ড দুটি মিলছে না।";
    }

    return validationErrors;
  }

  async function submit(e) {
    e.preventDefault();

    setFormError("");
    setInfo("");

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      if (isLogin) {
        await login(f.email.trim(), f.password);
      } else {
        await register({
          name: f.name.trim(),
          email: f.email.trim(),
          phone: f.phone.trim(),
          bloodGroup: f.bloodGroup,
          division: f.division.trim(),
          district: f.district.trim(),
          upazila: f.upazila.trim(),
          village: f.village.trim(),
          password: f.password,
        });
      }

      navigate(from, { replace: true });
    } catch (er) {
      setFormError(authMessage(er));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setFormError("");
    setInfo("");
    setBusy(true);

    try {
      await loginGoogle();
      navigate(from, { replace: true });
    } catch (er) {
      setFormError(authMessage(er));
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    setFormError("");
    setInfo("");

    if (!f.email.trim()) {
      setErrors({
        email:
          "পাসওয়ার্ড রিসেট করতে আগে আপনার ইমেইল লিখুন।",
      });
      return;
    }

    setBusy(true);

    try {
      await resetPassword(f.email.trim());
      setInfo(
        "পাসওয়ার্ড রিসেটের লিংক আপনার ইমেইলে পাঠানো হয়েছে।"
      );
    } catch (er) {
      setFormError(authMessage(er));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-x section">
      <Seo title={isLogin ? "লগইন" : "নতুন অ্যাকাউন্ট"} />

      <div className="card mx-auto max-w-xl p-6 sm:p-8">
        <h1 className="text-2xl">
          {isLogin
            ? "অ্যাকাউন্টে লগইন করুন"
            : "নতুন অ্যাকাউন্ট খুলুন"}
        </h1>

        <p className="mt-1 text-sm text-muted">
          {isLogin
            ? "আপনার অ্যাকাউন্টে প্রবেশ করুন।"
            : "নিবন্ধন করতে নিচের সব তথ্য পূরণ করুন।"}
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="mt-6 space-y-4"
        >
          {!isLogin && (
            <>
              <Field
                id="name"
                label="পূর্ণ নাম *"
                error={errors.name}
              >
                <input
                  id="name"
                  className="input"
                  autoComplete="name"
                  value={f.name}
                  onChange={set("name")}
                  required
                />
              </Field>

              <Field
                id="phone"
                label="মোবাইল নম্বর *"
                error={errors.phone}
              >
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  value={f.phone}
                  onChange={set("phone")}
                  required
                />
              </Field>

              <Field
                id="bloodGroup"
                label="রক্তের গ্রুপ *"
                error={errors.bloodGroup}
              >
                <select
                  id="bloodGroup"
                  className="input"
                  value={f.bloodGroup}
                  onChange={set("bloodGroup")}
                  required
                >
                  <option value="">
                    রক্তের গ্রুপ নির্বাচন করুন
                  </option>

                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="rounded-lg border border-line p-4">
                <h2 className="mb-4 font-semibold">
                  ঠিকানা *
                </h2>

                <div className="space-y-4">
                  <Field
                    id="division"
                    label="বিভাগ"
                    error={errors.division}
                  >
                    <input
                      id="division"
                      className="input"
                      autoComplete="address-level1"
                      value={f.division}
                      onChange={set("division")}
                      required
                    />
                  </Field>

                  <Field
                    id="district"
                    label="জেলা"
                    error={errors.district}
                  >
                    <input
                      id="district"
                      className="input"
                      autoComplete="address-level2"
                      value={f.district}
                      onChange={set("district")}
                      required
                    />
                  </Field>

                  <Field
                    id="upazila"
                    label="উপজেলা / থানা"
                    error={errors.upazila}
                  >
                    <input
                      id="upazila"
                      className="input"
                      value={f.upazila}
                      onChange={set("upazila")}
                      required
                    />
                  </Field>

                  <Field
                    id="village"
                    label="গ্রাম / এলাকা"
                    error={errors.village}
                  >
                    <input
                      id="village"
                      className="input"
                      autoComplete="street-address"
                      value={f.village}
                      onChange={set("village")}
                      required
                    />
                  </Field>
                </div>
              </div>
            </>
          )}

          <Field
            id="email"
            label="ইমেইল *"
            error={errors.email}
          >
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              value={f.email}
              onChange={set("email")}
              required
            />
          </Field>

          <Field
            id="password"
            label="পাসওয়ার্ড *"
            error={errors.password}
          >
            <input
              id="password"
              type="password"
              className="input"
              autoComplete={
                isLogin ? "current-password" : "new-password"
              }
              value={f.password}
              onChange={set("password")}
              required
            />
          </Field>

          {!isLogin && (
            <Field
              id="confirm"
              label="পাসওয়ার্ড আবার লিখুন *"
              error={errors.confirm}
            >
              <input
                id="confirm"
                type="password"
                className="input"
                autoComplete="new-password"
                value={f.confirm}
                onChange={set("confirm")}
                required
              />
            </Field>
          )}

          {formError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </p>
          )}

          {info && (
            <p
              role="status"
              className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            >
              {info}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy}
          >
            {busy
              ? "অপেক্ষা করুন..."
              : isLogin
                ? "লগইন করুন"
                : "অ্যাকাউন্ট খুলুন"}
          </button>

          {isLogin && (
            <button
              type="button"
              onClick={forgot}
              disabled={busy}
              className="block w-full text-center text-sm text-brand-700 hover:underline"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          )}
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          অথবা
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="btn-outline w-full"
        >
          গুগল দিয়ে চালিয়ে যান
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          {isLogin ? (
            <>
              অ্যাকাউন্ট নেই?{" "}
              <Link
                to="/register"
                state={{ from }}
                className="font-semibold text-brand-700"
              >
                নতুন অ্যাকাউন্ট খুলুন
              </Link>
            </>
          ) : (
            <>
              আগে থেকেই অ্যাকাউন্ট আছে?{" "}
              <Link
                to="/login"
                state={{ from }}
                className="font-semibold text-brand-700"
              >
                লগইন করুন
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
