
const router = require("express").Router();
const multer = require("multer");
const MissingChild = require("../models/MissingChild");
const { requireEditor, verifyFirebaseToken } = require("../middleware/auth");
const storage = require("../services/storage");
const { str } = require("../utils/helpers");

const PUBLIC_FIELDS = "-internalNotes -createdBy -published";
const STATUSES = ["missing", "investigating", "found"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("শুধু JPG, PNG, WEBP বা GIF ছবি আপলোড করা যাবে।"));
    }

    cb(null, true);
  },
});

function clean(b = {}) {
  const parsedAge =
    b.age === "" || b.age == null ? null : parseInt(b.age, 10);

  const age =
    parsedAge == null || Number.isNaN(parsedAge)
      ? null
      : Math.max(0, Math.min(18, parsedAge));

  return {
    name: str(b.name, 120),
    age,
    gender: ["male", "female", "other"].includes(b.gender)
      ? b.gender
      : "",
    image: str(b.image, 600),
    missingDate:
      b.missingDate && !Number.isNaN(Date.parse(b.missingDate))
        ? new Date(b.missingDate)
        : null,
    missingPlace: str(b.missingPlace, 300),
    details: str(b.details, 3000),
    contactInfo: str(b.contactInfo, 300),
    status: STATUSES.includes(b.status) ? b.status : "missing",
    published: b.published === true || b.published === "true",
    internalNotes: str(b.internalNotes, 3000),
  };
}

async function processImage(req, data, previousImage = "") {
  if (!req.file) {
    data.image = previousImage || data.image || "";
    return;
  }

  const uploaded = await storage.savePublic(req.file, "missing");
  data.image = uploaded.url;
}

// ---- Own reports ---------------------------------------------------------
router.get("/mine", verifyFirebaseToken, async (req, res, next) => {
  try {
    const items = await MissingChild.find({
      createdBy: req.user.firebaseUid,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// ---- Staff list: all reports, including unpublished ---------------------
router.get("/admin/all", requireEditor, async (req, res, next) => {
  try {
    const items = await MissingChild.find()
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// ---- Staff create: declared before the regular user POST -----------------
router.post(
  "/",
  requireEditor,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const data = clean(req.body);

      if (!data.name) {
        return res.status(400).json({
          message: "অনুগ্রহ করে নিখোঁজ ব্যক্তির নাম লিখুন।",
        });
      }

      await processImage(req, data);

      const item = await MissingChild.create({
        ...data,
        createdBy: req.user.firebaseUid,
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

// ---- User submission: always unpublished until staff approval ------------
router.post(
  "/",
  verifyFirebaseToken,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const data = clean(req.body);

      if (!data.name) {
        return res.status(400).json({
          message: "অনুগ্রহ করে নিখোঁজ ব্যক্তির নাম লিখুন।",
        });
      }

      await processImage(req, data);
      data.published = false;
      data.internalNotes = "";

      const item = await MissingChild.create({
        ...data,
        createdBy: req.user.firebaseUid,
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

// ---- Update: owner or staff ----------------------------------------------
router.put(
  "/:id",
  verifyFirebaseToken,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const item = await MissingChild.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          message: "তথ্য পাওয়া যায়নি।",
        });
      }

      const staff = ["editor", "administrator"].includes(req.user.role);

      if (!staff && item.createdBy !== req.user.firebaseUid) {
        return res.status(403).json({
          message: "শুধু নিজের রিপোর্ট সম্পাদনা করতে পারবেন।",
        });
      }

      const data = clean(req.body);

      if (!data.name) {
        return res.status(400).json({
          message: "অনুগ্রহ করে নিখোঁজ ব্যক্তির নাম লিখুন।",
        });
      }

      await processImage(req, data, item.image);

      // Regular users cannot publish reports or change internal notes.
      if (!staff) {
        data.published = item.published;
        data.internalNotes = item.internalNotes;
      }

      if (item.image && item.image !== data.image) {
        await storage.deleteByUrl(item.image);
      }

      Object.assign(item, data);
      await item.save();

      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

// ---- Delete: staff only --------------------------------------------------
router.delete("/:id", requireEditor, async (req, res, next) => {
  try {
    const item = await MissingChild.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "তথ্য পাওয়া যায়নি।",
      });
    }

    await storage.deleteByUrl(item.image);
    await item.deleteOne();

    res.json({ message: "সফলভাবে মুছে ফেলা হয়েছে।" });
  } catch (error) {
    next(error);
  }
});

// ---- Public list: published reports only --------------------------------
router.get("/", async (req, res, next) => {
  try {
    const q = { published: true };

    if (STATUSES.includes(req.query.status)) {
      q.status = req.query.status;
    }

    const items = await MissingChild.find(q)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// ---- Public details: published reports only -----------------------------
router.get("/:id", async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(404).json({
        message: "তথ্য পাওয়া যায়নি।",
      });
    }

    const item = await MissingChild.findOne({
      _id: req.params.id,
      published: true,
    }).select(PUBLIC_FIELDS);

    if (!item) {
      return res.status(404).json({
        message: "তথ্য পাওয়া যায়নি।",
      });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
