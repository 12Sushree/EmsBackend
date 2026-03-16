const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  applyLeave,
  myLeaves,
  updateStatus,
  getManagerLeaves,
  getMyLeaveCalendar,
  getTeamLeaveCalendar,
} = require("../controllers/leaveController");
const { activeEmpOnly } = require("../middlewares/activeEmpMiddleware");

router.post("/apply", auth, activeEmpOnly, applyLeave);
router.get("/my", auth, myLeaves);
router.get("/all", auth, roleMid("Manager"), getManagerLeaves);
router.patch(
  "/status/:id",
  auth,
  roleMid("Manager"),
  activeEmpOnly,
  updateStatus,
);
router.get("/leave-calendar", auth, getMyLeaveCalendar);
router.get(
  "/team-leave-calendar",
  auth,
  roleMid("Manager"),
  getTeamLeaveCalendar,
);

module.exports = router;
