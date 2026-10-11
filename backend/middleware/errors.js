const multer = require("multer");
const notFound = (req, res) => res.status(404).json({ message: "অনুরোধকৃত API ঠিকানা পাওয়া যায়নি।" });

// Express 5 forwards rejected promises automatically.
const errorHandler = (err, req, res, next) => {
  if (err.message === "UNSUPPORTED_FILE")
    return res.status(400).json({ message: "এই ধরনের ফাইল গ্রহণযোগ্য নয়। JPG, PNG, WEBP, GIF অথবা সমর্থিত অডিও/ভিডিও ফাইল দিন।" });
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "ফাইলের আকার নির্ধারিত সীমার চেয়ে বড়।" });
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE")
      return res.status(400).json({ message: "অনুমোদিত সংখ্যার বেশি ফাইল নির্বাচন করা হয়েছে।" });
    return res.status(400).json({ message: "ফাইল আপলোড করা যায়নি। ফাইলের ধরন ও আকার যাচাই করুন।" });
  }
  if (err.name === "ValidationError") return res.status(400).json({ message: "তথ্য সঠিক নয়। আবার যাচাই করুন।" });
  if (err.code === 11000) return res.status(409).json({ message: "এই তথ্য আগে থেকেই নিবন্ধিত আছে।" });
  console.error("API error:", err);
  res.status(500).json({ message: "সার্ভারে সমস্যা হয়েছে। Backend log এবং environment configuration যাচাই করুন।" });
};

module.exports = { notFound, errorHandler };
