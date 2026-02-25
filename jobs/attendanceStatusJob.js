const cron = require("node-cron");
const Attendance = require("../models/attendanceModel");
const User = require("../models/userModel");

const today = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

cron.schedule("59 23 * * *", async () => {
  try {
    console.log("Running attendance auto-close job...");

    const start = today();
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const employees = await User.find({
      employmentStatus: "Active",
    }).select("_id");

    for (const employee of employees) {
      const record = await Attendance.findOne({
        userId: employee._id,
        date: { $gte: start, $lt: end },
      });

      if (!record) {
        await Attendance.create({
          userId: employee._id,
          date: start,
          status: "Absent",
          workingHours: 0,
        });

        console.log(`Marked Absent → ${employee._id}`);
        continue;
      }

      if (record.checkIn && !record.checkOut) {
        const autoCheckOut = new Date(record.checkIn);
        autoCheckOut.setHours(19, 0, 0, 0);

        if (autoCheckOut <= record.checkIn) {
          autoCheckOut = new Date();
        }

        record.checkOut = autoCheckOut;

        const diff = record.checkOut - record.checkIn;
        const hours = diff / (1000 * 60 * 60);

        record.workingHours = Math.round(hours * 100) / 100;
        if (hours < 2) record.status = "Absent";
        else if (hours <= 4) record.status = "Half Day";
        else record.status = "Present";

        await record.save();

        console.log(`Auto checkout → ${employee._id}`);
      }
    }

    console.log("Night Attendance Cron Completed!");
  } catch (err) {
    console.error("Night Cron Error:", err.message);
  }
});
