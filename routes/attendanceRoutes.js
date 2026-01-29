const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const {
  checkIn,
  checkOut,
  myAttendance,
} = require("../controllers/attendanceController");

router.post("/checkin", auth, checkIn);
router.post("/checkout", auth, checkOut);
router.get("/my", auth, myAttendance);

module.exports = router;
