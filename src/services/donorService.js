import { api, qs } from "./api";

export const listDonors = (params) => api(`/donors${qs(params)}`);
export const getDonor = (id) => api(`/donors/${encodeURIComponent(id)}`);
export const getMyDonor = () => api("/donors/mine", { auth: true });
export const createDonor = (body) => api("/donors", { method: "POST", auth: true, body });
export const updateDonor = (id, body) => api(`/donors/${id}`, { method: "PUT", auth: true, body });
export const deleteDonor = (id) => api(`/donors/${id}`, { method: "DELETE", auth: true });
export const adminCreateDonor = (body) => api("/donors/admin/create", { method: "POST", auth: true, body });
