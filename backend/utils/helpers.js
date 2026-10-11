const crypto = require("crypto");

const escapeRegex = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "+" arrives as a space in unencoded query strings (e.g. ?bloodGroup=O+)
const normalizeBloodGroup = (v = "") => String(v).replace(/\s/g, "+").toUpperCase();

const newDonorId = () => "SOH-" + crypto.randomBytes(4).toString("hex").toUpperCase();

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const bnToEn = (s = "") => String(s).replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));
const cleanPhone = (v = "") => bnToEn(v).replace(/[\s-]/g, "");
const isValidPhone = (v) => BD_PHONE.test(cleanPhone(v));

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj && obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

const str = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Allow only site-relative or http(s) links
const safeLink = (v) => {
  const s = str(v, 300);
  return /^(\/(?!\/)|https?:\/\/)/.test(s) ? s : "";
};

module.exports = { escapeRegex, normalizeBloodGroup, newDonorId, isValidPhone, cleanPhone, pick, str, safeLink };
