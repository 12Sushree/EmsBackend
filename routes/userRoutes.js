const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  getMyProfile,
  getProfileByName,
} = require("../controllers/userController");

router.get("/profile", auth, getMyProfile);
router.get("/profilebyname", auth, roleMid("Manager"), getProfileByName);

module.exports = router;
