const router = require("express").Router();
const Donor = require("../models/Donor");
const { BLOOD_GROUPS } = require("../models/Donor");
const { verifyFirebaseToken, optionalAuth } = require("../middleware/auth");
const storage = require("../services/storage");
const { escapeRegex, normalizeBloodGroup, newDonorId, isValidPhone, cleanPhone, str } = require("../utils/helpers");

const isStaff = (u) => u.role === "editor" || u.role === "administrator";

// Hide phone from public responses when the donor chose privacy
const publicView = (d, staff = false) => {
  const o = d.toObject();
  delete o.userId;
  delete o.consent;
  if (!o.phonePublic && !staff) o.phone = "";
  return o;
};

function validate(body, { partial = false } = {}) {
  const errors = {};
  const need = (k, msg) => {
    if (!partial || body[k] !== undefined) if (!str(body[k], 300)) errors[k] = msg;
  };
  need("name", "অনুগ্রহ করে আপনার নাম লিখুন।");
  need("division", "অনুগ্রহ করে বিভাগ নির্বাচন করুন।");
  need("district", "অনুগ্রহ করে জেলা নির্বাচন করুন।");
  need("upazila", "অনুগ্রহ করে উপজেলা লিখুন।");
  need("village", "অনুগ্রহ করে গ্রামের নাম লিখুন।");
  if (!partial || body.bloodGroup !== undefined)
    if (!BLOOD_GROUPS.includes(body.bloodGroup)) errors.bloodGroup = "অনুগ্রহ করে রক্তের গ্রুপ নির্বাচন করুন।";
  if (!partial || body.phone !== undefined) {
    if (!str(body.phone)) errors.phone = "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।";
    else if (!isValidPhone(body.phone)) errors.phone = "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।";
  }
  if (!partial && body.consent !== true) errors.consent = "অনুগ্রহ করে সম্মতি প্রদান করুন।";
  if (body.lastDonationDate && isNaN(Date.parse(body.lastDonationDate))) errors.lastDonationDate = "তারিখ সঠিক নয়।";
  return errors;
}

const FIELDS = ["name", "image", "bloodGroup", "availability", "lastDonationDate", "phonePublic", "division", "district", "upazila", "unionOrThana", "village", "additionalInfo", "donationCount"];

function clean(body) {
  const out = {};
  for (const k of FIELDS) {
    if (body[k] === undefined) continue;
    if (k === "phone") continue;
    if (k === "phonePublic") out[k] = !!body[k];
    else if (k === "donationCount") out[k] = Math.max(0, Math.min(999, parseInt(body[k], 10) || 0));
    else if (k === "lastDonationDate") out[k] = body[k] ? new Date(body[k]) : null;
    else if (k === "availability") out[k] = body[k] === "unavailable" ? "unavailable" : "available";
    else if (k === "image") out[k] = str(body[k], 600);
    else out[k] = str(body[k], k === "additionalInfo" ? 1000 : 150);
  }
  if (body.phone !== undefined) out.phone = cleanPhone(str(body.phone, 30));
  if (body.bloodGroup !== undefined) out.bloodGroup = normalizeBloodGroup(body.bloodGroup);
  return out;
}

// ---- Public list / search -------------------------------------------------
router.get("/", optionalAuth, async (req, res) => {
  const staff = !!req.user && isStaff(req.user);
  const { search, bloodGroup, availability, district, upazila, division } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const q = {};
  if (bloodGroup) {
    const bg = normalizeBloodGroup(bloodGroup);
    if (BLOOD_GROUPS.includes(bg)) q.bloodGroup = bg;
  }
  if (availability === "available" || availability === "unavailable") q.availability = availability;
  const exact = (v) => new RegExp(escapeRegex(str(v, 80)), "i");
  if (district) q.district = exact(district);
  if (upazila) q.upazila = exact(upazila);
  if (division) q.division = exact(division);
  if (search && str(search, 80)) {
    const rx = exact(search);
    q.$or = [{ name: rx }, { village: rx }, { upazila: rx }, { district: rx }, { division: rx }];
  }
  const [items, total] = await Promise.all([
    Donor.find(q).sort({ availability: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Donor.countDocuments(q),
  ]);
  res.json({ items: items.map((d) => publicView(d, staff)), total, page, pages: Math.ceil(total / limit) });
});

// ---- Own donor profile (must be before /:id) ------------------------------
router.get("/mine", verifyFirebaseToken, async (req, res) => {
  const donor = await Donor.findOne({ userId: req.firebase.uid });
  res.json({ donor: donor ? donor.toObject() : null });
});

router.get("/:id", optionalAuth, async (req, res) => {
  const donor = await Donor.findOne({ donorId: req.params.id });
  if (!donor) return res.status(404).json({ message: "রক্তদাতার তথ্য পাওয়া যায়নি।" });
  res.json(publicView(donor, !!req.user && isStaff(req.user)));
});

// ---- Create (owner = authenticated user) ----------------------------------
router.post("/", verifyFirebaseToken, async (req, res) => {
  const errors = validate(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: "তথ্য সঠিক নয়।", errors });
  if (await Donor.exists({ userId: req.firebase.uid }))
    return res.status(409).json({ message: "আপনি ইতোমধ্যে রক্তদাতা হিসেবে নিবন্ধিত আছেন।" });
  const data = clean(req.body);
  delete data.donationCount; // only staff/owner updates later
  const donor = await Donor.create({ ...data, userId: req.firebase.uid, donorId: newDonorId(), consent: true });
  res.status(201).json(donor.toObject());
});

// ---- Update: owner, or staff ----------------------------------------------
router.put("/:id", verifyFirebaseToken, async (req, res) => {
  const donor = await Donor.findOne({ donorId: req.params.id });
  if (!donor) return res.status(404).json({ message: "রক্তদাতার তথ্য পাওয়া যায়নি।" });
  if (donor.userId !== req.firebase.uid && !isStaff(req.user))
    return res.status(403).json({ message: "আপনার এই কাজটি করার অনুমতি নেই।" });
  const errors = validate(req.body, { partial: true });
  if (Object.keys(errors).length) return res.status(400).json({ message: "তথ্য সঠিক নয়।", errors });
  const data = clean(req.body);
  if (data.image !== undefined && data.image !== donor.image) await storage.deleteByUrl(donor.image);
  Object.assign(donor, data);
  await donor.save();
  res.json(donor.toObject());
});

// ---- Delete: owner (self-removal), or staff -------------------------------
router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  const donor = await Donor.findOne({ donorId: req.params.id });
  if (!donor) return res.status(404).json({ message: "রক্তদাতার তথ্য পাওয়া যায়নি।" });
  if (donor.userId !== req.firebase.uid && !isStaff(req.user))
    return res.status(403).json({ message: "আপনার এই কাজটি করার অনুমতি নেই।" });
  await storage.deleteByUrl(donor.image);
  await donor.deleteOne();
  res.json({ message: "সফলভাবে সরিয়ে দেওয়া হয়েছে।" });
});

// ---- Staff create on behalf of someone (no Firebase owner) -----------------
router.post("/admin/create", verifyFirebaseToken, async (req, res) => {
  if (!isStaff(req.user)) return res.status(403).json({ message: "আপনার এই কাজটি করার অনুমতি নেই।" });
  const errors = validate({ ...req.body, consent: true });
  if (Object.keys(errors).length) return res.status(400).json({ message: "তথ্য সঠিক নয়।", errors });
  const donorId = newDonorId();
  const donor = await Donor.create({ ...clean(req.body), userId: `admin:${donorId}`, donorId, consent: true });
  res.status(201).json(donor.toObject());
});

module.exports = router;
