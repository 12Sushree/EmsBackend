const Announcement = require("../models/announcementModel");

exports.createAnnouncement = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const message = req.body.message?.trim();

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const announcement = await Announcement.create({
      title,
      message,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      data: announcement,
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
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      Announcement.find()
        .populate("createdBy", "empId userName role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: announcements.length,
      data: announcements,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
