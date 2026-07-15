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
      { new: true },
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
      { new: true },
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
// Get all profiles
exports.getProfiles = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build the base filter
    const filter = {};

    // 1. Handle status filter
    if (req.query.status) {
      const statuses = req.query.status.split(",");
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    // 2. Handle category filter
    if (req.query.category_name) {
      filter.category = req.query.category_name;
    }

    // 3. Handle subcategory filter
    if (req.query.subcategory_name) {
      filter.subcategory = req.query.subcategory_name;
    }

    // 4. Handle date filtering
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};

      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }

      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // 5. Handle search query
    if (req.query.search) {
      const search = req.query.search.trim();
      const searchRegex = new RegExp(search, "i");

      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { organization: searchRegex },
        { phoneNumber: searchRegex },
        { emergencyContactName: searchRegex },

        // Search by full name (e.g. "Hezbon Ndubi")
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: ["$firstName", " ", "$lastName"],
              },
              regex: search,
              options: "i",
            },
          },
        },
      ];
    }

    // 6. Handle sorting
    let sortOption = { createdAt: -1 };

    if (req.query.sortBy) {
      const allowedSortFields = ["category", "subcategory"];
      const requestedField = req.query.sortBy.trim();

      if (allowedSortFields.includes(requestedField)) {
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

        sortOption = {
          [requestedField]: sortOrder,
          createdAt: -1,
        };
      }
    }

    // Execute queries
    const [profiles, total] = await Promise.all([
      Profile.find(filter)
        .select("-__v")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),

      Profile.countDocuments(filter),
    ]);

    // Pagination metadata
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      status: "success",
      results: profiles.length,
      data: {
        profiles,
      },
      pagination: {
        total,
        totalPages,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        limit,
      },
      filters: {
        ...(req.query.category_name && {
          category: req.query.category_name,
        }),
        ...(req.query.subcategory_name && {
          subcategory: req.query.subcategory_name,
        }),
        ...(req.query.startDate && {
          startDate: req.query.startDate,
        }),
        ...(req.query.endDate && {
          endDate: req.query.endDate,
        }),
      },
    });
  } catch (error) {
    console.error("Get profiles error:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve profiles",
      error: error.message,
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
    const profileId = req.params.id;

    // Check if profile exists
    const existingProfile = await Profile.findById(profileId);
    if (!existingProfile) {
      return res.status(404).json({
        status: "fail",
        message: "No profile found with that ID",
      });
    }

    // Prepare update data
    const updateData = {
      firstName: req.body.firstName || existingProfile.firstName,
      middleName: req.body.middleName || existingProfile.middleName,
      lastName: req.body.lastName || existingProfile.lastName,
      nationality: req.body.nationality || existingProfile.nationality,
      phoneNumber: req.body.phoneNumber || existingProfile.phoneNumber,
      emergencyContactName:
        req.body.emergencyContactName || existingProfile.emergencyContactName,
      emergencyContactPhone:
        req.body.emergencyContactPhone || existingProfile.emergencyContactPhone,
      category: req.body.category || existingProfile.category,
      subcategory: req.body.subcategory || existingProfile.subcategory,
      organization: req.body.organization || existingProfile.organization,
      title: req.body.title || existingProfile.title,
      // Handle zones array - use provided array or keep existing
      zones:
        req.body.zones !== undefined ? req.body.zones : existingProfile.zones,
      // Only update passport photo if a new file is uploaded
      passportPhoto: req.file ? req.file.path : existingProfile.passportPhoto,
    };

    // Validate required fields if they're being updated
    if (
      req.body.firstName === "" ||
      req.body.lastName === "" ||
      req.body.category === ""
    ) {
      return res.status(400).json({
        status: "fail",
        message: "First name, last name and category cannot be empty",
      });
    }

    // Validate zones is an array if provided
    if (req.body.zones !== undefined && !Array.isArray(req.body.zones)) {
      return res.status(400).json({
        status: "fail",
        message: "Zones must be an array",
      });
    }

    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      updateData,
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      status: "success",
      data: { profile: updatedProfile },
    });
  } catch (error) {
    console.error("Update profile error:", error);

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
      message: "Failed to update profile",
    });
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
