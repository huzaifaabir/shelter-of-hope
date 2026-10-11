const router = require("express").Router();
const { verifyFirebaseToken } = require("../middleware/auth");
const { str } = require("../utils/helpers");

// Return the authenticated user's profile
router.get("/", verifyFirebaseToken, (req, res) => {
  const {
    _id,
    name,
    email,
    role,
    status,
    firebaseUid,
    phone,
    bloodGroup,
    division,
    district,
    upazila,
    village,
  } = req.user;

  res.json({
    id: _id,
    firebaseUid,
    name,
    email,
    role,
    status,
    phone: phone || "",
    bloodGroup: bloodGroup || "",
    division: division || "",
    district: district || "",
    upazila: upazila || "",
    village: village || "",
  });
});

// Update the authenticated user's own profile
router.put("/", verifyFirebaseToken, async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "bloodGroup",
      "division",
      "district",
      "upazila",
      "village",
    ];

    const limits = {
      name: 120,
      phone: 20,
      bloodGroup: 10,
      division: 100,
      district: 100,
      upazila: 100,
      village: 150,
    };

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        updates[field] = str(req.body[field], limits[field]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "name") && !updates.name) {
      return res.status(400).json({
        message: "অনুগ্রহ করে আপনার নাম লিখুন।",
      });
    }

    const validBloodGroups = [
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
    ];

    if (
      updates.bloodGroup &&
      !validBloodGroups.includes(updates.bloodGroup)
    ) {
      return res.status(400).json({
        message: "সঠিক রক্তের গ্রুপ নির্বাচন করুন।",
      });
    }

    Object.assign(req.user, updates);
    await req.user.save();

    const {
      _id,
      name,
      email,
      role,
      status,
      firebaseUid,
      phone,
      bloodGroup,
      division,
      district,
      upazila,
      village,
    } = req.user;

    return res.json({
      message: "প্রোফাইল সফলভাবে আপডেট হয়েছে।",
      user: {
        id: _id,
        firebaseUid,
        name,
        email,
        role,
        status,
        phone: phone || "",
        bloodGroup: bloodGroup || "",
        division: division || "",
        district: district || "",
        upazila: upazila || "",
        village: village || "",
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;