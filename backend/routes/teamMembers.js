const router = require("express").Router();
const mongoose = require("mongoose");
const TeamMember = require("../models/TeamMember");
const { verifyFirebaseToken } = require("../middleware/auth");
const storage = require("../services/storage");

const isStaff = (user) =>
  user && ["editor", "administrator"].includes(user.role);

function clean(body = {}, partial = false) {
  const data = {};

  const fields = {
    name: 120,
    designation: 120,
    image: 600,
    email: 160,
    phone: 30,
    bio: 1000,
  };

  for (const [key, max] of Object.entries(fields)) {
    if (body[key] === undefined) continue;

    const value = typeof body[key] === "string"
      ? body[key].trim().slice(0, max)
      : "";

    data[key] = value;
  }

  if (!partial || body.published !== undefined) {
    data.published = body.published === true || body.published === "true";
  }

  if (!partial || body.sortOrder !== undefined) {
    const order = Number(body.sortOrder);
    data.sortOrder = Number.isFinite(order)
      ? Math.max(0, Math.min(9999, Math.trunc(order)))
      : 0;
  }

  return data;
}

function validate(data, partial = false) {
  const errors = {};

  if ((!partial || data.name !== undefined) && !data.name?.trim()) {
    errors.name = "সদস্যের নাম লিখুন।";
  }

  if (
    (!partial || data.designation !== undefined) &&
    !data.designation?.trim()
  ) {
    errors.designation = "সদস্যের পদবি লিখুন।";
  }

  if (
    data.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    errors.email = "সঠিক ইমেইল ঠিকানা লিখুন।";
  }

  return errors;
}

function staffOnly(req, res, next) {
  if (!isStaff(req.user)) {
    return res.status(403).json({
      message: "আপনার এই কাজটি করার অনুমতি নেই।",
    });
  }
  next();
}

// Public: প্রকাশিত সদস্যদের তালিকা
router.get("/", async (req, res) => {
  const items = await TeamMember.find({ published: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  res.json({ items });
});

// Staff: সব সদস্যের তালিকা
// এটি /:id route-এর আগে রাখতে হবে।
router.get("/admin/all", verifyFirebaseToken, staffOnly, async (req, res) => {
  const items = await TeamMember.find()
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  res.json({ items });
});

// Staff: নতুন সদস্য যোগ
router.post("/", verifyFirebaseToken, staffOnly, async (req, res) => {
  const data = clean(req.body);
  const errors = validate(data);

  if (Object.keys(errors).length) {
    return res.status(400).json({
      message: "তথ্য সঠিক নয়।",
      errors,
    });
  }

  const item = await TeamMember.create(data);

  res.status(201).json({
    message: "নতুন সদস্য যোগ করা হয়েছে।",
    item,
  });
});

// Staff: সদস্য সম্পাদনা
router.put("/:id", verifyFirebaseToken, staffOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "সদস্যের আইডি সঠিক নয়।" });
  }

  const item = await TeamMember.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ message: "সদস্যকে খুঁজে পাওয়া যায়নি।" });
  }

  const data = clean(req.body, true);
  const errors = validate(data, true);

  if (Object.keys(errors).length) {
    return res.status(400).json({
      message: "তথ্য সঠিক নয়।",
      errors,
    });
  }

  if (data.image !== undefined && data.image !== item.image) {
    const oldImage = item.image;
    item.image = data.image;
    await item.save();
    if (oldImage) await storage.deleteByUrl(oldImage);
  }

  Object.assign(item, data);
  await item.save();

  res.json({
    message: "সদস্যের তথ্য আপডেট হয়েছে।",
    item,
  });
});

// Staff: সদস্য মুছে ফেলা
router.delete("/:id", verifyFirebaseToken, staffOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "সদস্যের আইডি সঠিক নয়।" });
  }

  const item = await TeamMember.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ message: "সদস্যকে খুঁজে পাওয়া যায়নি।" });
  }

  await item.deleteOne();

  if (item.image) await storage.deleteByUrl(item.image);

  res.json({ message: "সদস্যকে মুছে ফেলা হয়েছে।" });
});

module.exports = router;