const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.role || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  next();
};

const verifyStaff = (req, res, next) => {
  if (
    !req.user ||
    !req.user.role ||
    (req.user.role !== "admin" && req.user.role !== "staff")
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Staff or Admins only.",
    });
  }
  next();
};

export { verifyAdmin, verifyStaff };
