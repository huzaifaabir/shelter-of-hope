import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DonorForm from "../components/DonorForm";
import { PageHeader, Loading } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { createDonor, getMyDonor } from "../services/donorService";
import { useAsync } from "../lib/useAsync";
import Seo from "../components/Seo";

export default function BecomeDonor() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState({});
  const mine = useAsync(() => (user ? getMyDonor() : Promise.resolve({ donor: null })), [user?.uid]);

  async function onSubmit(values) {
    try {
      await createDonor(values);
      toast.success("সফলভাবে সংরক্ষণ করা হয়েছে।");
      navigate("/profile");
    } catch (e) {
      setServerErrors(e.errors || {});
      toast.error(e.message);
    }
  }

  return (
    <>
      <Seo title="রক্তদাতা হোন" description="স্বেচ্ছায় রক্তদাতা হিসেবে নিবন্ধন করুন এবং প্রয়োজনের সময় মানুষের পাশে দাঁড়ান।" />
      <PageHeader eyebrow="রক্তদাতা নিবন্ধন" title="রক্তদাতা হতে চান?">আপনার তথ্য দিয়ে নিবন্ধন করুন। রক্তের প্রয়োজনে মানুষ আপনার সঙ্গে যোগাযোগ করতে পারবে।</PageHeader>
      <div className="container-x section !pt-8 max-w-3xl">
        {loading || (user && mine.loading) ? <Loading /> : !user ? (
          <div className="card p-8 text-center">
            <p className="text-muted">রক্তদাতা হিসেবে নিবন্ধন করতে আপনাকে আগে লগইন করতে হবে।</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/login" state={{ from: "/be-a-donor" }} className="btn-primary">লগইন</Link>
              <Link to="/register" state={{ from: "/be-a-donor" }} className="btn-outline">নতুন অ্যাকাউন্ট খুলুন</Link>
            </div>
          </div>
        ) : mine.data?.donor ? (
          <div className="card p-8 text-center">
            <p className="text-muted">আপনি ইতোমধ্যে রক্তদাতা হিসেবে নিবন্ধিত আছেন।</p>
            <Link to="/profile" className="btn-primary mt-5">প্রোফাইল দেখুন</Link>
          </div>
        ) : (
          <div className="card p-6 sm:p-8"><DonorForm onSubmit={onSubmit} serverErrors={serverErrors} /></div>
        )}
      </div>
    </>
  );
}
