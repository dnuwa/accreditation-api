const express = require("express");
const router = express.Router();
const { single } = require("../middleware/upload");
const profileController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/auth");

// Unprotected profile creation (no auth middleware)
router.post("/profiles", single, profileController.uploadProfile);

// Admin-only endpoints
router.patch(
  "/profiles/:id/approve",
  protect,
  restrictTo("admin"),
  profileController.approveProfile
);
router.patch(
  "/profiles/:id/reject",
  protect,
  restrictTo("admin"),
  profileController.rejectProfile
);

// Protected routes
router.get("/profiles", protect, profileController.getProfiles);
router.get("/profiles/:id", protect, profileController.getProfileById);
router.patch(
  "/profiles/:id",
  single,
  protect, // Only admin can update profiles
  profileController.updateProfile
);
router.delete(
  "/profiles/:id",
  protect,
  restrictTo("admin"),
  profileController.deleteProfile
);

module.exports = router;
