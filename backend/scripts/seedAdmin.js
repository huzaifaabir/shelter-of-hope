
require("dotenv").config();

const mongoose = require("mongoose");
const { getAuth } = require("firebase-admin/auth");
const { getAdmin } = require("../config/firebase");
const User = require("../models/User");

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error("ADMIN_EMAIL is missing from backend/.env");
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected.");

  const firebaseApp = getAdmin();
  const auth = getAuth(firebaseApp);

  // The Firebase user must already exist.
  const firebaseUser = await auth.getUserByEmail(email);

  const user = await User.findOneAndUpdate(
    { firebaseUid: firebaseUser.uid },
    {
      $set: {
        firebaseUid: firebaseUser.uid,
        email,
        name: firebaseUser.displayName || "Administrator",
        role: "administrator",
        status: "active",
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  console.log("Administrator role assigned successfully.");
  console.log("Account:", user.email);
  console.log("Role:", user.role);
}

seedAdmin()
  .catch((err) => {
    console.error("Admin setup failed:", err.code || err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  });
