const Attendance = require("../models/attendanceModel");

const today = () => new Date().toISOString().split("T")[0];

exports.checkIn = async (req, res) => {
  try {
    const date = today();
    const exist = await Attendance.findOne({ userId: req.user.id, date });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Already checked in!",
      });
    }

    const attendance = await Attendance.create({
      userId: req.user.id,
      date,
      checkIn: new Date().toLocaleTimeString(),
    });

    return res.status(200).json({
      success: true,
      attendance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const date = today();
    const record = await Attendance.findOne({ userId: req.user.id, date });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Check-in first!",
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: "Already checked out!",
      });
    }

    record.checkOut = new Date().toLocaleTimeString();
    await record.save();

    return res.status(200).json({
      success: true,
      record,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.myAttendance = async (req, res) => {
  try {
    const data = await Attendance.find({ userId: req.user.id }).sort({
      date: -1,
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
