
import { api, qs } from "./api";

// Admin dashboard statistics
export const getStats = () =>
  api("/admin/stats", { auth: true });

// User management
export const listUsers = () =>
  api("/admin/users", { auth: true });

export const addUser = (body) =>
  api("/admin/users", {
    method: "POST",
    auth: true,
    body,
  });

export const updateUser = (id, body) =>
  api(`/admin/users/${id}`, {
    method: "PUT",
    auth: true,
    body,
  });

export const removeUser = (id) =>
  api(`/admin/users/${id}`, {
    method: "DELETE",
    auth: true,
  });

// Missing children
// Backend API path বর্তমানে /api/missing-children
export const listMissingPublic = (params = {}) =>
  api(`/missing-children${qs(params)}`);

export const listMyMissing = () =>
  api("/missing-children/mine", {
    auth: true,
  });

export const saveMyMissing = (id, body) =>
  id
    ? api(`/missing-children/${id}`, {
        method: "PUT",
        auth: true,
        body,
      })
    : api("/missing-children", {
        method: "POST",
        auth: true,
        body,
      });

export const getMissingPublic = (id) =>
  api(`/missing-children/${id}`);

export const listMissingAdmin = () =>
  api("/missing-children/admin/all", {
    auth: true,
  });

export const saveMissing = (id, body) =>
  id
    ? api(`/missing-children/${id}`, {
        method: "PUT",
        auth: true,
        body,
      })
    : api("/missing-children", {
        method: "POST",
        auth: true,
        body,
      });

export const deleteMissing = (id) =>
  api(`/missing-children/${id}`, {
    method: "DELETE",
    auth: true,
  });

// Emergency / complaints / contact
export const submitReport = (kind, formData) =>
  api(`/reports/${kind}`, {
    method: "POST",
    auth: false,
    body: formData,
  });

export const listReports = (kind, status = "") =>
  api(`/reports/${kind}${qs({ status })}`, {
    auth: true,
  });

export const updateReport = (kind, id, body) =>
  api(`/reports/${kind}/${id}`, {
    method: "PUT",
    auth: true,
    body,
  });

export const deleteReport = (kind, id) =>
  api(`/reports/${kind}/${id}`, {
    method: "DELETE",
    auth: true,
  });

export const getEvidence = (kind, id, i) =>
  api(`/reports/${kind}/${id}/evidence/${i}`, {
    auth: true,
  });
