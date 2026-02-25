exports.activeEmpOnly = (req, res, next) => {
  if (req.user.employmentStatus !== "Active") {
    return res.status(403).json({
      success: false,
      message: "Action not allowed!",
    });
  }
  next();
};
