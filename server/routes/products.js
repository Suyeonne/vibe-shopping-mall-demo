const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

router.get("/", getProducts); // 상품 전체 조회 (?page=1, 5개씩)
router.get("/:id", getProductById); // 상품 하나 조회
router.post("/", authMiddleware, adminMiddleware, createProduct); // 상품 생성
router.put("/:id", authMiddleware, adminMiddleware, updateProduct); // 상품 수정
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct); // 상품 삭제

module.exports = router;
