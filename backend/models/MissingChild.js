const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    age: { type: Number, min: 0, max: 18, default: null },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    image: { type: String, default: "" },
    missingDate: { type: Date, default: null },
    missingPlace: { type: String, trim: true, maxlength: 300, default: "" },
    details: { type: String, trim: true, maxlength: 3000, default: "" },
    contactInfo: { type: String, trim: true, maxlength: 300, default: "" }, // public contact (e.g. police / helpline)
    status: { type: String, enum: ["missing", "investigating", "found"], default: "missing", index: true },
    published: { type: Boolean, default: false, index: true },
    internalNotes: { type: String, default: "", maxlength: 3000 }, // never returned publicly
    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MissingChild", schema);
