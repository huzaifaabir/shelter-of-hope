const router = require("express").Router();
const SiteContent = require("../models/SiteContent");
const defaults = require("../utils/defaultContent");
const { requireEditor, requireAdministrator } = require("../middleware/auth");
const storage = require("../services/storage");
const { str, safeLink } = require("../utils/helpers");

const KEYS = ["hero", "about", "settings"];

async function load(key) {
  const doc = await SiteContent.findOne({ key });
  return { ...defaults[key], ...(doc ? doc.data : {}) };
}

const sanitizers = {
  hero(b, current) {
    const images = (Array.isArray(b.images) ? b.images : []).map((u) => str(u, 600)).filter(Boolean).slice(0, 5);
    return {
      title: str(b.title, 150),
      subtitle: str(b.subtitle, 250),
      paragraph: str(b.paragraph, 800),
      primaryText: str(b.primaryText, 60),
      primaryLink: safeLink(b.primaryLink),
      secondaryText: str(b.secondaryText, 60),
      secondaryLink: safeLink(b.secondaryLink),
      mode: b.mode === "video" ? "video" : "images",
      images,
      video: { url: str(b.video?.url, 600), enabled: !!b.video?.enabled && !!str(b.video?.url, 600) },
      _prev: current,
    };
  },
  about(b) {
    const out = {};
    for (const k of ["intro", "mission", "objective", "womenChildren", "bloodNetwork", "community", "humanitarian"])
      out[k] = str(b[k], 2000);
    return out;
  },
  settings(b) {
    const out = {};
    for (const k of ["orgName", "tagline", "address", "phone", "email", "footerText"]) out[k] = str(b[k], 400);
    for (const k of ["facebook", "youtube"]) out[k] = /^https?:\/\//.test(str(b[k], 300)) ? str(b[k], 300) : "";
    return out;
  },
};

async function save(key, req, res) {
  const current = await load(key);
  const data = sanitizers[key](req.body, current);
  const prev = data._prev;
  delete data._prev;
  if (key === "hero") {
    // remove media files that were dropped from the configuration
    const dropped = [...(prev.images || []), prev.video?.url].filter(
      (u) => u && !data.images.includes(u) && u !== data.video.url
    );
    await Promise.all(dropped.map((u) => storage.deleteByUrl(u)));
  }
  await SiteContent.findOneAndUpdate({ key }, { data, updatedBy: req.user.firebaseUid }, { upsert: true, new: true });
  res.json({ ...defaults[key], ...data });
}

router.get("/hero", async (req, res) => res.json(await load("hero")));
router.put("/hero", requireEditor, (req, res) => save("hero", req, res));

router.get("/content/:key", async (req, res) => {
  if (!KEYS.includes(req.params.key)) return res.status(404).json({ message: "তথ্য পাওয়া যায়নি।" });
  res.json(await load(req.params.key));
});

router.put("/content/:key", (req, res, next) => {
  const key = req.params.key;
  if (!KEYS.includes(key)) return res.status(404).json({ message: "তথ্য পাওয়া যায়নি।" });
  // settings (contact/security) = administrator only; hero/about = editor+
  const guard = key === "settings" ? requireAdministrator : requireEditor;
  let i = 0;
  const run = (err) => {
    if (err) return next(err);
    const fn = guard[i++];
    if (!fn) return save(key, req, res).catch(next);
    fn(req, res, run);
  };
  run();
});

module.exports = router;
