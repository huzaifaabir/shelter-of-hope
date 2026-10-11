const multer = require("multer");

const MB = 1024 * 1024;
const ALLOWED = /^(image\/(jpeg|png|webp|gif)|audio\/(mpeg|mp4|webm|ogg|wav|x-m4a|aac)|video\/(mp4|webm|quicktime))$/;

const upload = (maxMb, maxFiles = 1) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * MB, files: maxFiles },
    fileFilter: (req, file, cb) =>
      ALLOWED.test(file.mimetype) ? cb(null, true) : cb(new Error("UNSUPPORTED_FILE")),
  });

module.exports = { upload };
