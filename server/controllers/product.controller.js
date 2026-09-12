const Product = require("../models/Product");

const isDuplicateSyu = (error) => error.code === 11000;

// 상품 생성
const createProduct = async (req, res) => {
  try {
    const { syu, name, price, category, image, description } = req.body;

    if (!syu || !name || price === undefined || !category || !image) {
      return res.status(400).json({
        message: "syu, 상품이름, 가격, 카테고리, 이미지는 필수입니다.",
      });
    }

    const exists = await Product.findOne({ syu });
    if (exists) {
      return res.status(400).json({ message: "이미 존재하는 syu입니다." });
    }

    const product = await Product.create({
      syu,
      name,
      price,
      category,
      image,
      description,
    });

    res.status(201).json(product);
  } catch (error) {
    if (isDuplicateSyu(error)) {
      return res.status(400).json({ message: "이미 존재하는 syu입니다." });
    }
    res.status(400).json({ message: error.message });
  }
};

const PRODUCT_PAGE_SIZE = 5;

// 상품 전체 조회 (5개씩 페이지네이션)
const getProducts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const requestedPage = Number(req.query.page) || 1;
    const page = requestedPage < 1 ? 1 : requestedPage;
    const limit = PRODUCT_PAGE_SIZE;
    const total = await Product.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const currentPage = Math.min(page, totalPages);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    res.json({
      products,
      page: currentPage,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 상품 하나 조회
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 상품 수정
const updateProduct = async (req, res) => {
  try {
    const allowed = ["syu", "name", "price", "category", "image", "description"];
    const update = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    if (update.syu) {
      const exists = await Product.findOne({
        syu: update.syu,
        _id: { $ne: req.params.id },
      });
      if (exists) {
        return res.status(400).json({ message: "이미 존재하는 syu입니다." });
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json(product);
  } catch (error) {
    if (isDuplicateSyu(error)) {
      return res.status(400).json({ message: "이미 존재하는 syu입니다." });
    }
    res.status(400).json({ message: error.message });
  }
};

// 상품 삭제
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json({ message: "상품이 삭제되었습니다." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
