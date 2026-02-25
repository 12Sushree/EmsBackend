const Leave = require("../models/leaveModel");

const isValidate = (date) => !isNaN(new Date(date).getTime());

const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

exports.applyLeave = async (req, res) => {
  try {
    const { from, to, reason } = req.body;

    if (!from || !to || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    if (!isValidate(from) || !isValidate(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format!",
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const today = new Date();

    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    today.setHours(0, 0, 0, 0);

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "'From' date can't be after 'To' date!",
      });
    }

    if (fromDate < today) {
      return res.status(400).json({
        success: false,
        message: "Can't apply leave for past dates!",
      });
    }

    const isSameDay = fromDate.getTime() === today.getTime();

    if (isSameDay) {
      return res.status(400).json({
        success: false,
        message: "Same-day leave not allowed!",
      });
    }

    const overlappingLeave = await Leave.findOne({
      userId: req.user.id,
      status: { $in: ["Pending", "Approved"] },
      from: { $lte: toDate },
      to: { $gte: fromDate },
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: "Overlapping leave request exists!",
      });
    }

    const diffDays =
      Math.ceil(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (diffDays > 30) {
      return res.status(400).json({
        success: false,
        message: "Leave can't exceed 30 days!",
      });
    }

    const leave = await Leave.create({
      userId: req.user.id,
      from: fromDate,
      to: toDate,
      reason: reason.trim(),
    });

    return res.status(201).json({
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
    const { page, limit, skip } = getPagination(req);

    const total = await Leave.countDocuments({ userId: req.user.id });

    const data = await Leave.find({ userId: req.user.id })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

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

exports.allLeaves = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const total = await Leave.countDocuments();

    const data = await Leave.find()
      .populate("userId", "empId userName email role")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

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

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required!",
      });
    }

    const allowedStatuses = ["Pending", "Approved", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value!",
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found!",
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Leave already reviewed!",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (leave.to < today) {
      return res.status(400).json({
        success: false,
        message: "Can't approve past leave!",
      });
    }

    if (leave.userId.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can't review your own leave!",
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
