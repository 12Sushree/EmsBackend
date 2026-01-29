const User = require("../models/userModel");
const Attendance = require("../models/attendanceModel");
const Task = require("../models/taskModel");

exports.addEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required!",
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found!",
      });
    }

    if (employee.role !== "Employee") {
      return res.status(400).json({
        success: false,
        message: "Only Employees can be added!",
      });
    }

    employee.managerId = req.user.id;
    await employee.save();

    return res.status(200).json({
      success: true,
      employee,
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
    const team = await User.find({ managerId: req.user.id });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No team assigned!",
      });
    }

    const teamData = [];

    for (let emp of team) {
      const attendanceCount = await Attendance.countDocuments({
        userId: emp._id,
      });

      const tasks = await Task.find({ assignedTo: emp._id });
      const completed = tasks.filter((t) => t.status === "Done").length;
      const pending = tasks.length - completed;

      teamData.push({
        id: emp._id,
        userName: emp.userName,
        email: emp.email,
        role: emp.role,
        attendanceRecords: attendanceCount,
        tasks: {
          total: tasks.length,
          completed,
          pending,
        },
      });
    }

    return res.status(200).json({
      success: true,
      managerId: req.user.id,
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
    const team = await User.find({ managerId: req.user.id });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No team assigned!",
      });
    }

    let totalTasks = 0;
    let totalDone = 0;
    let totalPending = 0;

    for (let emp of team) {
      const tasks = await Task.find({ assignedTo: emp._id });
      const completed = tasks.filter((t) => t.status === "Done").length;
      const pending = tasks.length - completed;

      totalTasks += tasks.length;
      totalDone += completed;
      totalPending += pending;
    }

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
