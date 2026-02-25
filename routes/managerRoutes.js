const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  addEmployee,
  monitorProgress,
  teamMembers,
  removeEmployee,
} = require("../controllers/managerController");
const { activeEmpOnly } = require("../middlewares/activeEmpMiddleware");

router.post("/add-emp", auth, roleMid("Manager"), activeEmpOnly, addEmployee);
router.post(
  "/remove-emp/:id",
  auth,
  roleMid("Manager"),
  activeEmpOnly,
  removeEmployee,
);
router.get("/team-mems", auth, roleMid("Manager"), activeEmpOnly, teamMembers);
router.get(
  "/monitor",
  auth,
  roleMid("Manager"),
  activeEmpOnly,
  monitorProgress,
);

module.exports = router;
