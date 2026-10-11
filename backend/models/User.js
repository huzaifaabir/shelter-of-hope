
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },

    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },

    division: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    district: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    upazila: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    village: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "editor", "administrator"],
      default: "user",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
