import { useRef, useState } from "react";
import { AsyncView, Title } from "./AdminUI";
import ImageUpload from "../components/ImageUpload";
import { Field } from "../components/Feedback";
import { getHero, saveHero } from "../services/heroService";
import { checkVideo, uploadVideo } from "../services/mediaService";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../context/ToastContext";

function HeroForm({ initial }) {
  const toast = useToast();
  const [h, setH] = useState({ ...initial, images: [...(initial.images || []), "", "", "", "", ""].slice(0, 5) });
  const [busy, setBusy] = useState(false);
  const [vBusy, setVBusy] = useState(false);
  const vRef = useRef(null);
  const set = (k) => (e) => setH((s) => ({ ...s, [k]: e.target.value }));
  const text = (k, label, props = {}) => (
    <Field id={k} label={label}>{props.area ? <textarea id={k} rows={3} className="input" value={h[k] || ""} onChange={set(k)} /> : <input id={k} className="input" value={h[k] || ""} onChange={set(k)} />}</Field>
  );

  async function pickVideo(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = checkVideo(file);
    if (err) return toast.error(err);
    setVBusy(true);
    try {
      const url = await uploadVideo(file, "hero");
      setH((s) => ({ ...s, video: { url, enabled: true } }));
    } catch (er) {
      toast.error(er.message);
    } finally {
      setVBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      const saved = await saveHero({ ...h, images: h.images.filter(Boolean) });
      setH({ ...saved, images: [...saved.images, "", "", "", "", ""].slice(0, 5) });
      toast.success("সফলভাবে সংরক্ষণ করা হয়েছে।");
    } catch (er) {
      toast.error(er.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-lg">হিরো লেখা</h2>
        {text("title", "শিরোনাম")}
        {text("subtitle", "উপশিরোনাম")}
        {text("paragraph", "বর্ণনা", { area: true })}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("primaryText", "প্রধান বাটনের লেখা")}
          {text("primaryLink", "প্রধান বাটনের লিংক")}
          {text("secondaryText", "দ্বিতীয় বাটনের লেখা")}
          {text("secondaryLink", "দ্বিতীয় বাটনের লিংক")}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg">হিরো মিডিয়া</h2>
        <p className="mt-1 text-sm text-muted">একসঙ্গে শুধু একটি মোড সক্রিয় থাকবে।</p>
        <div role="radiogroup" aria-label="হিরো মিডিয়া মোড" className="mt-4 flex flex-wrap gap-3">
          {[["images", "ছবির স্লাইডার"], ["video", "ভিডিও"]].map(([v, l]) => (
            <label key={v} className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${h.mode === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line"}`}>
              <input type="radio" name="mode" className="sr-only" checked={h.mode === v} onChange={() => setH({ ...h, mode: v })} />{l}
            </label>
          ))}
        </div>

        {h.mode === "images" ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {h.images.map((src, i) => (
              <div key={i}>
                <span className="label">ছবি {i + 1}</span>
                <ImageUpload folder="hero" value={src} label="ছবি আপলোড করুন" onChange={(u) => setH((s) => ({ ...s, images: s.images.map((x, n) => (n === i ? u : x)) }))} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            {h.video?.url && <video src={h.video.url} controls muted playsInline preload="metadata" className="mb-4 aspect-video w-full max-w-lg rounded-lg bg-black" />}
            <input ref={vRef} type="file" accept="video/mp4,video/webm" className="sr-only" onChange={pickVideo} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-outline btn-sm" disabled={vBusy} onClick={() => vRef.current.click()}>{vBusy ? "আপলোড হচ্ছে..." : h.video?.url ? "ভিডিও পরিবর্তন করুন" : "ভিডিও আপলোড করুন"}</button>
              {h.video?.url && <button type="button" className="btn-outline btn-sm" onClick={() => setH({ ...h, video: { url: "", enabled: false } })}>ভিডিও সরিয়ে দিন</button>}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[#c2005a]" disabled={!h.video?.url} checked={!!h.video?.enabled} onChange={(e) => setH({ ...h, video: { ...h.video, enabled: e.target.checked } })} />
              ভিডিও চালু রাখুন
            </label>
            <p className="mt-2 text-xs text-muted">সর্বোচ্চ ৪০ এমবি (MP4 বা WebM)। ভিডিও শব্দ ছাড়া শুরু হয়।</p>
          </div>
        )}
      </section>
      <button className="btn-primary" onClick={save} disabled={busy || vBusy}>{busy ? "সংরক্ষণ করা হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}</button>
    </div>
  );
}

export default function AdminHero() {
  const state = useAsync(getHero, []);
  return (
    <>
      <Title>হিরো ও হোমপেজ</Title>
      <AsyncView state={state}>{state.data && <HeroForm initial={state.data} />}</AsyncView>
    </>
  );
}
