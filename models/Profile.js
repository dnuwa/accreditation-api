const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please provide your first name"],
  },
  lastName: {
    type: String,
    required: [true, "Please provide your last name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
  },
  bio: {
    type: String,
    maxlength: [500, "Bio cannot be more than 500 characters"],
  },
  passportPhoto: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile; // This was the missing line