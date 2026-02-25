const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("./tokenControllers");

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "reportingManager",
      "empId userName email designation",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required!",
      });
    }

    const users = await User.find({
      $or: [
        { userName: { $regex: query, $options: "i" } },
        { empId: { $regex: query, $options: "i" } },
      ],
    })
      .select("empId userName email role designation")
      .sort({ userName: 1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currPwd, newPwd, cnfPwd } = req.body;

    if (!currPwd || !newPwd || !cnfPwd) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPwd !== cnfPwd) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match!",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const comparePassword = await bcrypt.compare(currPwd, user.password);

    if (!comparePassword) {
      return res.status(401).json({
        success: false,
        message: "Current password incorrect!",
      });
    }

    const isSame = await bcrypt.compare(newPwd, user.password);

    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different",
      });
    }

    const hashedPassword = await bcrypt.hash(newPwd, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      userName,
      phone,
      designation,
      reportingManager,
      employmentStatus,
      dateOfJoining,
      email,
      role,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    if (user.role === "Employee") {
      if (employmentStatus || role || reportingManager || designation) {
        return res.status(403).json({
          success: false,
          message: "Access denied!",
        });
      }
    }

    if (userName && userName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username too short!",
      });
    }

    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number!",
      });
    }

    if (designation && designation.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid designation!",
      });
    }

    if (dateOfJoining && isNaN(new Date(dateOfJoining).getTime())) {
      return resizeBy.status(400).json({
        success: false,
        message: "Invalid joining date!",
      });
    }

    if (dateOfJoining && new Date(dateOfJoining) > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Joining date can't be in future!",
      });
    }

    if (email) {
      const emailExists = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: userId },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use!",
        });
      }
    }

    if (reportingManager) {
      const manager = await User.findById(reportingManager);

      if (!manager || manager.role !== "Manager") {
        return res.status(400).json({
          success: false,
          message: "Invalid reporting manager!",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(userName && { userName: userName.trim() }),
        ...(phone && { phone }),
        ...(dateOfJoining && { dateOfJoining }),
        ...(email && { email: email.trim().toLowerCase() }),

        ...(user.role !== "Employee" &&
          designation && { designation: designation.trim() }),
        ...(user.role !== "Employee" && role && { role }),
        ...(user.role !== "Employee" &&
          reportingManager && { reportingManager }),
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("reportingManager", "empId userName email");

    let accessToken = null;
    let refreshToken = null;

    if (role && role !== user.role) {
      accessToken = generateAccessToken(updatedUser);
      refreshToken = generateRefreshToken(updatedUser);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully!",
      user: updatedUser,
      ...(accessToken && { accessToken }),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateEmploymentStatus = async (req, res) => {
  try {
    const { employmentStatus } = req.body;

    if (!employmentStatus) {
      return res.status(401).json({
        success: false,
        message: "Employment status is required to update!",
      });
    }

    const allowedStatuses = ["Active", "On Leave", "Resigned", "Terminated"];

    if (!allowedStatuses.includes(employmentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employment status!",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    user.employmentStatus = employmentStatus;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Employment status updated!",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateEmployeeDesignation = async (req, res) => {
  try {
    const { designation } = req.body;

    if (!designation) {
      return res.status(401).json({
        success: false,
        message: "Designation is required to update!",
      });
    }

    if (designation.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid designation!",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    user.designation = designation;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User designation updated!",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
