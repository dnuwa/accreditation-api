const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.validateSignup, authController.signup);
router.post("/signin", authController.validateSignup, authController.signin);

module.exports = router;
