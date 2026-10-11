// Emergency requests, complaints, contact messages
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const Report = require("../models/Report");
const { optionalAuth, requireEditor } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const storage = require("../services/storage");
const { str, isValidPhone, cleanPhone } = require("../utils/helpers");

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
});

const KINDS = ["emergency", "complaint", "contact"];
const STATUSES = ["new", "reviewing", "resolved", "closed"];

// Public submit: /api/reports/:kind  (multipart, up to 3 evidence files)
router.post(
  "/:kind",
  submitLimiter,
  optionalAuth,
  (req, res, next) => (KINDS.includes(req.params.kind) ? next() : res.status(404).json({ message: "তথ্য পাওয়া যায়নি।" })),
  upload(25, 3).array("evidence", 3),
  async (req, res) => {
    const { kind } = req.params;
    const b = req.body;
    const errors = {};
    const details = str(b.details, 4000);
    if (!details) errors.details = "অনুগ্রহ করে বিস্তারিত লিখুন।";
    if (kind === "emergency") {
      if (!str(b.name)) errors.name = "অনুগ্রহ করে আপনার নাম লিখুন।";
      if (!str(b.phone)) errors.phone = "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।";
    }
    if (str(b.phone) && !isValidPhone(b.phone)) errors.phone = "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।";
    if (kind === "contact" && !str(b.name)) errors.name = "অনুগ্রহ করে আপনার নাম লিখুন।";
    if (kind === "contact" && !str(b.email) && !str(b.phone)) errors.email = "ইমেইল অথবা মোবাইল নম্বর দিন।";
    if (str(b.email) && !/^\S+@\S+\.\S+$/.test(str(b.email))) errors.email = "সঠিক ইমেইল ঠিকানা দিন।";
    if (Object.keys(errors).length) return res.status(400).json({ message: "তথ্য সঠিক নয়।", errors });

    const evidence = kind === "contact" ? [] : await Promise.all((req.files || []).map((f) => storage.savePrivate(f)));
    await Report.create({
      kind,
      name: str(b.name, 120),
      phone: b.phone ? cleanPhone(str(b.phone, 30)) : "",
      email: str(b.email, 160),
      subject: str(b.subject, 200),
      details,
      location: str(b.location, 300),
      evidence,
      submittedBy: req.user ? req.user.firebaseUid : "",
    });
    res.status(201).json({ message: "আপনার অনুরোধটি সফলভাবে জমা দেওয়া হয়েছে।" });
  }
);

// Staff: list
router.get("/:kind", requireEditor, async (req, res) => {
  if (!KINDS.includes(req.params.kind)) return res.status(404).json({ message: "তথ্য পাওয়া যায়নি।" });
  const q = { kind: req.params.kind };
  if (STATUSES.includes(req.query.status)) q.status = req.query.status;
  const items = await Report.find(q).sort({ createdAt: -1 }).limit(300);
  res.json({ items });
});

// Staff: short-lived signed URL for one evidence file
router.get("/:kind/:id/evidence/:index", requireEditor, async (req, res) => {
  const r = await Report.findById(req.params.id).select("evidence");
  const ev = r && r.evidence[parseInt(req.params.index, 10)];
  if (!ev) return res.status(404).json({ message: "ফাইল পাওয়া যায়নি।" });
  res.json({ url: await storage.signedUrl(ev.path), type: ev.type, name: ev.name });
});

router.put("/:kind/:id", requireEditor, async (req, res) => {
  const r = KINDS.includes(req.params.kind) ? await Report.findOne({ _id: req.params.id, kind: req.params.kind }) : null;
  if (!r) return res.status(404).json({ message: "তথ্য পাওয়া যায়নি।" });
  if (STATUSES.includes(req.body.status)) r.status = req.body.status;
  if (req.body.adminNote !== undefined) r.adminNote = str(req.body.adminNote, 2000);
  await r.save();
  res.json(r);
});

router.delete("/:kind/:id", requireEditor, async (req, res) => {
  const r = KINDS.includes(req.params.kind) ? await Report.findOne({ _id: req.params.id, kind: req.params.kind }) : null;
  if (!r) return res.status(404).json({ message: "তথ্য পাওয়া যায়নি।" });
  await Promise.all(r.evidence.map((e) => storage.deleteByPath(e.path)));
  await r.deleteOne();
  res.json({ message: "সফলভাবে মুছে ফেলা হয়েছে।" });
});

module.exports = router;
