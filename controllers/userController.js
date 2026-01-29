const User = require("../models/userModel");

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "managerId",
      "userName email",
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

exports.getProfileByName = async (req, res) => {
  try {
    const { userName } = req.query;

    const user = await User.findOne({ userName });

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
