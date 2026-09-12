const Cart = require("../models/Cart");
const Product = require("../models/Product");

const isDuplicateUser = (error) => error.code === 11000;

function isOwner(cart, user) {
  return user.user_type === "admin" || String(cart.user) === String(user.id);
}

async function normalizeItems(items = []) {
  if (!Array.isArray(items)) {
    throw new Error("items는 배열이어야 합니다.");
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
    merged.set(key, (merged.get(key) || 0) + quantity);
  }

  return Array.from(merged, ([product, quantity]) => ({ product, quantity }));
}

// 장바구니 생성
const createCart = async (req, res) => {
  try {
    const { items } = req.body;
    const user = req.user.id;

    const exists = await Cart.findOne({ user });
    if (exists) {
      return res.status(400).json({ message: "이미 장바구니가 있습니다." });
    }

    const cart = await Cart.create({
      user,
      items: await normalizeItems(items),
    });

    const result = await Cart.findById(cart._id).populate("items.product");
    res.status(201).json(result);
  } catch (error) {
    if (isDuplicateUser(error)) {
      return res.status(400).json({ message: "이미 장바구니가 있습니다." });
    }
    res.status(400).json({ message: error.message });
  }
};

// 장바구니 전체 조회
const getCarts = async (req, res) => {
  try {
    const filter = req.user.user_type === "admin" ? {} : { user: req.user.id };

    const carts = await Cart.find(filter).populate("items.product");
    res.json(carts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 장바구니 하나 조회
const getCartById = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id).populate("items.product");

    if (!cart) {
      return res.status(404).json({ message: "장바구니를 찾을 수 없습니다." });
    }

    if (!isOwner(cart, req.user)) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 장바구니 수정
const updateCart = async (req, res) => {
  try {
    const update = {};

    if (req.body.items !== undefined) {
      update.items = await normalizeItems(req.body.items);
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "수정할 값이 없습니다." });
    }

    const current = await Cart.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: "장바구니를 찾을 수 없습니다." });
    }

    if (!isOwner(current, req.user)) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    const cart = await Cart.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate("items.product");

    if (!cart) {
      return res.status(404).json({ message: "장바구니를 찾을 수 없습니다." });
    }

    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 장바구니에 상품 추가
const addCartItem = async (req, res) => {
  try {
    const { product, quantity } = req.body;
    const addQuantity = Number(quantity ?? 1);

    if (!product) {
      return res.status(400).json({ message: "상품 id는 필수입니다." });
    }

    if (!Number.isInteger(addQuantity) || addQuantity < 1) {
      return res.status(400).json({ message: "수량은 1 이상의 정수여야 합니다." });
    }

    const found = await Product.findById(product);
    if (!found) {
      return res.status(404).json({ message: "존재하지 않는 상품입니다." });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product, quantity: addQuantity }],
      });
    } else {
      const item = cart.items.find((entry) => String(entry.product) === String(product));
      if (item) {
        item.quantity += addQuantity;
      } else {
        cart.items.push({ product, quantity: addQuantity });
      }
      await cart.save();
    }

    const result = await Cart.findById(cart._id).populate("items.product");
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 장바구니 삭제
const deleteCart = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);

    if (!cart) {
      return res.status(404).json({ message: "장바구니를 찾을 수 없습니다." });
    }

    if (!isOwner(cart, req.user)) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    await cart.deleteOne();

    res.json({ message: "장바구니가 삭제되었습니다." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createCart,
  getCarts,
  getCartById,
  updateCart,
  addCartItem,
  deleteCart,
};
