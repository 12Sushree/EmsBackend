const Task = require("../models/taskModel");

exports.createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    const task = await Task.create({
      title,
      description,
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

exports.teamTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedBy: req.user.managerId }).populate(
      "assignedBy",
      "userName email",
    );

    return res.status(200).json({
      success: true,
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
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: true,
        message: "Task not found!",
      });
    }

    if (task.assignedBy.toString() !== req.user.managerId) {
      return res.status(403).json({
        success: false,
        message: "Not your task!",
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
