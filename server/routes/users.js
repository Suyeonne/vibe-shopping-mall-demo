const express = require("express");
const {
  createUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

router.post("/", createUser); // 유저 생성
router.post("/login", loginUser); // 로그인
router.get("/me", authMiddleware, getMe); // 토큰으로 내 정보 조회
router.get("/", authMiddleware, adminMiddleware, getUsers); // 유저 전체 조회
router.get("/:id", authMiddleware, adminMiddleware, getUserById); // 유저 하나 조회
router.put("/:id", authMiddleware, adminMiddleware, updateUser); // 유저 수정
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser); // 유저 삭제

module.exports = router;
