import { useState } from "react";
import { AsyncView, Table, Title } from "./AdminUI";
import ConfirmModal, { Modal } from "../components/ConfirmModal";
import { Field } from "../components/Feedback";
import { addUser, listUsers, removeUser, updateUser } from "../services/adminService";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABEL, STATUS_LABEL } from "../lib/constants";

export default function Users() {
  const toast = useToast();
  const { profile } = useAuth();
  const state = useAsync(listUsers, []);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", role: "editor", status: "active" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [rm, setRm] = useState(null);
  const [link, setLink] = useState("");

  async function add(e) {
    e.preventDefault();
    setErr("");
    if (!f.name.trim()) return setErr("অনুগ্রহ করে নাম লিখুন।");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("সঠিক ইমেইল ঠিকানা দিন।");
    setBusy(true);
    try {
      const r = await addUser(f);
      toast.success("সফলভাবে সংরক্ষণ করা হয়েছে।");
      setOpen(false);
      setF({ name: "", email: "", role: "editor", status: "active" });
      if (r.resetLink) setLink(r.resetLink);
      state.reload();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }
  const change = async (u, patch) => {
    try {
      await updateUser(u._id, patch);
      toast.success("সফলভাবে সংরক্ষণ করা হয়েছে।");
      state.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  async function remove() {
    setBusy(true);
    try {
      await removeUser(rm._id);
      toast.success("অ্যাক্সেস সরিয়ে দেওয়া হয়েছে।");
      setRm(null);
      state.reload();
    } catch (e) {
      toast.error(e.message);
      setRm(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Title action={<button className="btn-primary btn-sm" onClick={() => setOpen(true)}>নতুন ব্যবহারকারী যোগ করুন</button>}>ব্যবহারকারী ও ভূমিকা</Title>
      <AsyncView state={state}>
        {state.data && (
          <Table head={["নাম", "ইমেইল", "ভূমিকা", "অবস্থা", "কার্যক্রম"]} isEmpty={!state.data.items.length} empty="কোনো ব্যবহারকারী পাওয়া যায়নি।">
            {state.data.items.map((u) => {
              const self = u.firebaseUid === profile?.firebaseUid || u.email === profile?.email;
              return (
                <tr key={u._id}>
                  <td className="td font-medium">{u.name || "—"}</td>
                  <td className="td">{u.email}</td>
                  <td className="td">
                    <select aria-label={`${u.name}-এর ভূমিকা`} className="input !w-auto !py-1.5" value={u.role} disabled={self} onChange={(e) => change(u, { role: e.target.value })}>
                      <option value="administrator">Administrator</option>
                      <option value="editor">Editor</option>
                    </select>
                  </td>
                  <td className="td">
                    <button disabled={self} onClick={() => change(u, { status: u.status === "active" ? "disabled" : "active" })} className={`badge ${u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`} aria-label="অবস্থা পরিবর্তন করুন">{STATUS_LABEL[u.status]}</button>
                  </td>
                  <td className="td"><button className="btn-danger btn-sm" disabled={self} onClick={() => setRm(u)}>অ্যাক্সেস সরান</button></td>
                </tr>
              );
            })}
          </Table>
        )}
      </AsyncView>
      <p className="mt-3 text-xs text-muted">ভূমিকা: {ROLE_LABEL.administrator} সব কিছু পরিচালনা করতে পারেন; {ROLE_LABEL.editor} শুধু কনটেন্ট ও রক্তদাতা পরিচালনা করতে পারেন।</p>

      <Modal open={open} title="নতুন ব্যবহারকারী যোগ করুন" onClose={() => setOpen(false)}>
        <form onSubmit={add} className="space-y-4" noValidate>
          <Field id="u-name" label="নাম" required><input id="u-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field id="u-email" label="ইমেইল" required hint="ব্যক্তির Firebase অ্যাকাউন্ট না থাকলে নতুন তৈরি হবে।"><input id="u-email" type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="u-role" label="ভূমিকা"><select id="u-role" className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="editor">Editor</option><option value="administrator">Administrator</option></select></Field>
            <Field id="u-status" label="অবস্থা"><select id="u-status" className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="active">সক্রিয়</option><option value="disabled">নিষ্ক্রিয়</option></select></Field>
          </div>
          {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? "অপেক্ষা করুন..." : "ব্যবহারকারী যোগ করুন"}</button>
        </form>
      </Modal>
      <Modal open={!!link} title="পাসওয়ার্ড সেট করার লিংক" onClose={() => setLink("")}>
        <p className="text-sm text-muted">নতুন অ্যাকাউন্ট তৈরি হয়েছে। এই লিংকটি শুধুমাত্র সংশ্লিষ্ট ব্যক্তিকে পাঠান, যাতে তিনি নিজের পাসওয়ার্ড সেট করতে পারেন।</p>
        <textarea readOnly className="input mt-3 text-xs" rows={4} value={link} onFocus={(e) => e.target.select()} />
        <button className="btn-outline mt-3" onClick={() => navigator.clipboard?.writeText(link).then(() => toast.success("লিংক কপি করা হয়েছে।"))}>লিংক কপি করুন</button>
      </Modal>
      <ConfirmModal open={!!rm} busy={busy} title="অ্যাক্সেস সরিয়ে দিন" message={`আপনি কি নিশ্চিত যে "${rm?.name || rm?.email}"-এর অ্যাডমিন অ্যাক্সেস সরিয়ে দিতে চান?`} confirmText="হ্যাঁ, সরিয়ে দিন" onCancel={() => setRm(null)} onConfirm={remove} />
    </>
  );
}
