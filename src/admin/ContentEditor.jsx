import { useState } from "react";
import { AsyncView, Title } from "./AdminUI";
import { Field } from "../components/Feedback";
import { getContent, saveContent } from "../services/heroService";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../context/ToastContext";

// Generic editor for "about" (editors+) and "settings" (administrators only)
function Form({ name, fields, initial }) {
  const toast = useToast();
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      setD(await saveContent(name, d));
      toast.success("সফলভাবে সংরক্ষণ করা হয়েছে।");
    } catch (er) {
      toast.error(er.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="card max-w-3xl space-y-4 p-6">
      {fields.map(([k, label, area]) => (
        <Field key={k} id={k} label={label}>
          {area ? <textarea id={k} rows={3} className="input" value={d[k] || ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} /> : <input id={k} className="input" value={d[k] || ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} />}
        </Field>
      ))}
      <button className="btn-primary" disabled={busy}>{busy ? "সংরক্ষণ করা হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}</button>
    </form>
  );
}

const ABOUT = [
  ["intro", "ভূমিকা (হোমপেজ ও আমাদের সম্পর্কে)", true], ["mission", "আমাদের লক্ষ্য", true], ["objective", "আমাদের উদ্দেশ্য", true],
  ["womenChildren", "নারী ও শিশু সুরক্ষা", true], ["bloodNetwork", "রক্তদাতা নেটওয়ার্ক", true], ["community", "কমিউনিটি সাপোর্ট", true], ["humanitarian", "মানবিক সহায়তা", true],
];
const SETTINGS = [
  ["orgName", "প্রতিষ্ঠানের নাম"], ["tagline", "ট্যাগলাইন"], ["address", "ঠিকানা", true], ["phone", "ফোন"], ["email", "ইমেইল"],
  ["facebook", "ফেসবুক লিংক (https://...)"], ["youtube", "ইউটিউব লিংক (https://...)"], ["footerText", "ফুটারের সংক্ষিপ্ত বর্ণনা", true],
];

export function AboutEditor() {
  const state = useAsync(() => getContent("about"), []);
  return <><Title>ওয়েবসাইট কনটেন্ট</Title><AsyncView state={state}>{state.data && <Form name="about" fields={ABOUT} initial={state.data} />}</AsyncView></>;
}
export function Settings() {
  const state = useAsync(() => getContent("settings"), []);
  return <><Title>সেটিংস (যোগাযোগ ও ফুটার)</Title><AsyncView state={state}>{state.data && <Form name="settings" fields={SETTINGS} initial={state.data} />}</AsyncView></>;
}
