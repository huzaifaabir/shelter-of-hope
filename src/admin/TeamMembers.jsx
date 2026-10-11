import { useCallback, useEffect, useState } from "react";
import { Title } from "./AdminUI";
import ImageUpload from "../components/ImageUpload";
import { Field } from "../components/Feedback";
import { useToast } from "../context/ToastContext";
import {
  getAdminTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../services/teamService";

const EMPTY = {
  name: "",
  designation: "",
  image: "",
  email: "",
  phone: "",
  bio: "",
  published: true,
  sortOrder: 0,
};

export default function TeamMembers() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminTeamMembers();
      setItems(result.items || []);
    } catch (error) {
      toast.error(error.message || "টিম সদস্যদের তথ্য লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function change(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY);
    setEditingId("");
  }

  function edit(item) {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      designation: item.designation || "",
      image: item.image || "",
      email: item.email || "",
      phone: item.phone || "",
      bio: item.bio || "",
      published: item.published !== false,
      sortOrder: item.sortOrder ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.designation.trim()) {
      toast.error("সদস্যের নাম ও পদবি লিখুন।");
      return;
    }

    setBusy(true);
    try {
      const body = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await updateTeamMember(editingId, body);
        toast.success("সদস্যের তথ্য আপডেট হয়েছে।");
      } else {
        await createTeamMember(body);
        toast.success("নতুন সদস্য যোগ হয়েছে।");
      }

      resetForm();
      await load();
    } catch (error) {
      toast.error(error.message || "তথ্য সংরক্ষণ করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(item) {
    try {
      await updateTeamMember(item._id, {
        published: !item.published,
      });
      toast.success(
        item.published ? "সদস্যকে আড়াল করা হয়েছে।" : "সদস্য প্রকাশ করা হয়েছে।"
      );
      await load();
    } catch (error) {
      toast.error(error.message || "অবস্থা পরিবর্তন করা যায়নি।");
    }
  }

  async function remove(item) {
    const confirmed = window.confirm(
      `“${item.name}”-কে টিমের তালিকা থেকে মুছে ফেলতে চান?`
    );
    if (!confirmed) return;

    try {
      await deleteTeamMember(item._id);
      if (editingId === item._id) resetForm();
      toast.success("সদস্য মুছে ফেলা হয়েছে।");
      await load();
    } catch (error) {
      toast.error(error.message || "সদস্য মুছে ফেলা যায়নি।");
    }
  }

  return (
    <>
      <Title>টিম সদস্য ব্যবস্থাপনা</Title>

      <section className="card mb-8 space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            {editingId ? "সদস্যের তথ্য সম্পাদনা" : "নতুন সদস্য যোগ করুন"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            এই তথ্য About পেজের টিম সেকশনে দেখানো হবে।
          </p>
        </div>

        <form onSubmit={save} className="space-y-5">
          <div>
            <span className="label mb-2 block">সদস্যের ছবি</span>
            <ImageUpload
              folder="team"
              value={form.image}
              label="ছবি আপলোড করুন"
              onChange={(url) => change("image", url)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field id="team-name" label="পূর্ণ নাম *">
              <input
                id="team-name"
                className="input"
                maxLength={120}
                value={form.name}
                onChange={(e) => change("name", e.target.value)}
                required
              />
            </Field>

            <Field id="team-designation" label="পদবি *">
              <input
                id="team-designation"
                className="input"
                maxLength={120}
                value={form.designation}
                onChange={(e) => change("designation", e.target.value)}
                required
              />
            </Field>

            <Field id="team-email" label="ইমেইল">
              <input
                id="team-email"
                type="email"
                className="input"
                maxLength={160}
                value={form.email}
                onChange={(e) => change("email", e.target.value)}
              />
            </Field>

            <Field id="team-phone" label="ফোন নম্বর">
              <input
                id="team-phone"
                type="tel"
                className="input"
                maxLength={30}
                value={form.phone}
                onChange={(e) => change("phone", e.target.value)}
              />
            </Field>

            <Field id="team-order" label="প্রদর্শনের ক্রম">
              <input
                id="team-order"
                type="number"
                min="0"
                max="9999"
                className="input"
                value={form.sortOrder}
                onChange={(e) => change("sortOrder", e.target.value)}
              />
            </Field>
          </div>

          <Field id="team-bio" label="সংক্ষিপ্ত পরিচিতি">
            <textarea
              id="team-bio"
              className="input min-h-28"
              rows={4}
              maxLength={1000}
              value={form.bio}
              onChange={(e) => change("bio", e.target.value)}
              placeholder="সদস্যের পরিচিতি লিখুন..."
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#c2005a]"
              checked={form.published}
              onChange={(e) => change("published", e.target.checked)}
            />
            About পেজে প্রকাশ করুন
          </label>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy
                ? "সংরক্ষণ করা হচ্ছে..."
                : editingId
                  ? "পরিবর্তন সংরক্ষণ করুন"
                  : "+ সদস্য যোগ করুন"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn-outline"
                onClick={resetForm}
                disabled={busy}
              >
                বাতিল
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">সদস্যদের তালিকা</h2>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={load}
            disabled={loading}
          >
            {loading ? "লোড হচ্ছে..." : "রিফ্রেশ"}
          </button>
        </div>

        {loading ? (
          <div className="card p-6 text-sm text-muted">তথ্য লোড হচ্ছে...</div>
        ) : items.length === 0 ? (
          <div className="card p-6 text-sm text-muted">
            এখনো কোনো টিম সদস্য যোগ করা হয়নি।
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item._id} className="card overflow-hidden p-5">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted">
                        ছবি নেই
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted">{item.designation}</p>
                    <p className="mt-1 break-words text-xs text-muted">
                      {item.email}
                    </p>
                    <p className="break-words text-xs text-muted">
                      {item.phone}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs ${
                        item.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.published ? "প্রকাশিত" : "আড়াল করা"}
                    </span>
                  </div>
                </div>

                {item.bio && (
                  <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm text-muted">
                    {item.bio}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => edit(item)}
                  >
                    সম্পাদনা
                  </button>
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => togglePublished(item)}
                  >
                    {item.published ? "আড়াল করুন" : "প্রকাশ করুন"}
                  </button>
                  <button
                    type="button"
                    className="btn-outline btn-sm text-red-600"
                    onClick={() => remove(item)}
                  >
                    মুছুন
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}