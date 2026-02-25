const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  createTask,
  myTasks,
  updateStatus,
  allTasks,
} = require("../controllers/taskController");
const { activeEmpOnly } = require("../middlewares/activeEmpMiddleware");

router.post("/create", auth, roleMid("Manager"), activeEmpOnly, createTask);
router.get("/my", auth, myTasks);
router.put(
  "/status/:id",
  auth,
  roleMid("Employee"),
  activeEmpOnly,
  updateStatus,
);
router.get("/all", auth, roleMid("Manager"), allTasks);

module.exports = router;
