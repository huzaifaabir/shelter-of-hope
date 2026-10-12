
const multer = require("multer");

const notFound = (req, res) => {
  res.status(404).json({
    message: "অনুরোধকৃত API ঠিকানা পাওয়া যায়নি।",
  });
};

const errorHandler = (err, req, res, next) => {
  // Unsupported file type
  if (err.message === "UNSUPPORTED_FILE") {
    return res.status(400).json({
      message:
        "এই ধরনের ফাইল গ্রহণযোগ্য নয়। JPG, PNG, WEBP, GIF অথবা সমর্থিত অডিও/ভিডিও ফাইল দিন।",
    });
  }

  // File size limit
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "ফাইলের আকার নির্ধারিত সীমার চেয়ে বড়।",
    });
  }

  // Multer upload errors
  if (err instanceof multer.MulterError) {
    if (
      err.code === "LIMIT_FILE_COUNT" ||
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        message: "অনুমোদিত সংখ্যার বেশি ফাইল নির্বাচন করা হয়েছে।",
      });
    }

    return res.status(400).json({
      message:
        "ফাইল আপলোড করা যায়নি। ফাইলের ধরন ও আকার যাচাই করুন।",
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    console.error("MongoDB Validation Error:", err.message);

    return res.status(400).json({
      message: "তথ্য সঠিক নয়। আবার যাচাই করুন।",
    });
  }

  // Duplicate key errors
  if (err.code === 11000) {
    console.error("MongoDB Duplicate Key Error:", err.message);

    return res.status(409).json({
      message: "এই তথ্য আগে থেকেই নিবন্ধিত আছে।",
    });
  }

  // Detailed server-side error logging
  console.error("\n========== API ERROR ==========");
  console.error("Time:", new Date().toISOString());
  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  console.error("Error code:", err.code);
  console.error("Stack:", err.stack);
  console.error("================================\n");

  // Keep internal error details out of the public response
  return res.status(500).json({
    message:
      "সার্ভারে সমস্যা হয়েছে। Backend log এবং environment configuration যাচাই করুন।",
  });
};

module.exports = {
  notFound,
  errorHandler,
};
