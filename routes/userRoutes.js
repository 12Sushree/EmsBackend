const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { roleMid } = require("../middlewares/roleMiddleware");
const {
  getMyProfile,
  searchUsers,
  changePassword,
  updateProfile,
  updateEmploymentStatus,
  updateEmployeeDesignation,
} = require("../controllers/userController");

router.get("/profile", auth, getMyProfile);
router.get("/search", auth, roleMid("Manager"), searchUsers);
router.put("/change-pwd", auth, changePassword);
router.put("/update", auth, updateProfile);
router.patch(
  "/update-emp-status/:id",
  auth,
  roleMid("Manager"),
  updateEmploymentStatus,
);
router.patch(
  "/update-emp-designation/:id",
  auth,
  roleMid("Manager"),
  updateEmployeeDesignation,
);

module.exports = router;
