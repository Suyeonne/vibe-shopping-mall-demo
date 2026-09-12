const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 유저 생성 (회원가입)
const createUser = async (req, res) => {
  try {
    // 요청 body에서 스키마 필드만 꺼냄
    const { email, name, password, address } = req.body;

    // 이미 가입된 이메일이면 저장하지 않음
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "이미 가입된 이메일입니다." });
    }

    // 비밀번호는 bcrypt로 암호화해서 저장
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 유저를 MongoDB에 저장
    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      user_type: "customer",
      address,
    });

    // 응답에서 비밀번호는 제거
    const result = user.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 로그인
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일 또는 비밀번호가 없으면 로그인 불가
    if (!email || !password) {
      return res.status(400).json({ message: "이메일과 비밀번호를 입력해 주세요." });
    }

    // 이메일로 유저를 찾음
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "존재하지 않는 이메일입니다." });
    }

    // 저장된 암호화 비밀번호와 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // JWT 토큰 발급
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // 응답에서 비밀번호는 제거
    const result = user.toObject();
    delete result.password;
    res.json({ message: "로그인 성공", token, user: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 토큰으로 현재 로그인한 유저 정보 조회
const getMe = async (req, res) => {
  try {
    // authMiddleware에서 넣은 토큰 정보로 유저를 찾음
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 유저 전체 조회
const getUsers = async (req, res) => {
  try {
    // 비밀번호를 제외하고 모든 유저를 가져옴
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 유저 하나 조회
const getUserById = async (req, res) => {
  try {
    // URL의 id로 유저를 찾음
    const user = await User.findById(req.params.id).select("-password");

    // 해당 유저가 없으면 404
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 유저 수정
const updateUser = async (req, res) => {
  try {
    // 스키마에 있는 필드만 수정 가능
    const allowed = ["email", "name", "password", "user_type", "address"];
    const update = {};

    // 요청에 들어온 값만 update 객체에 넣음
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    // 비밀번호가 바뀌면 암호화해서 저장
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select("-password");

    // 해당 유저가 없으면 404
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 유저 삭제
const deleteUser = async (req, res) => {
  try {
    // id에 해당하는 유저를 삭제
    const user = await User.findByIdAndDelete(req.params.id);

    // 해당 유저가 없으면 404
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
