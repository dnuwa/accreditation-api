const Profile = require("../models/Profile");
const { cloudinary } = require("../config/cloudinary");

exports.approveProfile = async (req, res) => {
  try {
    const { zones } = req.body;

    if (!zones || !Array.isArray(zones)) {
      return res.status(400).json({
        status: "fail",
        message: "Zones array is required for approval",
      });
    }

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        zones: zones,
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        status: "fail",
        message: "No profile found with that ID",
      });
    }

    return res.status(200).json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    console.error("Approve profile error:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while approving profile",
    });
  }
};

exports.rejectProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        status: "fail",
        message: "No profile found with that ID",
      });
    }

    return res.status(200).json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    // Handle errors
  }
};

// Create or update profile
exports.uploadProfile = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.firstName || !req.body.lastName || !req.body.category) {
      return res.status(400).json({
        status: "fail",
        message: "First name, last name and category are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "Passport photo is required",
      });
    }

    // Generate email if not provided
    const email =
      req.body.email ||
      `${req.body.firstName.toLowerCase()}${req.body.lastName.toLowerCase()}${Date.now()}@rugbyafricacup2025.com`;

    const profileData = {
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName,
      nationality: req.body.nationality,
      email: email, // Use provided email or generated one
      phoneNumber: req.body.phoneNumber,
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactPhone: req.body.emergencyContactPhone,
      category: req.body.category,
      subcategory: req.body.subcategory,
      organization: req.body.organization,
      title: req.body.title,
      passportPhoto: req.file.path,
    };

    const newProfile = await Profile.create(profileData);

    return res.status(201).json({
      status: "success",
      data: { profile: newProfile },
    });
  } catch (error) {
    console.error("Profile creation error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        status: "fail",
        message: messages.join(", "),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "Email already exists. Please use a different email.",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while creating profile",
    });
  }
};

// Get all profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().select("-__v");

    return res.status(200).json({
      status: "success",
      results: profiles.length,
      data: { profiles },
    });
  } catch (error) {
    console.error("Get profiles error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve profiles",
    });
  }
};

// Get single profile by ID
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).select("-__v");

    if (!profile) {
      return res.status(404).json({
        status: "fail",
        message: "No profile found with that ID",
      });
    }

    return res.status(200).json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve profile",
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    // Generate email if not provided
    const email =
      req.body.email ||
      `${req.body.firstName.toLowerCase()}${req.body.lastName.toLowerCase()}${Date.now()}@rugbyafricacup2025.com`;

    const updateData = {
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName,
      nationality: req.body.nationality,
      email: email, // Use provided email or generated one
      phoneNumber: req.body.phoneNumber,
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactPhone: req.body.emergencyContactPhone,
      category: req.body.category,
      subcategory: req.body.subcategory,
      organization: req.body.organization,
      title: req.body.title,
    };

    // ... rest of the updateProfile function remains the same ...
  } catch (error) {
    // ... error handling remains the same ...
  }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);

    if (!profile) {
      return res.status(404).json({
        status: "fail",
        message: "No profile found with that ID",
      });
    }

    // Delete photo from Cloudinary
    if (profile.passportPhoto) {
      const publicId = profile.passportPhoto.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`passport-photos/${publicId}`);
    }

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Delete profile error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete profile",
    });
  }
};
