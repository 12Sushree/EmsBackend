const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.auth = async (req, res, next) => {
  const headerData = req.headers.authorization;

  if (!headerData || !headerData.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization Token Missing!",
    });
  }

  const token = headerData.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User No Longer Exists!",
      });
    }

    if (["Resigned", "Terminated"].includes(user.employmentStatus)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied!",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access Token Expired!",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid Access Token",
    });
  }
};
