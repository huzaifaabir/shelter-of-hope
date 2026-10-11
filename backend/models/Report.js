const mongoose = require("mongoose");

// Shared model for emergency requests, complaints and contact messages.
const evidenceSchema = new mongoose.Schema(
  { path: String, type: { type: String, enum: ["image", "audio", "video"] }, name: String },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["emergency", "complaint", "contact"], required: true, index: true },
    name: { type: String, trim: true, maxlength: 120, default: "" },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    email: { type: String, trim: true, maxlength: 160, default: "" },
    subject: { type: String, trim: true, maxlength: 200, default: "" },
    details: { type: String, trim: true, maxlength: 4000, required: true },
    location: { type: String, trim: true, maxlength: 300, default: "" },
    evidence: { type: [evidenceSchema], default: [] },
    status: { type: String, enum: ["new", "reviewing", "resolved", "closed"], default: "new", index: true },
    adminNote: { type: String, trim: true, maxlength: 2000, default: "" },
    submittedBy: { type: String, default: "" }, // Firebase UID if the submitter was logged in
  },
  { timestamps: true }
);

schema.index({ kind: 1, createdAt: -1 });

module.exports = mongoose.model("Report", schema);
