
const { getAuth } = require("firebase-admin/auth");
const { getAdmin } = require("../config/firebase");
const User = require("../models/User");

const unauthorized = (
  res,
  msg = "আপনার এই কাজটি করার অনুমতি নেই।",
  code = 403
) => res.status(code).json({ message: msg });

// Verify Firebase ID token and load/create the MongoDB user.
async function authenticate(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : null;

  if (!token) return null;

  const firebaseApp = getAdmin();
  const decoded = await getAuth(firebaseApp).verifyIdToken(token);

  let user = await User.findOne({ firebaseUid: decoded.uid });

  if (!user) {
    user = await User.create({
      firebaseUid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      role: "user",
      status: "active",
    });
  }

  return { decoded, user };
}

async function verifyFirebaseToken(req, res, next) {
  try {
    const result = await authenticate(req);

    if (!result) {
      return unauthorized(res, "অনুগ্রহ করে লগইন করুন।", 401);
    }

    if (result.user.status !== "active") {
      return unauthorized(
        res,
        "আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।"
      );
    }

    req.firebase = result.decoded;
    req.user = result.user;

    return next();
  } catch (err) {
    console.error(
      "Token verification failed:",
      err.code || err.message || err
    );

    return unauthorized(
      res,
      "লগইন যাচাই করা যায়নি। আবার লগইন করুন।",
      401
    );
  }
}

async function optionalAuth(req, res, next) {
  try {
    const result = await authenticate(req);

    if (result && result.user.status === "active") {
      req.firebase = result.decoded;
      req.user = result.user;
    }
  } catch (err) {
    console.error("Optional authentication failed:", err.message);
  }

  return next();
}

const requireUser = [verifyFirebaseToken];

const requireRole = (roles) => [
  verifyFirebaseToken,
  (req, res, next) => {
    if (roles.includes(req.user.role)) return next();
    return unauthorized(res);
  },
];

const requireEditor = requireRole(["editor", "administrator"]);
const requireAdministrator = requireRole(["administrator"]);

module.exports = {
  verifyFirebaseToken,
  optionalAuth,
  requireUser,
  requireEditor,
  requireAdministrator,
};
