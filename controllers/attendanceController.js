const Attendance = require("../models/attendanceModel");

const today = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const timeToMinutes = (value) => {
  if (!value) return 0;

  const date = new Date(value);
  if (isNaN(date.getTime())) return 0;

  return date.getHours() * 60 + date.getMinutes();
};

const getTodayRange = () => {
  const start = today();
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
};

exports.checkIn = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    if (req.user.employmentStatus === "On Leave") {
      return res.status(403).json({
        success: false,
        message: "Can't check in while on leave!",
      });
    }

    if (["Resigned", "Terminated"].includes(req.user.employmentStatus)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied!",
      });
    }

    const existing = await Attendance.findOne({
      userId: req.user.id,
      date: { $gte: start, $lt: end },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already checked in today!",
      });
    }

    const attendance = await Attendance.create({
      userId: req.user.id,
      date: start,
      checkIn: new Date(),
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
    const { start, end } = getTodayRange();

    if (req.user.employmentStatus === "On Leave") {
      return res.status(403).json({
        success: false,
        message: "Can't check out while on leave!",
      });
    }

    if (["Resigned", "Terminated"].includes(req.user.employmentStatus)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied!",
      });
    }

    const record = await Attendance.findOne({
      userId: req.user.id,
      date: { $gte: start, $lt: end },
    });

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

    record.checkOut = new Date();

    if (record.checkIn) {
      const inMin = timeToMinutes(record.checkIn);
      const outMin = timeToMinutes(record.checkOut);

      let diff = outMin - inMin;

      const hours = diff / 60;
      // const diff =
      //   timeToMinutes(record.checkOut) - timeToMinutes(record.checkIn);
      // if (diff < 0) diff += 24 * 60;
      // const hours = diff / 60;

      record.workingHours = Math.round(hours * 100) / 100;

      if (hours < 2) record.status = "Absent";
      else if (hours <= 4) record.status = "Half Day";
      else record.status = "Present";
    }

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
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Attendance.find({ userId: req.user.id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments({ userId: req.user.id }),
    ]);

    return res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
