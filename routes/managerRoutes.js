const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  addEmployee,
  monitorProgress,
  teamMembers,
} = require("../controllers/managerController");

router.post("/add-emp", auth, roleMid("Manager"), addEmployee);
router.get("/team-mems", auth, roleMid("Manager"), teamMembers);
router.get("/monitor", auth, roleMid("Manager"), monitorProgress);

module.exports = router;
