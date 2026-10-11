import { useState } from "react";
import { AsyncView, Table, Title } from "./AdminUI";
import ConfirmModal, { Modal } from "../components/ConfirmModal";
import { deleteReport, getEvidence, listReports, updateReport } from "../services/adminService";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../context/ToastContext";
import { REPORT_STATUS } from "../lib/constants";
import { formatDate } from "../lib/bn";

const cfg = {
  emergency: { title: "জরুরি সহায়তার অনুরোধ", empty: "বর্তমানে কোনো অনুরোধ নেই।" },
  complaint: { title: "অভিযোগ", empty: "বর্তমানে কোনো অভিযোগ নেই।" },
  contact: { title: "যোগাযোগের বার্তা", empty: "বর্তমানে কোনো বার্তা নেই।" },
};
const cls = { new: "bg-red-50 text-red-700", reviewing: "bg-amber-50 text-amber-700", resolved: "bg-emerald-50 text-emerald-700", closed: "bg-slate-100 text-slate-600" };

function Evidence({ kind, id, items }) {
  const [media, setMedia] = useState({});
  const show = async (i) => {
    try { setMedia((m) => ({ ...m, [i]: null })); const r = await getEvidence(kind, id, i); setMedia((m) => ({ ...m, [i]: r })); } catch { setMedia((m) => ({ ...m, [i]: { error: true } })); }
  };
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <h3 className="text-base">সংযুক্ত ফাইল</h3>
      <ul className="mt-2 space-y-3">
        {items.map((e, i) => (
          <li key={i} className="text-sm">
            {media[i]?.url ? (
              e.type === "image" ? <img src={media[i].url} alt={e.name} className="max-h-64 rounded-lg" /> : e.type === "audio" ? <audio controls src={media[i].url} /> : <video controls src={media[i].url} className="max-h-64 rounded-lg" />
            ) : media[i]?.error ? <span className="text-red-600">ফাইল লোড করা যায়নি।</span> : (
              <button className="btn-outline btn-sm" onClick={() => show(i)}>{e.name || `ফাইল ${i + 1}`} দেখুন ({e.type === "image" ? "ছবি" : e.type === "audio" ? "অডিও" : "ভিডিও"})</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Cases({ kind }) {
  const c = cfg[kind];
  const toast = useToast();
  const [status, setStatus] = useState("");
  const state = useAsync(() => listReports(kind, status), [kind, status]);
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState("");
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const patch = async (r, body) => {
    try { const u = await updateReport(kind, r._id, body); setSel(u); toast.success("সফলভাবে সংরক্ষণ করা হয়েছে।"); state.reload(); } catch (e) { toast.error(e.message); }
  };
  async function remove() {
    setBusy(true);
    try { await deleteReport(kind, del._id); toast.success("সফলভাবে মুছে ফেলা হয়েছে।"); setDel(null); setSel(null); state.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  return (
    <>
      <Title action={<select aria-label="অবস্থা অনুযায়ী ফিল্টার" className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">সব অবস্থা</option>{Object.entries(REPORT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}>{c.title}</Title>
      <AsyncView state={state}>
        {state.data && (
          <Table head={["তারিখ", "নাম", "বিষয়", "মোবাইল", "অবস্থা", "কার্যক্রম"]} isEmpty={!state.data.items.length} empty={c.empty}>
            {state.data.items.map((r) => (
              <tr key={r._id}>
                <td className="td whitespace-nowrap">{formatDate(r.createdAt)}</td>
                <td className="td font-medium">{r.name || "অজ্ঞাত"}</td>
                <td className="td max-w-[240px] truncate">{r.subject || r.details}</td>
                <td className="td">{r.phone || "—"}</td>
                <td className="td"><span className={`badge ${cls[r.status]}`}>{REPORT_STATUS[r.status]}</span></td>
                <td className="td"><button className="btn-outline btn-sm" onClick={() => { setSel(r); setNote(r.adminNote || ""); }}>দেখুন</button></td>
              </tr>
            ))}
          </Table>
        )}
      </AsyncView>
      <Modal open={!!sel} wide title={c.title} onClose={() => setSel(null)}>
        {sel && (
          <div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="inline text-muted">নাম: </dt><dd className="inline font-medium">{sel.name || "অজ্ঞাত"}</dd></div>
              <div><dt className="inline text-muted">মোবাইল: </dt><dd className="inline font-medium">{sel.phone ? <a className="text-brand-700" href={`tel:${sel.phone}`}>{sel.phone}</a> : "—"}</dd></div>
              {sel.email && <div><dt className="inline text-muted">ইমেইল: </dt><dd className="inline font-medium">{sel.email}</dd></div>}
              {sel.location && <div><dt className="inline text-muted">অবস্থান: </dt><dd className="inline font-medium">{sel.location}</dd></div>}
              <div><dt className="inline text-muted">জমার তারিখ: </dt><dd className="inline font-medium">{formatDate(sel.createdAt)}</dd></div>
            </dl>
            {sel.subject && <h3 className="mt-4 text-base">{sel.subject}</h3>}
            <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm">{sel.details}</p>
            <Evidence kind={kind} id={sel._id} items={sel.evidence || []} />
            <div className="mt-5 grid gap-4 sm:grid-cols-[200px_1fr]">
              <div><label htmlFor="st" className="label">অবস্থা</label><select id="st" className="input" value={sel.status} onChange={(e) => patch(sel, { status: e.target.value })}>{Object.entries(REPORT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label htmlFor="nt" className="label">অভ্যন্তরীণ নোট</label><textarea id="nt" rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
            </div>
            <div className="mt-4 flex gap-3"><button className="btn-primary btn-sm" onClick={() => patch(sel, { adminNote: note })}>নোট সংরক্ষণ করুন</button><button className="btn-danger btn-sm" onClick={() => setDel(sel)}>মুছে ফেলুন</button></div>
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!del} busy={busy} title="মুছে ফেলুন" message="আপনি কি নিশ্চিত যে এটি স্থায়ীভাবে মুছে ফেলতে চান? সংযুক্ত ফাইলও মুছে যাবে।" confirmText="হ্যাঁ, মুছে ফেলুন" onCancel={() => setDel(null)} onConfirm={remove} />
    </>
  );
}
