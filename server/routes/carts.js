const express = require("express");
const {
  createCart,
  getCarts,
  getCartById,
  updateCart,
  addCartItem,
  deleteCart,
} = require("../controllers/cart.controller");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createCart); // 장바구니 생성
router.post("/items", addCartItem); // 장바구니에 상품 추가
router.get("/", getCarts); // 장바구니 전체 조회 (?user=유저id)
router.get("/:id", getCartById); // 장바구니 하나 조회
router.put("/:id", updateCart); // 장바구니 수정
router.delete("/:id", deleteCart); // 장바구니 삭제

module.exports = router;
