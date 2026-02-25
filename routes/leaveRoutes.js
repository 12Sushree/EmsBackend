const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  applyLeave,
  myLeaves,
  allLeaves,
  updateStatus,
} = require("../controllers/leaveController");
const { activeEmpOnly } = require("../middlewares/activeEmpMiddleware");

router.post("/apply", auth, activeEmpOnly, applyLeave);
router.get("/my", auth, myLeaves);
router.get("/all", auth, roleMid("Manager"), allLeaves);
router.patch(
  "/status/:id",
  auth,
  roleMid("Manager"),
  activeEmpOnly,
  updateStatus,
);

module.exports = router;
