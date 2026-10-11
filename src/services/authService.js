
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth, googleProvider } from "../firebase/auth";
import { api } from "./api";

const MESSAGES = {
  "auth/invalid-credential":
    "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।",

  "auth/invalid-email":
    "সঠিক ইমেইল ঠিকানা দিন।",

  "auth/user-not-found":
    "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।",

  "auth/wrong-password":
    "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।",

  "auth/email-already-in-use":
    "এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট খোলা আছে।",

  "auth/weak-password":
    "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",

  "auth/too-many-requests":
    "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",

  "auth/popup-closed-by-user":
    "গুগল লগইন বাতিল করা হয়েছে।",

  "auth/popup-blocked":
    "ব্রাউজার পপআপ আটকে দিয়েছে। পপআপ অনুমতি দিয়ে আবার চেষ্টা করুন।",

  "auth/unauthorized-domain":
    "এই ওয়েবসাইটের ডোমেইন Firebase Authentication-এ অনুমোদিত নয়। Firebase Console → Authentication → Settings → Authorized domains-এ সাইটের ডোমেইন যোগ করুন।",

  "auth/operation-not-allowed":
    "Firebase Console-এ Google বা Email/Password sign-in provider চালু করা নেই।",

  "auth/invalid-api-key":
    "Firebase API key সঠিক নয়। Frontend Firebase configuration যাচাই করুন।",

  "auth/network-request-failed":
    "ইন্টারনেট বা Firebase সংযোগে সমস্যা হয়েছে। নেটওয়ার্ক ও Firebase সেটিংস যাচাই করুন।",
};

export const authMessage = (error) =>
  MESSAGES[error?.code] ||
  error?.message ||
  "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

export const loginWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

export const registerWithEmail = async (
  name,
  email,
  password
) => {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  await updateProfile(credential.user, {
    displayName: name.trim(),
  });

  return credential;
};

export const logout = () => signOut(auth);

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email.trim());

// Fetch the authenticated user's profile from the backend.
export const fetchMe = () =>
  api("/me", {
    auth: true,
  });

// Update profile information.
// Supports both updateMe("Name") and updateMe({ name, phone, ... }).
export const updateMe = (data) => {
  const input =
    typeof data === "string"
      ? { name: data }
      : data || {};

  const allowedFields = [
    "name",
    "phone",
    "bloodGroup",
    "division",
    "district",
    "upazila",
    "village",
  ];

  const body = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      body[field] =
        typeof input[field] === "string"
          ? input[field].trim()
          : input[field];
    }
  }

  return api("/me", {
    method: "PUT",
    auth: true,
    body,
  });
};
