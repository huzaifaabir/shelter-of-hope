
const router = require("express").Router();
const crypto = require("crypto");
const { getAuth } = require("firebase-admin/auth");

const User = require("../models/User");
const Donor = require("../models/Donor");
const Report = require("../models/Report");
const MissingChild = require("../models/MissingChild");

const { getAdmin } = require("../config/firebase");
const {
  requireEditor,
  requireAdministrator,
} = require("../middleware/auth");
const { str } = require("../utils/helpers");

const PRIV_ROLES = ["administrator", "editor"];
const VALID_STATUSES = ["active", "disabled"];

// -----------------------------------------------------------------------------
// Shared error logger
// -----------------------------------------------------------------------------

function logError(label, error) {
  console.error(`\n========== ${label} ==========`);
  console.error("Error name:", error?.name);
  console.error("Error code:", error?.code);
  console.error("Error message:", error?.message);
  console.error("Stack:", error?.stack);
  console.error("====================================\n");
}

// -----------------------------------------------------------------------------
// Dashboard statistics
// -----------------------------------------------------------------------------

router.get("/stats", requireEditor, async (req, res, next) => {
  try {
    const [
      totalDonors,
      available,
      administrators,
      editors,
      totalUsers,
      recent,
      newEmergency,
      newComplaints,
      missing,
      totalMissing,
      totalEmergency,
      totalComplaints,
    ] = await Promise.all([
      Donor.countDocuments(),
      Donor.countDocuments({ availability: "available" }),
      User.countDocuments({
        role: "administrator",
        status: "active",
      }),
      User.countDocuments({
        role: "editor",
        status: "active",
      }),
      User.countDocuments(),
      Donor.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "donorId name bloodGroup district upazila createdAt image"
        ),
      Report.countDocuments({
        kind: "emergency",
        status: "new",
      }),
      Report.countDocuments({
        kind: "complaint",
        status: "new",
      }),
      MissingChild.countDocuments({
        status: { $ne: "found" },
      }),
      MissingChild.countDocuments(),
      Report.countDocuments({ kind: "emergency" }),
      Report.countDocuments({ kind: "complaint" }),
    ]);

    return res.json({
      totalDonors,
      available,
      unavailable: totalDonors - available,
      administrators,
      editors,
      totalUsers,
      recent,
      newEmergency,
      newComplaints,
      missing,
      totalMissing,
      totalEmergency,
      totalComplaints,
    });
  } catch (error) {
    logError("ADMIN STATS ERROR", error);
    return next(error);
  }
});

// -----------------------------------------------------------------------------
// List administrator and editor accounts
// -----------------------------------------------------------------------------

router.get("/users", requireAdministrator, async (req, res, next) => {
  try {
    const users = await User.find({
      role: { $in: PRIV_ROLES },
    }).sort({ createdAt: 1 });

    return res.json({ items: users });
  } catch (error) {
    logError("ADMIN USERS GET ERROR", error);
    return next(error);
  }
});

// -----------------------------------------------------------------------------
// Create Firebase user and save application role in MongoDB
// -----------------------------------------------------------------------------

router.post("/users", requireAdministrator, async (req, res) => {
  let email = "";

  try {
    email = str(req.body?.email, 160).toLowerCase().trim();
    const name = str(req.body?.name, 120).trim();
    const role = req.body?.role;
    const status =
      req.body?.status === "disabled" ? "disabled" : "active";

    // Validate name
    if (!name) {
      return res.status(400).json({
        message: "অনুগ্রহ করে নাম লিখুন।",
      });
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "সঠিক ইমেইল ঠিকানা দিন।",
      });
    }

    // Validate role
    if (!PRIV_ROLES.includes(role)) {
      return res.status(400).json({
        message: "ভূমিকা সঠিক নয়।",
      });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "ব্যবহারকারীর অবস্থা সঠিক নয়।",
      });
    }

    console.log("[Admin users POST] Initializing Firebase Admin.");

    const adminApp = getAdmin();

    // Firebase Admin modular API
    const fb = getAuth(adminApp);

    let fbUser;
    let resetLink = null;
    let resetLinkError = false;

    // Find existing Firebase account
    try {
      fbUser = await fb.getUserByEmail(email);

      console.log(
        "[Admin users POST] Existing Firebase account found."
      );
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }

      console.log(
        "[Admin users POST] Creating Firebase account."
      );

      fbUser = await fb.createUser({
        email,
        displayName: name,
        password: crypto.randomBytes(24).toString("base64url"),
      });

      console.log(
        "[Admin users POST] Firebase account created."
      );

      // Generate a password reset link
      try {
        resetLink = await fb.generatePasswordResetLink(email);

        console.log(
          "[Admin users POST] Password reset link generated."
        );
      } catch (error) {
        resetLinkError = true;

        logError(
          "PASSWORD RESET LINK GENERATION ERROR",
          error
        );
      }
    }

    // Update display name if necessary
    if (fbUser.displayName !== name) {
      fbUser = await fb.updateUser(fbUser.uid, {
        displayName: name,
      });
    }

    console.log("[Admin users POST] Saving MongoDB user.");

    // Create or update the MongoDB user
    const user = await User.findOneAndUpdate(
      { firebaseUid: fbUser.uid },
      {
        $set: {
          firebaseUid: fbUser.uid,
          email,
          name,
          role,
          status,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      "[Admin users POST] MongoDB user saved successfully."
    );

    return res.status(201).json({
      user,
      resetLink,
      resetLinkError,
      message: resetLinkError
        ? "ব্যবহারকারী সংরক্ষিত হয়েছে, তবে পাসওয়ার্ড রিসেট লিংক তৈরি হয়নি।"
        : "ব্যবহারকারী সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (error) {
    logError("ADMIN USERS POST ERROR", error);

    if (
      error.code === "auth/email-already-exists" ||
      error.code === 11000
    ) {
      return res.status(409).json({
        message:
          "এই ইমেইল বা ব্যবহারকারীর তথ্য আগে থেকেই নিবন্ধিত আছে।",
      });
    }

    if (
      error.code === "auth/invalid-email" ||
      error.code === "auth/invalid-argument"
    ) {
      return res.status(400).json({
        message: "ইমেইল অথবা ব্যবহারকারীর তথ্য সঠিক নয়।",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message:
          "ব্যবহারকারীর তথ্য যাচাই করা যায়নি। তথ্যগুলো পরীক্ষা করুন।",
      });
    }

    return res.status(500).json({
      message:
        "ব্যবহারকারী তৈরি করা যায়নি। Backend Terminal-এর error দেখুন।",
    });
  }
});

// -----------------------------------------------------------------------------
// Check whether this is the last active administrator
// -----------------------------------------------------------------------------

async function isLastActiveAdmin(user) {
  if (
    user.role !== "administrator" ||
    user.status !== "active"
  ) {
    return false;
  }

  const activeAdminCount = await User.countDocuments({
    role: "administrator",
    status: "active",
  });

  return activeAdminCount <= 1;
}

// -----------------------------------------------------------------------------
// Update a staff account
// -----------------------------------------------------------------------------

router.put(
  "/users/:id",
  requireAdministrator,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "ব্যবহারকারী পাওয়া যায়নি।",
        });
      }

      const role =
        req.body.role !== undefined
          ? req.body.role
          : user.role;

      const status =
        req.body.status !== undefined
          ? req.body.status
          : user.status;

      if (
        !PRIV_ROLES.includes(role) ||
        !VALID_STATUSES.includes(status)
      ) {
        return res.status(400).json({
          message: "তথ্য সঠিক নয়।",
        });
      }

      const isSelf =
        user.firebaseUid === req.user.firebaseUid;

      if (
        isSelf &&
        (role !== user.role || status !== "active")
      ) {
        return res.status(400).json({
          message:
            "আপনি নিজের ভূমিকা বা অবস্থা পরিবর্তন করতে পারবেন না।",
        });
      }

      if (
        (role !== "administrator" || status !== "active") &&
        (await isLastActiveAdmin(user))
      ) {
        return res.status(400).json({
          message:
            "শেষ সক্রিয় Administrator-কে পরিবর্তন করা যাবে না।",
        });
      }

      if (req.body.name !== undefined) {
        user.name = str(req.body.name, 120) || user.name;
      }

      user.role = role;
      user.status = status;

      await user.save();

      return res.json(user);
    } catch (error) {
      logError("ADMIN USERS PUT ERROR", error);
      return next(error);
    }
  }
);

// -----------------------------------------------------------------------------
// Remove staff access while keeping the Firebase account
// -----------------------------------------------------------------------------

router.delete(
  "/users/:id",
  requireAdministrator,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "ব্যবহারকারী পাওয়া যায়নি।",
        });
      }

      if (user.firebaseUid === req.user.firebaseUid) {
        return res.status(400).json({
          message: "আপনি নিজের অ্যাক্সেস সরাতে পারবেন না।",
        });
      }

      if (await isLastActiveAdmin(user)) {
        return res.status(400).json({
          message:
            "শেষ সক্রিয় Administrator-কে সরানো যাবে না।",
        });
      }

      user.role = "user";
      await user.save();

      return res.json({
        message: "সফলভাবে অ্যাক্সেস সরিয়ে দেওয়া হয়েছে।",
      });
    } catch (error) {
      logError("ADMIN USERS DELETE ERROR", error);
      return next(error);
    }
  }
);

module.exports = router;
