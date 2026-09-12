const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRouter = require("./routes/users");
const productRouter = require("./routes/products");
const cartRouter = require("./routes/carts");
const orderRouter = require("./routes/orders");

const app = express();

app.disable("etag");
app.use(cors());
app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/carts", cartRouter);
app.use("/api/orders", orderRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API를 찾을 수 없습니다." });
});

app.use((err, req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(500).json({ message: err.message || "서버 오류가 발생했습니다." });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;
const LOCAL_MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/shopping-mall";
const mongodbUri = (process.env.MONGODB_ATLAS_URL || "").trim() || LOCAL_MONGODB_URI;

mongoose
  .connect(mongodbUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection failed", err));

app.get("/", (req, res) => {
  res.send("shopping-mall server");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
