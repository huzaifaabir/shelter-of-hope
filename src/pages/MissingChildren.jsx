
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  PageHeader,
  Loading,
  ErrorState,
  EmptyState,
} from "../components/Feedback";
import {
  getMissingPublic,
  listMissingPublic,
  listMyMissing,
  saveMyMissing,
} from "../services/adminService";
import { useAsync } from "../lib/useAsync";
import { formatDate, toBn } from "../lib/bn";
import { GENDER, MISSING_STATUS } from "../lib/constants";
import Seo from "../components/Seo";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const statusCls = {
  missing: "bg-red-50 text-red-700",
  investigating: "bg-amber-50 text-amber-700",
  found: "bg-emerald-50 text-emerald-700",
};

export const StatusBadge = ({ s }) => (
  <span className={`badge ${statusCls[s] || "bg-slate-100 text-slate-700"}`}>
    {MISSING_STATUS[s] || s}
  </span>
);

const Photo = ({ src, name, cls }) =>
  src ? (
    <img
      src={src}
      alt={`${name}-এর ছবি`}
      loading="lazy"
      className={`${cls} object-cover`}
    />
  ) : (
    <div
      className={`${cls} flex items-center justify-center bg-slate-100 text-sm text-muted`}
    >
      ছবি নেই
    </div>
  );

const emptyForm = {
  name: "",
  age: "",
  gender: "",
  missingDate: "",
  missingPlace: "",
  details: "",
  contactInfo: "",
};

export function MissingChildren() {
  const { user } = useAuth();
  const toast = useToast();

  const {
    data,
    loading,
    error,
    reload,
  } = useAsync(listMissingPublic, []);

  const mine = useAsync(
    () => (user ? listMyMissing() : Promise.resolve({ items: [] })),
    [user?.uid]
  );

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Preview-এর temporary URL পরিষ্কার করা
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function startEdit(item = null) {
    setEditItem(item);

    setForm(
      item
        ? {
            name: item.name || "",
            age: item.age ?? "",
            gender: item.gender || "",
            missingDate: item.missingDate
              ? String(item.missingDate).slice(0, 10)
              : "",
            missingPlace: item.missingPlace || "",
            details: item.details || "",
            contactInfo: item.contactInfo || "",
          }
        : { ...emptyForm }
    );

    setImageFile(null);
    setImagePreview(item?.image || "");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
    setImageFile(null);
    setImagePreview("");
    setForm({ ...emptyForm });
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("শুধু JPG, PNG, WEBP অথবা GIF ছবি নির্বাচন করুন।");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে।");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeSelectedImage() {
    setImageFile(null);
    setImagePreview(editItem?.image || "");

    const input = document.getElementById("missing-report-image");

    if (input) input.value = "";
  }

  async function submitReport(e) {
    e.preventDefault();

    if (!user) {
      toast.error("রিপোর্ট জমা দিতে আগে লগইন করুন।");
      return;
    }

    if (!form.name.trim()) {
      toast.error("নিখোঁজ ব্যক্তির নাম লিখুন।");
      return;
    }

    setBusy(true);

    try {
      const payload = new FormData();

      const reportData = {
        ...form,
        name: form.name.trim(),
        age: form.age === "" ? "" : Number(form.age),
        status: editItem?.status || "missing",
      };

      Object.entries(reportData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          payload.append(key, String(value));
        }
      });

      if (imageFile) {
        payload.append("image", imageFile);
      }

      await saveMyMissing(editItem?._id, payload);

      toast.success(
        editItem
          ? "রিপোর্ট আপডেট হয়েছে।"
          : "রিপোর্ট জমা হয়েছে। প্রকাশের আগে অ্যাডমিন যাচাই করবেন।"
      );

      closeForm();

      await Promise.all([
        Promise.resolve(mine.reload()),
        Promise.resolve(reload()),
      ]);
    } catch (er) {
      toast.error(er.message || "রিপোর্ট জমা দেওয়া যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo
        title="নিখোঁজ শিশু"
        description="নিখোঁজ শিশুদের তথ্য। কোনো তথ্য জানা থাকলে অনুগ্রহ করে যোগাযোগ করুন।"
      />

      <PageHeader
        eyebrow="সচেতনতা ও সহায়তা"
        title="নিখোঁজ ব্যক্তি খুঁজে পেতে সহায়তা করুন"
      >
        নিখোঁজ শিশু ও ব্যক্তিদের প্রকাশিত তথ্য দেখুন। কোনো তথ্য জানা থাকলে
        সংশ্লিষ্ট কর্তৃপক্ষের সঙ্গে যোগাযোগ করুন।
      </PageHeader>

      <div className="container-x section !pt-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-50 p-5">
          <div>
            <h2 className="text-lg">নিখোঁজ রিপোর্ট জমা দিতে চান?</h2>
            <p className="mt-1 text-sm text-muted">
              রিপোর্ট জমা দিন; প্রকাশের আগে অ্যাডমিন যাচাই করবেন।
            </p>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => startEdit()}
              className="btn-primary"
            >
              ＋ নিখোঁজ রিপোর্ট
            </button>
          ) : (
            <Link
              to="/login"
              state={{ from: "/missing-children" }}
              className="btn-primary"
            >
              লগইন করে রিপোর্ট দিন
            </Link>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={submitReport}
            className="card mb-8 space-y-5 p-5 sm:p-6"
          >
            <h2 className="text-xl">
              {editItem ? "রিপোর্ট সম্পাদনা করুন" : "নতুন নিখোঁজ রিপোর্ট"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                নাম *
                <input
                  required
                  maxLength={120}
                  className="input mt-1"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </label>

              <label className="text-sm font-semibold">
                বয়স
                <input
                  type="number"
                  min="0"
                  max="120"
                  className="input mt-1"
                  value={form.age}
                  onChange={(e) =>
                    setForm({ ...form, age: e.target.value })
                  }
                />
              </label>

              <label className="text-sm font-semibold">
                লিঙ্গ
                <select
                  className="input mt-1"
                  value={form.gender}
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value })
                  }
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="male">পুরুষ</option>
                  <option value="female">নারী</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </label>

              <label className="text-sm font-semibold">
                নিখোঁজ হওয়ার তারিখ
                <input
                  type="date"
                  className="input mt-1"
                  value={form.missingDate}
                  onChange={(e) =>
                    setForm({ ...form, missingDate: e.target.value })
                  }
                />
              </label>

              <label className="text-sm font-semibold sm:col-span-2">
                নিখোঁজ হওয়ার স্থান
                <input
                  className="input mt-1"
                  maxLength={300}
                  value={form.missingPlace}
                  onChange={(e) =>
                    setForm({ ...form, missingPlace: e.target.value })
                  }
                />
              </label>

              <label className="text-sm font-semibold sm:col-span-2">
                বিস্তারিত তথ্য
                <textarea
                  className="input mt-1"
                  rows="4"
                  maxLength={3000}
                  value={form.details}
                  onChange={(e) =>
                    setForm({ ...form, details: e.target.value })
                  }
                />
              </label>

              <label className="text-sm font-semibold sm:col-span-2">
                যোগাযোগের তথ্য
                <input
                  className="input mt-1"
                  maxLength={300}
                  value={form.contactInfo}
                  onChange={(e) =>
                    setForm({ ...form, contactInfo: e.target.value })
                  }
                />
              </label>
            </div>

            {/* ছবি নির্বাচন এবং Preview */}
            <div className="space-y-3 rounded-xl border border-line p-4">
              <label
                htmlFor="missing-report-image"
                className="block text-sm font-semibold"
              >
                নিখোঁজ ব্যক্তির ছবি
                <span className="mt-1 block font-normal text-muted">
                  JPG, PNG, WEBP অথবা GIF · সর্বোচ্চ ৫ MB
                </span>
              </label>

              <input
                id="missing-report-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="input"
                onChange={handleImageChange}
              />

              {imagePreview && (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="নির্বাচিত ছবির প্রিভিউ"
                    className="h-64 w-full rounded-lg bg-slate-100 object-contain"
                  />

                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={removeSelectedImage}
                  >
                    {imageFile
                      ? "নতুন ছবি বাতিল করুন"
                      : "নির্বাচিত ছবি পরিবর্তন করুন"}
                  </button>
                </div>
              )}

              {!imagePreview && (
                <p className="text-sm text-muted">
                  এখনো কোনো ছবি নির্বাচন করা হয়নি।
                </p>
              )}
            </div>

            <p className="text-xs text-muted">
              রিপোর্ট জমা হলে প্রকাশের আগে যাচাই করা হবে। ব্যক্তিগত সংবেদনশীল
              তথ্য প্রকাশ করবেন না।
            </p>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" disabled={busy}>
                {busy
                  ? "সংরক্ষণ হচ্ছে..."
                  : editItem
                    ? "রিপোর্ট আপডেট করুন"
                    : "রিপোর্ট জমা দিন"}
              </button>

              <button
                type="button"
                className="btn-outline"
                disabled={busy}
                onClick={closeForm}
              >
                বাতিল
              </button>
            </div>
          </form>
        )}

        {/* ব্যবহারকারীর জমা দেওয়া রিপোর্ট */}
        {user && mine.data?.items?.length > 0 && (
          <section className="card mb-8 p-5">
            <h2 className="text-lg">আমার জমা দেওয়া রিপোর্ট</h2>

            <div className="mt-3 divide-y divide-line">
              {mine.data.items.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-muted">
                        ছবি নেই
                      </div>
                    )}

                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted">
                        {item.published
                          ? "প্রকাশিত"
                          : "যাচাইয়ের অপেক্ষায়"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => startEdit(item)}
                  >
                    সম্পাদনা
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* প্রকাশিত রিপোর্ট */}
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data?.items?.length ? (
          <EmptyState text="বর্তমানে প্রকাশিত কোনো তথ্য নেই।" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((c) => (
              <article key={c._id} className="card overflow-hidden">
                <Photo src={c.image} name={c.name} cls="h-56 w-full" />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg">{c.name}</h2>
                    <StatusBadge s={c.status} />
                  </div>

                  <p className="mt-1 text-sm text-muted">
                    {c.age != null && `বয়স ${toBn(c.age)} বছর`}
                    {c.age != null && c.missingPlace && " · "}
                    {c.missingPlace}
                  </p>

                  <Link
                    to={`/missing-children/${c._id}`}
                    className="btn-outline btn-sm mt-4"
                  >
                    বিস্তারিত দেখুন
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function MissingChildDetails() {
  const { id } = useParams();

  const {
    data: c,
    loading,
    error,
    reload,
  } = useAsync(() => getMissingPublic(id), [id]);

  if (loading) return <Loading />;

  if (error || !c) {
    return (
      <div className="container-x section">
        <ErrorState
          message={error || "তথ্য পাওয়া যায়নি।"}
          onRetry={reload}
        />
        <Link to="/missing-children" className="btn-outline mt-4">
          তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x section max-w-4xl">
      <Seo
        title={`${c.name} — নিখোঁজ ব্যক্তির তথ্য`}
        description={c.missingPlace || "নিখোঁজ ব্যক্তির তথ্য"}
      />

      <Link
        to="/missing-children"
        className="text-sm font-semibold text-brand-700"
      >
        ← সব তথ্য
      </Link>

      <article className="card mt-4 grid gap-6 overflow-hidden md:grid-cols-[320px_1fr]">
        <Photo
          src={c.image}
          name={c.name}
          cls="h-full min-h-[280px] w-full"
        />

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl">{c.name}</h1>
            <StatusBadge s={c.status} />
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            {c.age != null && (
              <div>
                <dt className="inline text-muted">বয়স: </dt>
                <dd className="inline font-medium">
                  {toBn(c.age)} বছর
                </dd>
              </div>
            )}

            {c.gender && (
              <div>
                <dt className="inline text-muted">লিঙ্গ: </dt>
                <dd className="inline font-medium">
                  {GENDER[c.gender] || c.gender}
                </dd>
              </div>
            )}

            {c.missingDate && (
              <div>
                <dt className="inline text-muted">
                  নিখোঁজ হওয়ার তারিখ:{" "}
                </dt>
                <dd className="inline font-medium">
                  {formatDate(c.missingDate)}
                </dd>
              </div>
            )}

            {c.missingPlace && (
              <div>
                <dt className="inline text-muted">
                  নিখোঁজ হওয়ার স্থান:{" "}
                </dt>
                <dd className="inline font-medium">{c.missingPlace}</dd>
              </div>
            )}
          </dl>

          {c.details && (
            <div className="mt-4">
              <h2 className="text-base">বিস্তারিত তথ্য</h2>
              <p className="mt-1 whitespace-pre-line text-muted">
                {c.details}
              </p>
            </div>
          )}

          {c.contactInfo && (
            <div className="mt-5 rounded-lg bg-brand-50 p-4">
              <h2 className="text-base">যোগাযোগের তথ্য</h2>
              <p className="mt-1 font-medium">{c.contactInfo}</p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
