const Attendance = require("../models/attendanceModel");
const Task = require("../models/taskModel");
const mongoose = require("mongoose");

exports.myPerformance = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const attendanceStats = await Attendance.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalHours: { $sum: "$workingHours" },
        },
      },
    ]);

    const workingHours = attendanceStats[0]?.totalHours || 0;

    const stats = await Task.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "Done"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const totalTasks = stats[0]?.total || 0;
    const done = stats[0]?.completed || 0;
    const pending = totalTasks - done;

    return res.status(200).json({
      success: true,
      workingHours,
      performance: {
        totalTasks,
        completed: done,
        pending,
        completionRate:
          totalTasks === 0 ? 0 : ((done / totalTasks) * 100).toFixed(2),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
