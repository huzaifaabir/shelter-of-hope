
const crypto = require("crypto");
const path = require("path");
const imagekit = require("../config/imagekit");

function typeOf(mime = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

function makeFileName(file) {
  const ext = path
    .extname(file.originalname || "")
    .toLowerCase()
    .replace(/[^.a-z0-9]/g, "")
    .slice(0, 10);

  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
}

async function savePublic(file, folder = "uploads") {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new Error("Uploaded file buffer is missing or empty.");
  }

  if (!["donors", "hero", "missing", "team"].includes(folder)) {
  throw new Error("Invalid upload folder.");
}

  const mime = file.mimetype || "";
  const isImage = /^image\/(jpeg|png|webp|gif)$/.test(mime);
  const isVideo = /^video\/(mp4|webm|quicktime)$/.test(mime);

  if (!isImage && !(folder === "hero" && isVideo)) {
    throw new Error("Unsupported file type: " + mime);
  }

  const fileName = makeFileName(file);

  try {
    const result = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName,
      folder: `/shelter-of-hope/${folder}`,
      useUniqueFileName: false,
    });

    if (!result || !result.url || !result.fileId) {
      throw new Error("ImageKit did not return the file URL or ID.");
    }

    return {
      url: result.url,
      path: result.fileId,
      type: typeOf(mime),
    };
  } catch (error) {
    console.error("IMAGEKIT UPLOAD DETAILS:", {
      message: error.message,
      statusCode: error.statusCode,
      statusNumber: error.statusNumber,
      fileName,
      folder,
      fileSize: file.buffer.length,
      mimeType: mime,
    });

    throw error;
  }
}

async function savePrivate() {
  throw new Error(
    "Private evidence storage is not configured. Upload was not performed."
  );
}

async function signedUrl() {
  throw new Error("Private evidence storage is not configured.");
}

async function deleteByUrl(url) {
  if (!url || typeof url !== "string") return;

  try {
    const parsed = new URL(url);
    const endpointValue = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!endpointValue) return;

    const endpoint = new URL(endpointValue);
    const basePath = endpoint.pathname.replace(/\/+$/, "");

    if (
      parsed.hostname !== endpoint.hostname ||
      !parsed.pathname.startsWith(basePath + "/")
    ) {
      return;
    }

    const fileId = parsed.searchParams.get("fileId");

    if (fileId) {
      await deleteByPath(fileId);
      return;
    }

    console.warn(
      "ImageKit deletion requires the stored fileId, not only the URL."
    );
  } catch (error) {
    console.warn("ImageKit delete failed:", error.message);
  }
}

async function deleteByPath(fileId) {
  if (!fileId || typeof fileId !== "string") return;

  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.warn("ImageKit delete failed:", error.message);
  }
}

module.exports = {
  savePublic,
  savePrivate,
  signedUrl,
  deleteByUrl,
  deleteByPath,
};
