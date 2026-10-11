const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MongoDB Connection Failed ❌: MONGODB_URI is missing. Configure backend/.env before starting the API.");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log("MongoDB Connected Successfully ✅");
    console.log("Connected database:", mongoose.connection.name);
console.log("Donor collection:", mongoose.connection.collection("donors").collectionName);
console.log("Donor document count:", await mongoose.connection.collection("donors").countDocuments());
console.log(
  "Missing-child document count:",
  await mongoose.connection.collection("missingchildren").countDocuments()
);
  } catch (error) {
    console.error("MongoDB Connection Failed ❌");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
