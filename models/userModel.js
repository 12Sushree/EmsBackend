const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    empId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["Employee", "Manager"],
      default: "Employee",
    },
    designation: {
      type: String,
      trim: true,
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    employmentStatus: {
      type: String,
      enum: ["Active", "On Leave", "Resigned", "Terminated"],
      default: "Active",
    },
    dateOfJoining: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Number,
    },
    resetToken: String,
    resetTokenExpire: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: String,
    emailVerifyExpire: Date,
  },
  { timestamps: true },
);

userSchema.index({ userName: 1, empId: 1 });

userSchema.methods.passwordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.resetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.resetTokenExpire = Date.now() + 10 * 60 * 1000;

  return token;
};

userSchema.methods.verifyEmailToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.emailVerifyToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000;

  return token;
};

module.exports = mongoose.model("User", userSchema);
