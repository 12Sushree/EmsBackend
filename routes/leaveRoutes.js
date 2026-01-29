const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  applyLeave,
  myLeaves,
  allLeaves,
  updateStatus,
} = require("../controllers/leaveController");

router.post("/apply", auth, applyLeave);
router.get("/my", auth, myLeaves);
router.get("/all", auth, roleMid("Manager"), allLeaves);
router.put("/status/:id", auth, roleMid("Manager"), updateStatus);

module.exports = router;
