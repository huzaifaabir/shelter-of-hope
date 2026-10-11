const mongoose = require("mongoose");

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const donorSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true }, // Firebase UID of the owner
    donorId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    image: { type: String, default: "" },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
    availability: { type: String, enum: ["available", "unavailable"], default: "available", index: true },
    lastDonationDate: { type: Date, default: null },
    phone: { type: String, required: true, trim: true },
    phonePublic: { type: Boolean, default: true },
    division: { type: String, required: true, trim: true, index: true },
    district: { type: String, required: true, trim: true, index: true },
    upazila: { type: String, required: true, trim: true, index: true },
    unionOrThana: { type: String, trim: true, default: "" },
    village: { type: String, required: true, trim: true },
    additionalInfo: { type: String, trim: true, maxlength: 1000, default: "" },
    donationCount: { type: Number, min: 0, default: 0 },
    consent: { type: Boolean, default: true },
  },
  { timestamps: true }
);

donorSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Donor", donorSchema);
module.exports.BLOOD_GROUPS = BLOOD_GROUPS;
