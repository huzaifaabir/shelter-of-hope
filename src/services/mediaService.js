// Media helpers. Files go through the backend (Firebase Admin → Firebase Storage),
// so Storage rules can stay locked and permissions are enforced server-side.
import { api } from "./api";

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 40 * 1024 * 1024;

export function checkImage(file) {
  if (!file.type.startsWith("image/")) return "অনুগ্রহ করে একটি ছবি নির্বাচন করুন।";
  if (file.size > MAX_IMAGE) return "ছবির আকার সর্বোচ্চ ৫ এমবি হতে পারবে।";
  return "";
}
export function checkVideo(file) {
  if (!file.type.startsWith("video/")) return "অনুগ্রহ করে একটি ভিডিও নির্বাচন করুন।";
  if (file.size > MAX_VIDEO) return "ভিডিওর আকার সর্বোচ্চ ৪০ এমবি হতে পারবে।";
  return "";
}

const send = async (kind, file, folder) => {
  const fd = new FormData();
  fd.append("file", file);
  const { url } = await api(`/media/${kind}?folder=${folder}`, { method: "POST", auth: true, body: fd });
  return url;
};

export const uploadImage = (file, folder = "donors") => {
  const err = checkImage(file);
  if (err) throw new Error(err);
  return send("image", file, folder);
};
export const uploadVideo = (file, folder = "hero") => {
  const err = checkVideo(file);
  if (err) throw new Error(err);
  return send("video", file, folder);
};
export const deleteImage = (url) => api("/media", { method: "DELETE", auth: true, body: { url } });
export const deleteVideo = deleteImage;
export const getImageUrl = (url, fallback = "") => url || fallback;
