const Attendance = require("../models/attendanceModel");
const Task = require("../models/taskModel");

const timeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes, seconds] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

exports.myPerformance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ userId: req.user.id });

    let totalMins = 0;
    const daily = attendance.map((a) => {
      if (a.checkIn && a.checkOut) {
        const diff = timeToMinutes(a.checkOut) - timeToMinutes(a.checkIn);
        totalMins += diff;
        return { date: a.date, minutes: diff };
      }
      return { date: a.date, minutes: 0 };
    });

    const tasks = await Task.find({ assignedTo: req.user.id });
    const done = tasks.filter((t) => t.status === "Done").length;
    const pending = tasks.length - done;

    return res.status(200).json({
      success: true,
      workingHours: {
        totalHrs: (totalMins / 60).toFixed(2),
        daily,
      },
      performance: {
        totalTasks: tasks.length,
        completed: done,
        pending,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
