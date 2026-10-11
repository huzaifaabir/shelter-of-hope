const router = require("express").Router();
const User = require("../models/User");
const Donor = require("../models/Donor");
const Report = require("../models/Report");
const MissingChild = require("../models/MissingChild");
const { getAdmin } = require("../config/firebase");
const { requireEditor, requireAdministrator } = require("../middleware/auth");
const { str } = require("../utils/helpers");

const PRIV_ROLES = ["administrator", "editor"];

router.get("/stats", requireEditor, async (req, res) => {
  const [totalDonors, available, administrators, editors, totalUsers, recent, newEmergency, newComplaints, missing, totalMissing, totalEmergency, totalComplaints] =
    await Promise.all([
      Donor.countDocuments(),
      Donor.countDocuments({ availability: "available" }),
      User.countDocuments({ role: "administrator", status: "active" }),
      User.countDocuments({ role: "editor", status: "active" }),
      User.countDocuments(),
      Donor.find().sort({ createdAt: -1 }).limit(5).select("donorId name bloodGroup district upazila createdAt image"),
      Report.countDocuments({ kind: "emergency", status: "new" }),
      Report.countDocuments({ kind: "complaint", status: "new" }),
      MissingChild.countDocuments({ status: { $ne: "found" } }),
      MissingChild.countDocuments(),
      Report.countDocuments({ kind: "emergency" }),
      Report.countDocuments({ kind: "complaint" }),
    ]);
  res.json({
    totalDonors, available, unavailable: totalDonors - available, administrators, editors, totalUsers,
    recent, newEmergency, newComplaints, missing, totalMissing, totalEmergency, totalComplaints,
  });
});

// ---- User management (administrator only) --------------------------------
router.get("/users", requireAdministrator, async (req, res) => {
  const users = await User.find({ role: { $in: PRIV_ROLES } }).sort({ createdAt: 1 });
  res.json({ items: users });
});

// Create/identify Firebase user, then map role in MongoDB
router.post("/users", requireAdministrator, async (req, res) => {
  const email = str(req.body.email, 160).toLowerCase();
  const name = str(req.body.name, 120);
  const role = req.body.role;
  const status = req.body.status === "disabled" ? "disabled" : "active";
  if (!name) return res.status(400).json({ message: "অনুগ্রহ করে নাম লিখুন।" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "সঠিক ইমেইল ঠিকানা দিন।" });
  if (!PRIV_ROLES.includes(role)) return res.status(400).json({ message: "ভূমিকা সঠিক নয়।" });

  const fb = getAdmin().auth();
  let fbUser;
  let resetLink = null;
  try {
    fbUser = await fb.getUserByEmail(email);
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
    // random one-time password; the person sets their own via the reset link
    fbUser = await fb.createUser({ email, displayName: name, password: require("crypto").randomBytes(18).toString("base64url") });
    resetLink = await fb.generatePasswordResetLink(email);
  }
  const user = await User.findOneAndUpdate(
    { firebaseUid: fbUser.uid },
    { firebaseUid: fbUser.uid, email, name, role, status },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ user, resetLink });
});

async function isLastActiveAdmin(user) {
  if (user.role !== "administrator" || user.status !== "active") return false;
  return (await User.countDocuments({ role: "administrator", status: "active" })) <= 1;
}

router.put("/users/:id", requireAdministrator, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "ব্যবহারকারী পাওয়া যায়নি।" });
  const role = req.body.role !== undefined ? req.body.role : user.role;
  const status = req.body.status !== undefined ? req.body.status : user.status;
  if (!PRIV_ROLES.includes(role) || !["active", "disabled"].includes(status))
    return res.status(400).json({ message: "তথ্য সঠিক নয়।" });
  const isSelf = user.firebaseUid === req.user.firebaseUid;
  if (isSelf && (role !== user.role || status !== "active"))
    return res.status(400).json({ message: "আপনি নিজের ভূমিকা বা অবস্থা পরিবর্তন করতে পারবেন না।" });
  if ((role !== "administrator" || status !== "active") && (await isLastActiveAdmin(user)))
    return res.status(400).json({ message: "শেষ সক্রিয় Administrator-কে পরিবর্তন করা যাবে না।" });
  if (req.body.name !== undefined) user.name = str(req.body.name, 120) || user.name;
  user.role = role;
  user.status = status;
  await user.save();
  res.json(user);
});

// Removes admin access (the Firebase account itself is kept; the person becomes a normal user)
router.delete("/users/:id", requireAdministrator, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "ব্যবহারকারী পাওয়া যায়নি।" });
  if (user.firebaseUid === req.user.firebaseUid)
    return res.status(400).json({ message: "আপনি নিজের অ্যাক্সেস সরাতে পারবেন না।" });
  if (await isLastActiveAdmin(user))
    return res.status(400).json({ message: "শেষ সক্রিয় Administrator-কে সরানো যাবে না।" });
  user.role = "user";
  await user.save();
  res.json({ message: "সফলভাবে অ্যাক্সেস সরিয়ে দেওয়া হয়েছে।" });
});

module.exports = router;
