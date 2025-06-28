const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please provide your first name"],
  },
  middleName: {
    type: String,
  },
  lastName: {
    type: String,
    required: [true, "Please provide your last name"],
  },
  nationality: {
    type: String,
  },
  email: {
    type: String,
    lowercase: true,
    required: [true, "Please provide your email"],
    unique: true,
    default: function() {
      // Generate a default email if none provided
      return `${this.firstName.toLowerCase()}${this.lastName.toLowerCase()}${Date.now()}@rugbyafricacup2025.com`;
    }
  },
  phoneNumber: {
    type: String,
  },
  emergencyContactName: {
    type: String,
  },
  emergencyContactPhone: {
    type: String,
  },
  category: {
    type: String,
    required: [true, "Please provide your category"],
  },
  subcategory: {
    type: String,
  },
  organization: {
    type: String,
  },
  title: {
    type: String,
  },
  passportPhoto: {
    type: String,
    required: [true, "Please provide your passport photo"],
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  zones: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
