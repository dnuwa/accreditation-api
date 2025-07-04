const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please provide your first name"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: [50, "Middle name cannot exceed 50 characters"],
      sparse: true, // Doesn't index empty fields
    },
    lastName: {
      type: String,
      required: [true, "Please provide your last name"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    nationality: {
      type: String,
      trim: true,
      maxlength: [50, "Nationality cannot exceed 50 characters"],
    },
    email: {
      type: String,
      lowercase: true,
      required: [true, "Please provide your email"],
      unique: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please provide a valid email address"],
      default: function () {
        return `${this.firstName.toLowerCase()}${this.lastName.toLowerCase()}${Date.now()}@rugbyafricacup2025.com`;
      },
    },
    phoneNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[\d\s\+\-\(\)]{6,20}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    emergencyContactName: {
      type: String,
      trim: true,
      maxlength: [100, "Emergency contact name cannot exceed 100 characters"],
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[\d\s\+\-\(\)]{6,20}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
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
      validate: {
        validator: function (v) {
          return /\.(jpg|jpeg|png)$/i.test(v);
        },
        message: (props) => `${props.value} is not a valid image file!`,
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    zones: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common query patterns
profileSchema.index({ status: 1, category: 1 });
profileSchema.index({ lastName: 1, firstName: 1 });
// profileSchema.index({ email: 1 }, { unique: true });

// Virtual for full name
profileSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Update timestamp on save
profileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Query middleware for filtering soft-deleted profiles
profileSchema.pre(/^find/, function (next) {
  // Only apply default filter if no explicit status filter exists
  if (!this.getFilter().status) {
    this.find({ status: { $ne: "rejected" } });
  }
  next();
});

// Static method for bulk status updates
profileSchema.statics.bulkUpdateStatus = async function (ids, status) {
  return this.updateMany({ _id: { $in: ids } }, { $set: { status: status } });
};

// Static method for text search
profileSchema.statics.search = async function (query) {
  return this.find(
    {
      $text: { $search: query },
    },
    {
      score: { $meta: "textScore" },
    }
  ).sort({
    score: { $meta: "textScore" },
  });
};

// Enable text search on relevant fields
profileSchema.index({
  firstName: "text",
  lastName: "text",
  email: "text",
  organization: "text",
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
