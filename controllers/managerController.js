const User = require("../models/userModel");
const Attendance = require("../models/attendanceModel");
const Task = require("../models/taskModel");

const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

exports.addEmployee = async (req, res) => {
  try {
    const { empId } = req.body;

    if (!empId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required!",
      });
    }

    const employee = await User.findOne({ empId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found!",
      });
    }

    if (employee.role !== "Employee") {
      return res.status(400).json({
        success: false,
        message: "Only Employees can be assigned!",
      });
    }

    if (employee.reportingManager) {
      return res.status(400).json({
        success: false,
        message: "Employee already assigned to a manager!",
      });
    }

    employee.reportingManager = req.user.id;
    await employee.save();

    return res.status(200).json({
      success: true,
      employee: {
        id: employee._id,
        empId: employee.empId,
        userName: employee.userName,
        email: employee.email,
        phone: employee.phone,
        designation: employee.designation,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.removeEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const emp = await User.findById(id);

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found!",
      });
    }

    if (emp.reportingManager?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Employee is not part of your team!",
      });
    }

    emp.reportingManager = undefined;
    await emp.save();

    return res.status(200).json({
      success: true,
      message: "Employee removed from your team successfully!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.teamMembers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const total = await User.countDocuments({ reportingManager: req.user.id });

    const team = await User.find({ reportingManager: req.user.id })
      .sort({ userName: 1 })
      .skip(skip)
      .limit(limit);

    const teamIds = team.map((emp) => emp._id);

    const attendanceCount = await Attendance.aggregate([
      { $match: { userId: { $in: teamIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);

    const attendanceMap = {};
    attendanceCount.forEach((attendance) => {
      attendanceMap[attendance._id.toString()] = attendance.count;
    });

    const taskStats = await Task.aggregate([
      { $match: { assignedTo: { $in: teamIds } } },
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "Done"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const taskMap = {};
    taskStats.forEach((task) => {
      taskMap[task._id.toString()] = {
        total: task.total,
        completed: task.completed,
        pending: task.total - task.completed,
      };
    });

    const teamData = team.map((emp) => ({
      id: emp._id,
      empId: emp.empId,
      userName: emp.userName,
      email: emp.email,
      role: emp.role,
      attendanceRecords: attendanceMap[emp._id.toString()] || 0,
      tasks: taskMap[emp._id.toString()] || {
        total: 0,
        completed: 0,
        pending: 0,
      },
    }));

    return res.status(200).json({
      success: true,
      reportingManager: req.user.id,
      page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      teamSize: team.length,
      team: teamData,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.monitorProgress = async (req, res) => {
  try {
    const team = await User.find({ reportingManager: req.user.id });

    const teamIds = team.map((emp) => emp._id);

    const stats = await Task.aggregate([
      { $match: { assignedTo: { $in: teamIds } } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          totalDone: {
            $sum: {
              $cond: [{ $eq: ["$status", "Done"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const totalTasks = stats[0]?.totalTasks || 0;
    const totalDone = stats[0]?.totalDone || 0;
    const totalPending = totalTasks - totalDone;

    return res.status(200).json({
      success: true,
      summary: {
        teamSize: team.length,
        totalTasks,
        totalDone,
        totalPending,
        completionRate:
          totalTasks === 0 ? 0 : ((totalDone / totalTasks) * 100).toFixed(2),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
