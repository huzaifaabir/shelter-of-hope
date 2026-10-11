
import { auth } from "../firebase/auth";

const BASE = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors || {};
  }
}

async function tokenHeader(required) {
  const user = auth.currentUser;

  if (!user) {
    if (required) {
      throw new ApiError("এই কাজটি করার জন্য লগইন করুন।", 401);
    }
    return {};
  }

  try {
    return {
      Authorization: `Bearer ${await user.getIdToken()}`,
    };
  } catch {
    if (required) {
      throw new ApiError(
        "আপনার লগইন যাচাই করা যায়নি। আবার লগইন করুন।",
        401
      );
    }

    return {};
  }
}

// JSON অথবা FormData পাঠানোর জন্য
export async function api(
  path,
  { method = "GET", body, auth: useAuth = false } = {}
) {
  const headers = {
    ...(await tokenHeader(useAuth)),
  };

  const isForm =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body && !isForm) {
    headers["Content-Type"] = "application/json";
  }

  let res;

  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body
        ? isForm
          ? body
          : JSON.stringify(body)
        : undefined,
    });
  } catch (error) {
    console.error("API connection error:", error);

    throw new ApiError(
      "সার্ভারের সঙ্গে সংযোগ স্থাপন করা যাচ্ছে না। Backend চালু আছে কি না এবং VITE_API_URL যাচাই করুন।",
      0
    );
  }

  const contentType = res.headers.get("content-type") || "";
  let data = {};

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  }

  if (!res.ok) {
    const message =
      data.message ||
      (res.status === 404
        ? "API ঠিকানা পাওয়া যায়নি। VITE_API_URL এবং backend route যাচাই করুন।"
        : `সার্ভারে সমস্যা হয়েছে (HTTP ${res.status})।`);

    throw new ApiError(message, res.status, data.errors);
  }

  return data;
}

// params না দিলেও কাজ করবে
export const qs = (params = {}) => {
  const p = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      p.set(key, String(value));
    }
  });

  const query = p.toString();

  return query ? `?${query}` : "";
};
