
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase/auth";
import ImageUpload from "../components/ImageUpload";
import { Link } from "react-router-dom";
import DonorForm from "../components/DonorForm";
import ConfirmModal from "../components/ConfirmModal";
import {
  PageHeader,
  Loading,
  ErrorState,
  Field,
} from "../components/Feedback";
import { Avatar, AvailabilityBadge } from "../components/DonorCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  deleteDonor,
  getMyDonor,
  updateDonor,
} from "../services/donorService";
import { listMyMissing } from "../services/adminService";
import { updateMe } from "../services/authService";
import { useAsync } from "../lib/useAsync";
import Seo from "../components/Seo";

const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-",
  "AB+", "AB-", "O+", "O-",
];

const EMPTY_FORM = {
  name: "",
  phone: "",
  bloodGroup: "",
  division: "",
  district: "",
  upazila: "",
  village: "",
};

export default function Profile() {
  const { user, profile, refreshProfile, isStaff } = useAuth();
  const toast = useToast();

  const mine = useAsync(getMyDonor, []);
  const myMissing = useAsync(listMyMissing, []);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingDonor, setEditingDonor] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [photo, setPhoto] = useState("");
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const donor = mine.data?.donor;

  useEffect(() => {
    // ছবি মুছে দেওয়ার পর Firebase-এর পুরোনো URL দিয়ে
    // ছবিটি আবার দেখানো হবে না।
    if (!photoRemoved) {
      setPhoto(
        profile?.customPhotoURL ||
        user?.photoURL ||
        ""
      );
    }

    setForm({
      name: profile?.name || user?.displayName || "",
      phone: profile?.phone || donor?.phone || "",
      bloodGroup: profile?.bloodGroup || donor?.bloodGroup || "",
      division: profile?.division || donor?.division || "",
      district: profile?.district || donor?.district || "",
      upazila: profile?.upazila || donor?.upazila || "",
      village: profile?.village || donor?.village || "",
    });
  }, [
    profile,
    user?.displayName,
    user?.photoURL,
    donor,
    photoRemoved,
  ]);

  function changeField(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveProfile(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("অনুগ্রহ করে আপনার নাম লিখুন।");
      return;
    }

    if (form.phone.trim()) {
      const normalizedPhone = form.phone.replace(/[\s-]/g, "");

      if (!/^(?:\+?8801|01)[3-9]\d{8}$/.test(normalizedPhone)) {
        toast.error("সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।");
        return;
      }
    }

    setProfileBusy(true);

    try {
      const values = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        bloodGroup: form.bloodGroup,
        division: form.division.trim(),
        district: form.district.trim(),
        upazila: form.upazila.trim(),
        village: form.village.trim(),
      };

      await updateMe(values);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: values.name,
        });
      }

      if (donor?.donorId) {
        try {
          await updateDonor(donor.donorId, {
            ...donor,
            ...values,
          });

          await mine.reload();
        } catch (donorError) {
          console.error("Donor record update failed:", donorError);
          toast.error(
            "প্রোফাইল সেভ হয়েছে, তবে রক্তদাতার আলাদা তথ্য আপডেট হয়নি।"
          );
        }
      }

      await refreshProfile();
      setEditingProfile(false);

      toast.success("প্রোফাইল সফলভাবে সংরক্ষণ করা হয়েছে।");
    } catch (error) {
      console.error("Profile save failed:", error);
      toast.error(
        error.message || "প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setProfileBusy(false);
    }
  }

  // প্রোফাইল ছবি আপলোড, পরিবর্তন ও সরানো
  async function savePhoto(url) {
    if (photoBusy) return;

    setPhotoBusy(true);

    try {
      if (!auth.currentUser) {
        throw new Error("আপনাকে প্রথমে লগইন করতে হবে।");
      }

      const uploadedPhoto =
        typeof url === "string" ? url.trim() : "";

      setPhoto(uploadedPhoto);
      setPhotoRemoved(!uploadedPhoto);

      // Backend profile-এ ছবির URL সংরক্ষণ বা খালি করা
      await updateMe({
        customPhotoURL: uploadedPhoto,
      });

      // Firebase Auth-এ ছবির URL আপডেট বা মুছে ফেলা
      await updateProfile(auth.currentUser, {
        photoURL: uploadedPhoto || null,
      });

      await refreshProfile();

      setPhoto(uploadedPhoto);
      setPhotoRemoved(!uploadedPhoto);

      toast.success(
        uploadedPhoto
          ? "প্রোফাইল ছবি আপডেট হয়েছে।"
          : "প্রোফাইল ছবি সরিয়ে দেওয়া হয়েছে।"
      );
    } catch (error) {
      console.error("Profile photo update failed:", error);

      setPhotoRemoved(false);
      setPhoto(
        profile?.customPhotoURL ||
        auth.currentUser?.photoURL ||
        ""
      );

      toast.error(
        error.message || "প্রোফাইল ছবি পরিবর্তন করা যায়নি।"
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  async function saveDonor(values) {
    try {
      await updateDonor(donor.donorId, values);

      toast.success("রক্তদাতার তথ্য আপডেট হয়েছে।");
      setEditingDonor(false);
      await mine.reload();
    } catch (error) {
      toast.error(
        error.message || "রক্তদাতার তথ্য সংরক্ষণ করা যায়নি।"
      );
    }
  }

  async function remove() {
    setBusy(true);

    try {
      await deleteDonor(donor.donorId);

      toast.success(
        "আপনাকে রক্তদাতা তালিকা থেকে সরিয়ে দেওয়া হয়েছে।"
      );

      setConfirm(false);
      await mine.reload();
    } catch (error) {
      toast.error(
        error.message || "রক্তদাতার তথ্য সরানো যায়নি।"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo title="প্রোফাইল" />

      <PageHeader title="প্রোফাইল">
        {user?.email}
      </PageHeader>

      <div className="container-x section !pt-8 max-w-3xl space-y-6">
        {/* Account Profile */}
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg">অ্যাকাউন্টের তথ্য</h2>

            {!editingProfile && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => setEditingProfile(true)}
              >
                প্রোফাইল সম্পাদনা করুন
              </button>
            )}
          </div>

          <div className="mt-4">
            <ImageUpload
              value={photo}
              onChange={savePhoto}
              folder="donors"
              label="প্রোফাইল ছবি আপলোড করুন"
              round
            />

            {photoBusy && (
              <p className="mt-2 text-xs text-muted">
                ছবি সংরক্ষণ হচ্ছে...
              </p>
            )}
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
            <span className="text-muted">Gmail / ইমেইল</span>
            <p className="mt-1 break-all font-semibold">
              {user?.email || profile?.email || "—"}
            </p>
          </div>

          {editingProfile ? (
            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <Field id="profile-name" label="আপনার নাম">
                <input
                  id="profile-name"
                  name="name"
                  className="input"
                  value={form.name}
                  onChange={changeField}
                  maxLength={120}
                  required
                />
              </Field>

              <Field id="profile-phone" label="ফোন নম্বর">
                <input
                  id="profile-phone"
                  name="phone"
                  className="input"
                  type="tel"
                  value={form.phone}
                  onChange={changeField}
                  placeholder="01XXXXXXXXX"
                  maxLength={20}
                />
              </Field>

              <Field id="profile-blood" label="রক্তের গ্রুপ">
                <select
                  id="profile-blood"
                  name="bloodGroup"
                  className="input"
                  value={form.bloodGroup}
                  onChange={changeField}
                >
                  <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="profile-division" label="বিভাগ">
                  <input
                    id="profile-division"
                    name="division"
                    className="input"
                    value={form.division}
                    onChange={changeField}
                    maxLength={100}
                    placeholder="বিভাগের নাম"
                  />
                </Field>

                <Field id="profile-district" label="জেলা">
                  <input
                    id="profile-district"
                    name="district"
                    className="input"
                    value={form.district}
                    onChange={changeField}
                    maxLength={100}
                    placeholder="জেলার নাম"
                  />
                </Field>

                <Field id="profile-upazila" label="উপজেলা / থানা">
                  <input
                    id="profile-upazila"
                    name="upazila"
                    className="input"
                    value={form.upazila}
                    onChange={changeField}
                    maxLength={100}
                    placeholder="উপজেলা বা থানার নাম"
                  />
                </Field>

                <Field id="profile-village" label="গ্রাম / এলাকা">
                  <input
                    id="profile-village"
                    name="village"
                    className="input"
                    value={form.village}
                    onChange={changeField}
                    maxLength={150}
                    placeholder="গ্রাম বা এলাকার নাম"
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={profileBusy}
                >
                  {profileBusy
                    ? "সংরক্ষণ হচ্ছে..."
                    : "পরিবর্তন সংরক্ষণ করুন"}
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  disabled={profileBusy}
                  onClick={() => {
                    setForm({
                      name: profile?.name || user?.displayName || "",
                      phone: profile?.phone || donor?.phone || "",
                      bloodGroup:
                        profile?.bloodGroup || donor?.bloodGroup || "",
                      division: profile?.division || donor?.division || "",
                      district: profile?.district || donor?.district || "",
                      upazila: profile?.upazila || donor?.upazila || "",
                      village: profile?.village || donor?.village || "",
                    });

                    setEditingProfile(false);
                  }}
                >
                  বাতিল
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted">নাম:</span>
                <br />
                <strong>
                  {profile?.name || user?.displayName || "—"}
                </strong>
              </p>

              <p>
                <span className="text-muted">ফোন নম্বর:</span>
                <br />
                <strong>
                  {profile?.phone || donor?.phone || "—"}
                </strong>
              </p>

              <p>
                <span className="text-muted">রক্তের গ্রুপ:</span>
                <br />
                <strong>
                  {profile?.bloodGroup || donor?.bloodGroup || "—"}
                </strong>
              </p>

              <p>
                <span className="text-muted">বিভাগ:</span>
                <br />
                <strong>
                  {profile?.division || donor?.division || "—"}
                </strong>
              </p>

              <p>
                <span className="text-muted">জেলা:</span>
                <br />
                <strong>
                  {profile?.district || donor?.district || "—"}
                </strong>
              </p>

              <p>
                <span className="text-muted">উপজেলা / থানা:</span>
                <br />
                <strong>
                  {profile?.upazila || donor?.upazila || "—"}
                </strong>
              </p>

              <p>
                <span className="text-muted">গ্রাম / এলাকা:</span>
                <br />
                <strong>
                  {profile?.village || donor?.village || "—"}
                </strong>
              </p>
            </div>
          )}

          {isStaff && (
            <Link
              to="/admin"
              className="mt-4 inline-block text-sm font-semibold text-brand-700"
            >
              অ্যাডমিন প্যানেলে যান →
            </Link>
          )}
        </section>

        {/* Donor Information */}
        <section className="card p-6">
          <h2 className="text-lg">আমার রক্তদাতা তথ্য</h2>

          {mine.loading ? (
            <Loading />
          ) : mine.error ? (
            <ErrorState
              message={mine.error}
              onRetry={mine.reload}
            />
          ) : !donor ? (
            <div className="mt-3">
              <p className="text-muted">
                আপনি এখনও রক্তদাতা হিসেবে নিবন্ধন করেননি।
              </p>

              <Link to="/be-a-donor" className="btn-primary mt-4">
                রক্তদাতা হিসেবে নিবন্ধন করুন
              </Link>
            </div>
          ) : editingDonor ? (
            <div className="mt-5">
              <DonorForm
                editing
                initial={donor}
                onSubmit={saveDonor}
                submitText="পরিবর্তন সংরক্ষণ করুন"
              />

              <button
                type="button"
                className="btn-outline mt-3"
                onClick={() => setEditingDonor(false)}
              >
                বাতিল
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar
                  src={donor.image}
                  name={donor.name}
                  size="h-20 w-20"
                />

                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    {donor.name}
                    <span className="ml-1 text-brand-700">
                      {donor.bloodGroup}
                    </span>
                  </p>

                  <p className="text-sm text-muted">
                    {[donor.village, donor.upazila, donor.district]
                      .filter(Boolean)
                      .join(", ")}
                  </p>

                  <div className="mt-2">
                    <AvailabilityBadge value={donor.availability} />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={`/donor/${donor.donorId}`}
                  className="btn-outline btn-sm"
                >
                  পাবলিক প্রোফাইল দেখুন
                </Link>

                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => setEditingDonor(true)}
                >
                  তথ্য সম্পাদনা করুন
                </button>

                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => setConfirm(true)}
                >
                  ডোনার তালিকা থেকে নিজেকে সরিয়ে দিন
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Missing Person Reports */}
        <section className="card p-6">
          <h2 className="text-lg">আমার নিখোঁজ রিপোর্ট</h2>

          <p className="mt-2 text-sm text-muted">
            আপনার জমা দেওয়া নিখোঁজ ব্যক্তির রিপোর্টগুলো এখানে দেখা যাবে।
            প্রকাশের আগে রিপোর্ট যাচাই করা হতে পারে।
          </p>

          {myMissing.loading ? (
            <Loading />
          ) : myMissing.error ? (
            <ErrorState
              message={myMissing.error}
              onRetry={myMissing.reload}
            />
          ) : myMissing.data?.items?.length ? (
            <div className="mt-4 divide-y divide-line">
              {myMissing.data.items.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>

                    <p className="text-sm text-muted">
                      {item.published
                        ? "প্রকাশিত"
                        : "যাচাইয়ের অপেক্ষায়"}
                      {" · "}
                      {item.missingPlace || "স্থান উল্লেখ করা হয়নি"}
                    </p>
                  </div>

                  <Link
                    to="/missing"
                    className="btn-outline btn-sm"
                  >
                    তালিকা দেখুন
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              এখনও কোনো রিপোর্ট জমা দেননি।
            </p>
          )}

          <Link
            to="/missing"
            className="btn-outline btn-sm mt-4"
          >
            ＋ নিখোঁজ রিপোর্ট
          </Link>
        </section>
      </div>

      <ConfirmModal
        open={confirm}
        busy={busy}
        title="রক্তদাতা তালিকা থেকে সরিয়ে দিন"
        message="আপনি কি নিশ্চিত যে আপনি রক্তদাতা তালিকা থেকে নিজেকে সরিয়ে দিতে চান?"
        cancelText="বাতিল"
        confirmText="হ্যাঁ, সরিয়ে দিন"
        onCancel={() => setConfirm(false)}
        onConfirm={remove}
      />
    </>
  );
}
