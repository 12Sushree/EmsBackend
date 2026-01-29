const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  const headerData = req.headers.authorization;
  try {
    if (headerData) {
      const token = headerData.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "No Token Found!",
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Token is Invalid!",
    });
  }
};
