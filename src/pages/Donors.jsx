
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DeleteDonorModal from "../components/DeleteDonorModal";
import DonorForm from "../components/DonorForm";
import { Loading, PageHeader } from "../components/Feedback";
import Seo from "../components/Seo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  listDonors,
  getMyDonor,
  createDonor,
  updateDonor,
  deleteDonor,
} from "../services/donorService";
import { BLOOD_GROUPS, DIVISIONS, LOCATIONS } from "../lib/constants";

function extractDonors(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.donors)) return response.donors;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.donors)) return response.data.donors;
  return [];
}

function donorId(donor) {
  return donor?.donorId || donor?._id || donor?.id;
}

function locationText(donor) {
  return [
    donor?.village,
    donor?.upazila,
    donor?.district,
    donor?.division,
  ]
    .filter(Boolean)
    .join(", ");
}

function DonorCard({
  donor,
  mine = false,
  onEdit,
  onDelete,
  deleting = false,
}) {
  const navigate = useNavigate();
  const available = donor.availability === "available";
  const id = donorId(donor);
  const clickable = !mine && Boolean(id);

  function openDetails() {
    if (clickable) {
      navigate(`/donor/${encodeURIComponent(String(id))}`);
    }
  }

  function handleCardKeyDown(event) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails();
    }
  }

  return (
    <article
      className={`card overflow-hidden p-5 transition-all duration-200 ${
        clickable
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
          : ""
      }`}
      onClick={clickable ? openDetails : undefined}
      onKeyDown={clickable ? handleCardKeyDown : undefined}
      role={clickable ? "link" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={
        clickable
          ? `${donor.name || "রক্তদাতা"}-এর বিস্তারিত দেখুন`
          : undefined
      }
    >
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-pink-50">
          {donor.image ? (
            <img
              src={donor.image}
              alt={donor.name || "রক্তদাতা"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-brand-700">
              {(donor.name || "র").slice(0, 1)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-bold text-slate-900">
            {donor.name || "নাম উল্লেখ নেই"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-pink-50 px-3 py-1 font-bold text-brand-700">
              {donor.bloodGroup || "রক্তের গ্রুপ নেই"}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                available
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {available ? "রক্ত দিতে পারবেন" : "বর্তমানে অনুপলব্ধ"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm text-slate-600">
        <p className="flex items-start gap-2">
          <span aria-hidden="true">📍</span>
          <span>{locationText(donor) || "ঠিকানা দেওয়া হয়নি"}</span>
        </p>

        {donor.phonePublic !== false && donor.phone && (
          <p className="flex items-center gap-2">
            <span aria-hidden="true">📞</span>
            <a
              href={`tel:${donor.phone}`}
              onClick={(event) => event.stopPropagation()}
              className="break-all font-medium text-brand-700 hover:underline"
            >
              {donor.phone}
            </a>
          </p>
        )}

        {donor.phonePublic === false && !mine && (
          <p className="text-xs text-slate-500">
            মোবাইল নম্বর ব্যক্তিগত রাখা হয়েছে।
          </p>
        )}

        {donor.lastDonationDate && (
          <p>
            সর্বশেষ রক্তদান:{" "}
            {String(donor.lastDonationDate).slice(0, 10)}
          </p>
        )}

        {donor.additionalInfo && (
          <p className="break-words">{donor.additionalInfo}</p>
        )}
      </div>

      {clickable && (
        <p className="mt-4 border-t border-line pt-3 text-center text-sm font-medium text-brand-700">
          বিস্তারিত দেখতে ক্লিক করুন <span aria-hidden="true">→</span>
        </p>
      )}

      {mine && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="btn-outline w-full"
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
            disabled={deleting}
          >
            ✏️ তথ্য এডিট
          </button>

          <button
            type="button"
            className="w-full rounded-xl border border-red-200 px-3 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.();
            }}
            disabled={deleting}
          >
            🗑️ {deleting ? "মুছে ফেলা হচ্ছে..." : "তথ্য মুছুন"}
          </button>
        </div>
      )}
    </article>
  );
}

export default function Donors() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [donors, setDonors] = useState([]);
  const [myDonor, setMyDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        listDonors(),
        user ? getMyDonor() : Promise.resolve({ donor: null }),
      ]);

      if (results[0].status === "fulfilled") {
        setDonors(extractDonors(results[0].value));
      } else {
        setDonors([]);
        console.error("Could not load donors:", results[0].reason);
        toast.error("রক্তদাতাদের তালিকা লোড করা যায়নি।");
      }

      if (results[1].status === "fulfilled") {
        const response = results[1].value;
        setMyDonor(response?.donor || response?.data?.donor || null);
      } else {
        setMyDonor(null);
        console.error(
          "Could not load your donor profile:",
          results[1].reason
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  function openCreateForm() {
    setEditing(false);
    setServerErrors({});
    setShowForm(true);
  }

  function openEditForm() {
    setEditing(true);
    setServerErrors({});
    setShowForm(true);
  }

  async function handleSubmit(values) {
    setSaving(true);
    setServerErrors({});

    try {
      if (editing) {
        const id = donorId(myDonor);

        if (!id) {
          throw new Error(
            "আপনার রক্তদাতার আইডি পাওয়া যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"
          );
        }

        await updateDonor(id, values);
        toast.success("আপনার রক্তদাতার তথ্য আপডেট হয়েছে।");
      } else {
        await createDonor(values);
        toast.success("আপনি সফলভাবে রক্তদাতা হিসেবে নিবন্ধিত হয়েছেন।");
      }

      setShowForm(false);
      setEditing(false);
      await loadData();
    } catch (error) {
      setServerErrors(error?.errors || {});
      toast.error(
        error?.message || "তথ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMyDonor() {
    if (!myDonor || saving) return;

    const id = donorId(myDonor);

    if (!id) {
      toast.error(
        "রক্তদাতার আইডি পাওয়া যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"
      );
      return;
    }

    setSaving(true);

    try {
      await deleteDonor(id);

      setMyDonor(null);
      setShowForm(false);
      setEditing(false);
      setServerErrors({});
      setDeleteModalOpen(false);

      toast.success("আপনার রক্তদাতার তথ্য মুছে ফেলা হয়েছে।");
      await loadData();
    } catch (error) {
      console.error("Could not delete donor:", error);
      toast.error(
        error?.message || "তথ্য মুছে ফেলা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredDonors = donors.filter((donor) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      [
        donor.name,
        donor.village,
        donor.upazila,
        donor.unionOrThana,
        donor.district,
        donor.division,
      ].some((value) =>
        String(value || "").toLowerCase().includes(term)
      );

    const matchesBlood =
      !bloodGroup || donor.bloodGroup === bloodGroup;

    const matchesDivision =
      !division || donor.division === division;

    const matchesDistrict =
      !district || donor.district === district;

    return (
      matchesSearch &&
      matchesBlood &&
      matchesDivision &&
      matchesDistrict
    );
  });

  return (
    <>
      <Seo
        title="রক্তদাতা"
        description="রক্তদাতা খুঁজুন, নিজের রক্তদাতার তথ্য যোগ করুন এবং প্রয়োজনে তথ্য আপডেট করুন।"
      />

      <PageHeader
        eyebrow="রক্তদাতা ডিরেক্টরি"
        title="রক্তদাতা খুঁজুন"
      >
        আপনার স্বেচ্ছায় রক্তদানের তথ্য যুক্ত করুন এবং প্রয়োজনে মানুষের পাশে দাঁড়ান।
      </PageHeader>

      <main className="container-x section !pt-8 space-y-10">
        <section aria-labelledby="my-donor-heading">
          <div className="mb-5">
            <h2
              id="my-donor-heading"
              className="text-xl font-bold text-slate-900 sm:text-2xl"
            >
              আপনার রক্তদাতার তথ্য
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              রক্তদাতা হিসেবে নিবন্ধন করুন অথবা নিজের তথ্য আপডেট করুন।
            </p>
          </div>

          {authLoading || loading ? (
            <Loading />
          ) : showForm ? (
            <div className="card p-5 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">
                    {editing
                      ? "নিজের তথ্য এডিট করুন"
                      : "রক্তদাতা নিবন্ধন ফর্ম"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    সঠিক তথ্য দিয়ে ফর্মটি পূরণ করুন।
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-outline shrink-0"
                  onClick={() => {
                    setShowForm(false);
                    setServerErrors({});
                  }}
                  disabled={saving}
                >
                  বাতিল
                </button>
              </div>

              <DonorForm
                key={`${editing ? "edit" : "create"}-${donorId(myDonor) || "new"}`}
                initial={editing ? myDonor : undefined}
                editing={editing}
                onSubmit={handleSubmit}
                serverErrors={serverErrors}
                submitText={
                  editing
                    ? "পরিবর্তন সংরক্ষণ করুন"
                    : "রক্তদাতা হিসেবে নিবন্ধন করুন"
                }
              />

              {saving && (
                <p className="mt-3 text-sm text-slate-500">
                  তথ্য সংরক্ষণ করা হচ্ছে...
                </p>
              )}
            </div>
          ) : myDonor ? (
            <div className="max-w-xl">
              <DonorCard
                donor={myDonor}
                mine
                onEdit={openEditForm}
                onDelete={() => setDeleteModalOpen(true)}
                deleting={saving}
              />
            </div>
          ) : (
            <div className="card p-6 text-center sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-brand-700">
                <span className="text-3xl" aria-hidden="true">+</span>
              </div>

              <h3 className="mt-3 text-lg font-bold">
                আপনিও হতে পারেন একজন রক্তদাতা
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                আপনার রক্তের গ্রুপ ও যোগাযোগের তথ্য যুক্ত করে প্রয়োজনে মানুষের পাশে দাঁড়ান।
              </p>

              {!user && (
                <p className="mt-3 text-sm text-slate-500">
                  নিবন্ধনের আগে আপনার অ্যাকাউন্টে লগইন করুন।
                </p>
              )}

              <div className="mt-5">
                {user ? (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <span aria-hidden="true" className="text-xl">+</span>
                    রক্তদাতা হোন
                  </button>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: "/donors" }}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <span aria-hidden="true" className="text-xl">+</span>
                    লগইন করে রক্তদাতা হোন
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="all-donors-heading">
          <div className="mb-5">
            <h2
              id="all-donors-heading"
              className="text-xl font-bold text-slate-900 sm:text-2xl"
            >
              সকল রক্তদাতা
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              রক্তের গ্রুপ ও এলাকা অনুযায়ী রক্তদাতা খুঁজুন।
            </p>
          </div>

          <div className="card mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="donor-search" className="label">
                নাম বা এলাকা দিয়ে খুঁজুন
              </label>

              <input
                id="donor-search"
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="নাম, গ্রাম, উপজেলা..."
              />
            </div>

            <div>
              <label htmlFor="donor-blood" className="label">
                রক্তের গ্রুপ
              </label>

              <select
                id="donor-blood"
                className="input"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">সব গ্রুপ</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="donor-division" className="label">
                বিভাগ
              </label>

              <select
                id="donor-division"
                className="input"
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value);
                  setDistrict("");
                }}
              >
                <option value="">সব বিভাগ</option>
                {DIVISIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="donor-district" className="label">
                জেলা
              </label>

              <select
                id="donor-district"
                className="input"
                value={district}
                disabled={!division}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="">সব জেলা</option>
                {(LOCATIONS[division] || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setSearch("");
                  setBloodGroup("");
                  setDivision("");
                  setDistrict("");
                }}
              >
                ফিল্টার মুছুন
              </button>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : filteredDonors.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="font-semibold text-slate-700">
                কোনো রক্তদাতার তথ্য পাওয়া যায়নি।
              </p>

              <p className="mt-2 text-sm text-slate-500">
                অন্য নাম, রক্তের গ্রুপ বা এলাকা দিয়ে চেষ্টা করুন।
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                মোট {filteredDonors.length} জন রক্তদাতা পাওয়া গেছে।
              </p>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredDonors.map((donor, index) => (
                  <DonorCard
                    key={donorId(donor) || `${donor.name}-${index}`}
                    donor={donor}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <DeleteDonorModal
        open={deleteModalOpen}
        loading={saving}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteMyDonor}
      />
    </>
  );
}
