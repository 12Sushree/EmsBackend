const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { activeEmpOnly } = require("../middlewares/activeEmpMiddleware");
const {
  checkIn,
  checkOut,
  myAttendance,
} = require("../controllers/attendanceController");

router.post("/check-in", auth, activeEmpOnly, checkIn);
router.post("/check-out", auth, activeEmpOnly, checkOut);
router.get("/my", auth, myAttendance);

module.exports = router;
