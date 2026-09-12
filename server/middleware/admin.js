const User = require("../models/User");

function isAdminType(value) {
  return String(value || "").trim().toLowerCase() === "admin";
}

async function adminMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.user?.id).select("user_type");

    if (!user || !isAdminType(user.user_type)) {
      return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
    }

    req.user.user_type = user.user_type;
    next();
  } catch (error) {
    return res.status(500).json({ message: "권한을 확인하지 못했습니다." });
  }
}

module.exports = adminMiddleware;
