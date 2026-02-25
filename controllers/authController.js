const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/userModel");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("./tokenControllers");
const { generateEmpId } = require("../utils/generateEmpId");
const { sendMail } = require("../utils/sendMail");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
  try {
    const empId = await generateEmpId();
    let { userName, email, password, role } = req.body;

    if (!userName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    email = email.trim().toLowerCase();
    userName = userName.trim();

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format!",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Passwords must be at least 6 characters!",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      empId,
      userName,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
    });

    const verifyToken = user.verifyEmailToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;

    await sendMail({
      to: user.email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome to our Organization</h2>
        <p>Please verify your email<p>
        <a href="${verifyUrl}">Click Here to Verify</a>
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Verification Email Sent!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials!",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email first!",
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: "Account temporarily locked. Try Later!",
      });
    }

    if (["Resigned", "Terminated"].includes(user.employmentStatus)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Employee ${user.employmentStatus}!`,
      });
    }

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid Credentials!",
      });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        empId: user.empId,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    // secure: process.env.NODE_ENV === "production",
  });

  return res.status(200).json({
    success: true,
    message: "Logged Out Successfully!",
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required!",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this mail exists, reset link has been sent!",
      });
    }

    const resetToken = user.passwordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <p>Click below link:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>This link expires in 10 minutes.</p>
    `;

    await sendMail({
      to: user.email,
      subject: "Password Reset",
      html,
    });

    return res.status(200).json({
      success: true,
      message: "Password Reset Link sent!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPwd, cnfPwd } = req.body;

    if (!newPwd || !cnfPwd) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    if (newPwd !== cnfPwd) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match!",
      });
    }

    if (newPwd.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 Characters!",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or Expired Token!",
      });
    }

    user.password = await bcrypt.hash(newPwd, 10);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or Expired Token!",
      });
    }

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email Verified Successfully!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required!",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    if (user.isVerified) {
      return res.status(404).json({
        success: false,
        message: "Email already verified!",
      });
    }

    const token = user.verifyEmailToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

    await sendMail({
      to: user.email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome to our Organization</h2>
        <p>Please verify your email<p>
        <a href="${verifyUrl}">Click Here to Verify</a>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email resent!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
