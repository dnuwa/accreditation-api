const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication middleware
const protect = async (req, res, callback) => {
  try {
    // 1. Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access",
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists",
      });
    }

    // 4. Attach user to request
    req.user = currentUser;

    // Execute the callback function
    return callback();
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token. Please log in again",
    });
  }
};

// Role restriction middleware
const restrictTo = (...roles) => {
  return (req, res, callback) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }
    return callback();
  };
};

module.exports = { protect, restrictTo };
