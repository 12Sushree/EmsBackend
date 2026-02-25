const Task = require("../models/taskModel");
const User = require("../models/userModel");

const getPagination = (req) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo } = req.body;

    console.log("assignedTo received:", assignedTo);
    console.log("Type:", typeof assignedTo);

    if (!title || !description || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    const employee = await User.findById(assignedTo);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Assigned employee not found!",
      });
    }

    if (employee.role !== "Employee") {
      return res.status(400).json({
        success: false,
        message: "Tasks can only be assigned to Employees!",
      });
    }

    if (employee.employmentStatus !== "Active") {
      return res.status(400).json({
        success: false,
        message: `Can't assign task. Employee is ${employee.employmentStatus}!`,
      });
    }

    const existingTask = await Task.findOne({
      assignedTo,
      title: { $regex: `^${title.trim()}$`, $options: "i" },
      status: { $ne: "Done" },
    });

    if (existingTask) {
      return res.status(409).json({
        success: false,
        message: "Duplicate task detected!",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      assignedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.myTasks = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const total = await Task.countDocuments({ assignedTo: req.user.id });

    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate("assignedBy", "empId userName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      tasks,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    console.log("Incoming status:", status);
    console.log("Type of status:", typeof status);
    console.log("Is Array:", Array.isArray(status));
    const allowedStatuses = ["Todo", "In Progress", "Done"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value - ${status}!`,
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found!",
      });
    }

    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not your task!",
      });
    }

    if (task.status === "Done") {
      return res.status(400).json({
        success: false,
        message: "Completed tasks can't be modified!",
      });
    }

    task.status = status;
    await task.save();

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.allTasks = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const total = await Task.countDocuments({ assignedBy: req.user.id });

    const tasks = await Task.find({ assignedBy: req.user.id })
      .populate("assignedTo", "empId userName email")
      .populate("assignedBy", "empId userName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!tasks.length) {
      return res.status(400).json({
        success: false,
        message: "No tasks found!",
      });
    }

    return res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      tasks,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
