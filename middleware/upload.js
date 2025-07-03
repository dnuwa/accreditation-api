const multer = require("multer");
const { storage } = require("../config/cloudinary");
const AppError = require("../utils/errorHandler");

const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024, // 15MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Only image files are allowed!", 400), false);
    }
    cb(null, true);
  },
});

const handleSingleUpload = (fieldName) => {
  return (req, res, next) => {
    multerUpload.single(fieldName)(req, res, (err) => {
      if (err) {
        // Handle specific error types
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
              status: "fail",
              message: "File too large (max 15MB)",
            });
          }
          return res.status(400).json({
            status: "fail",
            message: err.message,
          });
        }

        // For AppError instances
        if (err instanceof AppError) {
          return res.status(err.statusCode).json({
            status: "fail",
            message: err.message,
          });
        }

        // For other errors, send a sanitized message
        return res.status(500).json({
          status: "error",
          message: "File upload failed",
        });
      }
      next();
    });
  };
};

module.exports = {
  single: handleSingleUpload("passportPhoto"),
  multer: multerUpload,
};
