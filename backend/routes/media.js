
const router = require("express").Router();
const {
  verifyFirebaseToken,
  requireEditor,
} = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const storage = require("../services/storage");

const PUBLIC_FOLDERS = {
  donors: "user",
  hero: "staff",
  missing: "staff",
  team: "staff",
};

const imageUpload = upload(5, 1).single("file");
const videoUpload = upload(40, 1).single("file");

function handler(kind) {
  return async (req, res) => {
    try {
      const folder = req.query.folder;
      const needs = PUBLIC_FOLDERS[folder];

      if (!needs) {
        return res.status(400).json({
          message: "ফোল্ডার সঠিক নয়।",
        });
      }

      if (
        needs === "staff" &&
        !["editor", "administrator"].includes(req.user?.role)
      ) {
        return res.status(403).json({
          message: "আপনার এই কাজটি করার অনুমতি নেই।",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "অনুগ্রহ করে একটি ফাইল নির্বাচন করুন।",
        });
      }

      const isImage = req.file.mimetype.startsWith("image/");
      const isVideo = req.file.mimetype.startsWith("video/");

      if (
        (kind === "image" && !isImage) ||
        (kind === "video" && (!isVideo || folder !== "hero"))
      ) {
        return res.status(400).json({
          message: "ফাইলের ধরন সঠিক নয়।",
        });
      }

      const result = await storage.savePublic(req.file, folder);

      return res.status(201).json({
        url: result.url,
        path: result.path,
      });
    } catch (error) {
      console.error("MEDIA UPLOAD ERROR:", error);
      return res.status(500).json({
        message: "ফাইল আপলোড করা যায়নি।",
        error: error.message || "Unknown server error",
      });
    }
  };
}

router.post("/image", verifyFirebaseToken, imageUpload, handler("image"));
router.post("/video", verifyFirebaseToken, videoUpload, handler("video"));

router.delete("/", requireEditor, async (req, res) => {
  try {
    await storage.deleteByUrl(req.body.url);
    return res.json({
      message: "সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error) {
    console.error("MEDIA DELETE ERROR:", error);
    return res.status(500).json({
      message: "ফাইল মুছে ফেলা যায়নি।",
    });
  }
});

module.exports = router;
