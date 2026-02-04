const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  createTask,
  teamTasks,
  updateStatus,
} = require("../controllers/taskController");

router.post("/create", auth, roleMid("Manager"), createTask);
router.get("/all", auth, teamTasks);
router.put("/status/:id", auth, updateStatus);

module.exports = router;
