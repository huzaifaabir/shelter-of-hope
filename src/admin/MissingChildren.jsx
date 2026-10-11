import { useState } from "react";
import { AsyncView, Table, Title } from "./AdminUI";
import ConfirmModal, { Modal } from "../components/ConfirmModal";
import ImageUpload from "../components/ImageUpload";
import { Field } from "../components/Feedback";
import { deleteMissing, listMissingAdmin, saveMissing } from "../services/adminService";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../context/ToastContext";
import { GENDER, MISSING_STATUS } from "../lib/constants";
import { formatDate } from "../lib/bn";

const blank = { name: "", age: "", gender: "", image: "", missingDate: "", missingPlace: "", details: "", contactInfo: "", status: "missing", published: false, internalNotes: "" };

export default function AdminMissing() {
  const toast = useToast();
  const state = useAsync(listMissingAdmin, []);
  const [f, setF] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr("অনুগ্রহ করে শিশুর নাম লিখুন।");
    setBusy(true);
    try {
      await saveMissing(f._id, f);
      toast.success("সফলভাবে সংরক্ষণ করা হয়েছে।");
      setF(null);
      state.reload();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await deleteMissing(del._id);
      toast.success("সফলভাবে মুছে ফেলা হয়েছে।");
      setDel(null);
      state.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  const open = (c) => { setErr(""); setF(c ? { ...blank, ...c, missingDate: c.missingDate ? c.missingDate.slice(0, 10) : "", age: c.age ?? "" } : blank); };

  return (
    <>
      <Title action={<button className="btn-primary btn-sm" onClick={() => open()}>নতুন তথ্য যোগ করুন</button>}>নিখোঁজ ব্যক্তির ব্যবস্থাপনা</Title>
      <AsyncView state={state}>
        {state.data && (
          <Table head={["নাম", "বয়স", "নিখোঁজের তারিখ", "অবস্থা", "প্রকাশ", "কার্যক্রম"]} isEmpty={!state.data.items.length} empty="বর্তমানে কোনো তথ্য নেই।">
            {state.data.items.map((c) => (
              <tr key={c._id}>
                <td className="td font-medium">{c.name}</td>
                <td className="td">{c.age ?? "—"}</td>
                <td className="td">{formatDate(c.missingDate)}</td>
                <td className="td">{MISSING_STATUS[c.status]}</td>
                <td className="td">{c.published ? "প্রকাশিত" : "অপ্রকাশিত"}</td>
                <td className="td whitespace-nowrap"><button className="btn-outline btn-sm mr-2" onClick={() => open(c)}>সম্পাদনা</button><button className="btn-danger btn-sm" onClick={() => setDel(c)}>মুছুন</button></td>
              </tr>
            ))}
          </Table>
        )}
      </AsyncView>
      <Modal open={!!f} wide title={f?._id ? "তথ্য সম্পাদনা" : "নতুন তথ্য যোগ করুন"} onClose={() => setF(null)}>
        {f && (
          <form onSubmit={save} className="space-y-4" noValidate>
            <ImageUpload folder="missing" value={f.image} onChange={(u) => setF({ ...f, image: u })} label="ছবি আপলোড করুন" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="m-name" label="নাম" required><input id="m-name" className="input" value={f.name} onChange={set("name")} /></Field>
              <Field id="m-age" label="বয়স"><input id="m-age" type="number" min="0" max="18" className="input" value={f.age} onChange={set("age")} /></Field>
              <Field id="m-gender" label="লিঙ্গ"><select id="m-gender" className="input" value={f.gender} onChange={set("gender")}><option value="">নির্বাচন করুন</option>{Object.entries(GENDER).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
              <Field id="m-date" label="নিখোঁজ হওয়ার তারিখ"><input id="m-date" type="date" className="input" value={f.missingDate} onChange={set("missingDate")} /></Field>
              <Field id="m-place" label="নিখোঁজ হওয়ার স্থান"><input id="m-place" className="input" value={f.missingPlace} onChange={set("missingPlace")} /></Field>
              <Field id="m-status" label="কেসের অবস্থা"><select id="m-status" className="input" value={f.status} onChange={set("status")}>{Object.entries(MISSING_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            </div>
            <Field id="m-details" label="বিস্তারিত তথ্য"><textarea id="m-details" rows={4} className="input" value={f.details} onChange={set("details")} /></Field>
            <Field id="m-contact" label="যোগাযোগের তথ্য (জনসমক্ষে প্রকাশিত হবে)" hint="ব্যক্তিগত নম্বরের বদলে থানা বা সংস্থার নম্বর ব্যবহার করা ভালো।"><input id="m-contact" className="input" value={f.contactInfo} onChange={set("contactInfo")} /></Field>
            <Field id="m-notes" label="অভ্যন্তরীণ নোট (প্রকাশিত হবে না)"><textarea id="m-notes" rows={2} className="input" value={f.internalNotes} onChange={set("internalNotes")} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#c2005a]" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />ওয়েবসাইটে প্রকাশ করুন</label>
            {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <button className="btn-primary" disabled={busy}>{busy ? "সংরক্ষণ করা হচ্ছে..." : "সংরক্ষণ করুন"}</button>
          </form>
        )}
      </Modal>
      <ConfirmModal open={!!del} busy={busy} title="তথ্য মুছে ফেলুন" message={`আপনি কি নিশ্চিত যে "${del?.name}"-এর তথ্য মুছে ফেলতে চান?`} confirmText="হ্যাঁ, মুছে ফেলুন" onCancel={() => setDel(null)} onConfirm={remove} />
    </>
  );
}
