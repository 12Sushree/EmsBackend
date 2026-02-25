const { regenerateAccessToken } = require("../controllers/tokenControllers");
const rateLimit = require("express-rate-limit");
const router = require("express").Router();

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

router.post("/refresh", refreshLimiter, regenerateAccessToken);

module.exports = router;
