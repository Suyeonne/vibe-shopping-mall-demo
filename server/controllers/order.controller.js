const Order = require("../models/Order");
const Product = require("../models/Product");

const PAYMENT_METHODS = ["card", "transfer"];
const STATUSES = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"];
const CANCELLABLE = ["pending", "paid", "preparing"];

const isDuplicateOrderNumber = (error) => error.code === 11000;

function isOwner(order, user) {
  return user.user_type === "admin" || String(order.user) === String(user.id);
}

function isAdmin(user) {
  return user.user_type === "admin";
}

async function createOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const prefix = `FI-${year}${month}${day}-`;
  const count = await Order.countDocuments({
    orderNumber: new RegExp(`^${prefix}`),
  });

  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

async function snapshotItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("주문 상품은 1개 이상이어야 합니다.");
  }

  const merged = new Map();

  for (const item of items) {
    if (!item?.product) {
      throw new Error("상품 id는 필수입니다.");
    }

    const quantity = Number(item.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("수량은 1 이상의 정수여야 합니다.");
    }

    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error("존재하지 않는 상품입니다.");
    }

    const key = String(product._id);
    const prev = merged.get(key);
    merged.set(key, {
      product: product._id,
      syu: product.syu,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: (prev?.quantity || 0) + quantity,
    });
  }

  return Array.from(merged.values());
}

function requireShipping(body) {
  const recipient = body.recipient?.trim();
  const phone = body.phone?.trim();
  const address = body.address?.trim();

  if (!recipient || !phone || !address) {
    throw new Error("받는 사람, 연락처, 배송지는 필수입니다.");
  }

  if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
    throw new Error("결제 수단은 card, transfer 중 하나여야 합니다.");
  }

  return { recipient, phone, address, note: body.note?.trim() || "" };
}

async function verifyPortonePayment(paymentId, expectedAmount) {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    throw new Error("결제 검증 키가 없습니다. 서버에 PORTONE_API_SECRET을 넣어 주세요.");
  }

  const response = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${secret}`,
      },
    }
  );
  const payment = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payment.message || "결제 정보를 확인할 수 없습니다.");
  }

  if (payment.status !== "PAID") {
    throw new Error("결제가 완료되지 않았습니다.");
  }

  const paidAmount = Number(payment.amount?.total ?? payment.amount?.paid);
  if (paidAmount !== expectedAmount) {
    throw new Error("결제 금액이 주문 금액과 다릅니다.");
  }

  return payment;
}

// 주문 생성
const createOrder = async (req, res) => {
  try {
    const paymentId = String(req.body.paymentId || "").trim();
    if (!paymentId) {
      return res.status(400).json({ message: "결제 번호가 없습니다." });
    }

    const duplicated = await Order.findOne({ paymentId });
    if (duplicated) {
      return res.status(409).json({
        message: "이미 처리된 결제입니다.",
        order: duplicated,
      });
    }

    const shipping = requireShipping(req.body);
    const items = await snapshotItems(req.body.items);
    const shippingFee = Number(req.body.shippingFee ?? 0);

    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      return res.status(400).json({ message: "배송비는 0 이상이어야 합니다." });
    }

    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = itemsTotal + shippingFee;

    await verifyPortonePayment(paymentId, total);

    const order = await Order.create({
      orderNumber: await createOrderNumber(),
      user: req.user.id,
      items,
      ...shipping,
      itemsTotal,
      shippingFee,
      total,
      paymentMethod: req.body.paymentMethod,
      paymentId,
      status: "paid",
    });

    res.status(201).json(order);
  } catch (error) {
    if (isDuplicateOrderNumber(error)) {
      return res.status(409).json({ message: "이미 처리된 주문입니다." });
    }
    res.status(400).json({ message: error.message });
  }
};

// 주문 전체 조회
const getOrders = async (req, res) => {
  try {
    const mine = String(req.query.mine || "") === "1";
    const filter = isAdmin(req.user) && !mine ? {} : { user: req.user.id };
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 주문 하나 조회
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    if (!isOwner(order, req.user)) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 주문 수정 (배송 정보, 상태)
const updateOrder = async (req, res) => {
  try {
    const current = await Order.findById(req.params.id);

    if (!current) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    if (!isOwner(current, req.user)) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    const update = {};

    if (req.body.recipient !== undefined) update.recipient = String(req.body.recipient).trim();
    if (req.body.phone !== undefined) update.phone = String(req.body.phone).trim();
    if (req.body.address !== undefined) update.address = String(req.body.address).trim();
    if (req.body.note !== undefined) update.note = String(req.body.note).trim();

    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) {
        return res.status(400).json({ message: "올바른 주문 상태가 아닙니다." });
      }

      if (!isAdmin(req.user)) {
        if (req.body.status !== "cancelled" || !CANCELLABLE.includes(current.status)) {
          return res.status(403).json({ message: "주문 상태를 변경할 수 없습니다." });
        }
      }

      update.status = req.body.status;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "수정할 값이 없습니다." });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 주문 삭제
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    await order.deleteOne();
    res.json({ message: "주문이 삭제되었습니다." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
