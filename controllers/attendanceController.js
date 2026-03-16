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

    let record = await Attendance.findOne({
      userId: req.user.id,
      date: { $gte: start, $lt: end },
    });

    if (!record) {
      record = await Attendance.create({
        userId: req.user.id,
        date: start,
        sessions: [{ checkIn: new Date() }],
      });
    } else {
      const lastSession = record.sessions[record.sessions.length - 1];

      if (lastSession && !lastSession.checkOut) {
        return res.status(400).json({
          success: false,
          message: "Already checked in!",
        });
      }

      record.sessions.push({ checkIn: new Date() });
      await record.save();
    }

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

    const lastSession = record.sessions[record.sessions.length - 1];

    if (!lastSession || lastSession.checkOut) {
      return res.status(400).json({
        success: false,
        message: "No active check-in found!",
      });
    }

    lastSession.checkOut = new Date();

    let totalMinutes = 0;

    record.sessions.forEach((s) => {
      if (s.checkIn && s.checkOut) {
        totalMinutes += timeToMinutes(s.checkOut) - timeToMinutes(s.checkIn);
      }
    });

    const hours = totalMinutes / 60;

    record.workingHours = (Math.round(hours * 100) / 100).toFixed(2);

    if (hours < 2) record.status = "Absent";
    else if (hours <= 4) record.status = "Half Day";
    else record.status = "Present";

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
