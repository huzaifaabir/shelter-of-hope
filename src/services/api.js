
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

// Firebase authentication token
async function tokenHeader(required) {
  const user = auth.currentUser;

  if (!user) {
    if (required) {
      throw new ApiError(
        "এই কাজটি করার জন্য লগইন করুন।",
        401
      );
    }

    return {};
  }

  try {
    const token = await user.getIdToken();

    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error("Firebase token error:", error);

    if (required) {
      throw new ApiError(
        "আপনার লগইন যাচাই করা যায়নি। আবার লগইন করুন।",
        401
      );
    }

    return {};
  }
}

// API request: JSON এবং FormData সমর্থিত
export async function api(
  path,
  {
    method = "GET",
    body,
    auth: useAuth = false,
  } = {}
) {
  if (!path || typeof path !== "string") {
    throw new ApiError(
      "API path সঠিক নয়।",
      400
    );
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const headers = {
    ...(await tokenHeader(useAuth)),
  };

  const isForm =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  if (body !== undefined && body !== null && !isForm) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${BASE}/api${normalizedPath}`;

  let res;

  try {
    res = await fetch(url, {
      method,
      headers,
      body:
        body === undefined || body === null
          ? undefined
          : isForm
            ? body
            : JSON.stringify(body),
    });
  } catch (error) {
    console.error("API connection error:", {
      url,
      error,
    });

    throw new ApiError(
      "সার্ভারের সঙ্গে সংযোগ স্থাপন করা যাচ্ছে না। Backend চালু আছে কি না এবং VITE_API_URL যাচাই করুন।",
      0
    );
  }

  const contentType =
    res.headers.get("content-type") || "";

  let data = {};

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");

    if (text) {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const message =
      data.message ||
      (res.status === 401
        ? "আপনাকে আবার লগইন করতে হবে।"
        : res.status === 403
          ? "এই কাজটি করার অনুমতি আপনার নেই।"
          : res.status === 404
            ? "অনুরোধকৃত API ঠিকানা পাওয়া যায়নি। Backend route যাচাই করুন।"
            : `সার্ভারে সমস্যা হয়েছে (HTTP ${res.status})।`);

    console.error("API request failed:", {
      url,
      status: res.status,
      data,
    });

    throw new ApiError(
      message,
      res.status,
      data.errors
    );
  }

  return data;
}

// URL query parameters
export const qs = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (
      value !== "" &&
      value !== undefined &&
      value !== null
    ) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
};
