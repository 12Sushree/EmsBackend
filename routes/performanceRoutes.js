const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { myPerformance } = require("../controllers/performanceController");

router.get("/me", auth, myPerformance);

module.exports = router;
