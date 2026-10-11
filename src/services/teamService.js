import { api } from "./api";

// Public: About page-এ প্রকাশিত সদস্য
export const getPublicTeamMembers = () =>
  api("/team-members");

// Admin: সব সদস্য
export const getAdminTeamMembers = () =>
  api("/team-members/admin/all", { auth: true });

// নতুন সদস্য যোগ
export const createTeamMember = (body) =>
  api("/team-members", {
    method: "POST",
    auth: true,
    body,
  });

// সদস্যের তথ্য আপডেট
export const updateTeamMember = (id, body) =>
  api(`/team-members/${id}`, {
    method: "PUT",
    auth: true,
    body,
  });

// সদস্য মুছে ফেলা
export const deleteTeamMember = (id) =>
  api(`/team-members/${id}`, {
    method: "DELETE",
    auth: true,
  });