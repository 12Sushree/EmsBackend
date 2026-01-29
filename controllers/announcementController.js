const Announcement = require("../models/announcementModel");

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const data = await Announcement.create({
      title,
      message,
      createdBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const data = await Announcement.find()
      .populate("createdBy", "userName email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
