const cron = require("node-cron");
const User = require("../models/userModel");
const Leave = require("../models/leaveModel");

cron.schedule("0 0 * * *", async () => {
  console.log("Running Leave Status Sync Job");

  const today = new Date();

  try {
    const activeLeaves = await Leave.find({
      status: "Approved",
      from: { $lte: today },
      to: { $gte: today },
    });

    const onLeaveUserIds = activeLeaves.map((leave) => leave.userId);

    await User.updateMany(
      {
        _id: { $in: onLeaveUserIds },
        employmentStatus: { $nin: ["Terminated", "Resigned"] },
      },
      { employmentStatus: "On Leave" },
    );

    await User.updateMany(
      {
        _id: { $nin: onLeaveUserIds },
        employmentStatus: "On Leave",
      },
      { employmentStatus: "Active" },
    );

    console.log("Leave Status Sync Completed");
  } catch (err) {
    console.error("Cron Job Error:", err.message);
  }
});
