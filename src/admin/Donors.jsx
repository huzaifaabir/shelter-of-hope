import { useState } from "react";
import { Link } from "react-router-dom";
import { AsyncView, Table, Title } from "./AdminUI";
import ConfirmModal, { Modal } from "../components/ConfirmModal";
import DonorForm from "../components/DonorForm";
import { Avatar, AvailabilityBadge } from "../components/DonorCard";
import { Pagination } from "../components/Feedback";
import { adminCreateDonor, deleteDonor, listDonors, updateDonor } from "../services/donorService";
import { useAsync } from "../lib/useAsync";
import { useDebounce } from "../lib/useDebounce";
import { useToast } from "../context/ToastContext";
import { BLOOD_GROUPS, AVAILABILITY } from "../lib/constants";
import { formatDate } from "../lib/bn";

export default function AdminDonors() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [bg, setBg] = useState("");
  const [av, setAv] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim());
  const state = useAsync(() => listDonors({ search: q, bloodGroup: bg, availability: av, page, limit: 15 }), [q, bg, av, page]);
  const [edit, setEdit] = useState(null); // donor object or {} for new
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  async function save(values) {
    try {
      if (edit.donorId) await updateDonor(edit.donorId, values);
      else await adminCreateDonor(values);
      toast.success("সফলভাবে সংরক্ষণ করা হয়েছে।");
      setEdit(null);
      state.reload();
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await deleteDonor(del.donorId);
      toast.success("সফলভাবে মুছে ফেলা হয়েছে।");
      setDel(null);
      state.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Title action={<button className="btn-primary btn-sm" onClick={() => setEdit({})}>নতুন রক্তদাতা যোগ করুন</button>}>রক্তদাতা ব্যবস্থাপনা</Title>
      <div className="mb-4 flex flex-wrap gap-3">
        <input type="search" aria-label="রক্তদাতা খুঁজুন" className="input max-w-xs" placeholder="নাম বা এলাকা দিয়ে খুঁজুন" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select aria-label="রক্তের গ্রুপ" className="input max-w-[160px]" value={bg} onChange={(e) => { setBg(e.target.value); setPage(1); }}>
          <option value="">সব গ্রুপ</option>
          {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select aria-label="রক্ত দেওয়ার অবস্থা" className="input max-w-[200px]" value={av} onChange={(e) => { setAv(e.target.value); setPage(1); }}>
          <option value="">সব অবস্থা</option>
          {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <AsyncView state={state}>
        {state.data && (
          <>
            <Table head={["ছবি", "নাম", "গ্রুপ", "অবস্থা", "মোবাইল", "এলাকা", "নিবন্ধনের তারিখ", "কার্যক্রম"]} isEmpty={!state.data.items.length} empty="বর্তমানে কোনো রক্তদাতা পাওয়া যায়নি।">
              {state.data.items.map((d) => (
                <tr key={d.donorId}>
                  <td className="td"><Avatar src={d.image} name={d.name} size="h-10 w-10" /></td>
                  <td className="td font-medium">{d.name}</td>
                  <td className="td font-bold text-brand-700">{d.bloodGroup}</td>
                  <td className="td"><AvailabilityBadge value={d.availability} /></td>
                  <td className="td">{d.phone}</td>
                  <td className="td">{d.upazila}, {d.district}</td>
                  <td className="td whitespace-nowrap">{formatDate(d.createdAt)}</td>
                  <td className="td whitespace-nowrap">
                    <Link to={`/donor/${d.donorId}`} className="btn-outline btn-sm mr-2">দেখুন</Link>
                    <button className="btn-outline btn-sm mr-2" onClick={() => setEdit(d)}>সম্পাদনা</button>
                    <button className="btn-danger btn-sm" onClick={() => setDel(d)}>মুছুন</button>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={state.data.page} pages={state.data.pages} onChange={setPage} />
          </>
        )}
      </AsyncView>
      <Modal open={!!edit} wide title={edit?.donorId ? "রক্তদাতার তথ্য সম্পাদনা" : "নতুন রক্তদাতা যোগ করুন"} onClose={() => setEdit(null)}>
        {edit && <DonorForm key={edit.donorId || "new"} editing initial={edit.donorId ? edit : null} showCount onSubmit={save} submitText="সংরক্ষণ করুন" />}
      </Modal>
      <ConfirmModal open={!!del} busy={busy} title="রক্তদাতা মুছে ফেলুন" message={`আপনি কি নিশ্চিত যে "${del?.name}"-এর তথ্য মুছে ফেলতে চান? এই কাজ ফিরিয়ে নেওয়া যাবে না।`} confirmText="হ্যাঁ, মুছে ফেলুন" onCancel={() => setDel(null)} onConfirm={remove} />
    </>
  );
}
