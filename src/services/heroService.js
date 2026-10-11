import { api } from "./api";

export const getHero = () => api("/hero");
export const saveHero = (body) => api("/hero", { method: "PUT", auth: true, body });
export const getContent = (key) => api(`/content/${key}`);
export const saveContent = (key, body) => api(`/content/${key}`, { method: "PUT", auth: true, body });
