const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  createAnnouncement,
  getAnnouncements,
} = require("../controllers/announcementController");
const { activeEmpOnly } = require("../middlewares/activeEmpMiddleware");

router.post(
  "/create",
  auth,
  roleMid("Manager"),
  activeEmpOnly,
  createAnnouncement,
);
router.get("/all", auth, getAnnouncements);

module.exports = router;
