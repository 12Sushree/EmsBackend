const Leave = require("../models/leaveModel");

exports.applyLeave = async (req, res) => {
  try {
    const { from, to, reason } = req.body;

    if (!from || !to || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    const leave = await Leave.create({
      userId: req.user.id,
      from,
      to,
      reason,
    });

    return res.status(200).json({
      success: true,
      leave,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.myLeaves = async (req, res) => {
  try {
    const data = await Leave.find({ userId: req.user.id }).sort({
      appliedAt: -1,
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

exports.allLeaves = async (req, res) => {
  try {
    const data = await Leave.find().populate("userId", "userName email role");

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

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found!",
      });
    }

    leave.status = status;
    await leave.save();

    return res.status(200).json({
      success: true,
      leave,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
