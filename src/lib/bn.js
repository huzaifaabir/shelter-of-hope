const digits = "০১২৩৪৫৬৭৮৯";
export const toBn = (v) => String(v ?? "").replace(/\d/g, (d) => digits[d]);
export const toEn = (v) => String(v ?? "").replace(/[০-৯]/g, (d) => digits.indexOf(d));

export const formatDate = (d) =>
  d ? new Intl.DateTimeFormat("bn-BD", { year: "numeric", month: "long", day: "numeric" }).format(new Date(d)) : "—";

export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
export const isValidPhone = (v) => BD_PHONE.test(toEn(v).replace(/[\s-]/g, ""));
