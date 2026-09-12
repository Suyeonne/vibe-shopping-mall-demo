const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require("../controllers/order.controller");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createOrder); // 주문 생성
router.get("/", getOrders); // 주문 전체 조회
router.get("/:id", getOrderById); // 주문 하나 조회
router.put("/:id", updateOrder); // 주문 수정
router.delete("/:id", deleteOrder); // 주문 삭제

module.exports = router;
