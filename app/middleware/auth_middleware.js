const jsonwebtoken = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const isAuthenticated = asyncHandler((req, res, next) => {
  // const token = req.cookies.token;
  const tokenFromClient =
    req.body.token || req.query.token || req.headers["authorization"];

  if (!tokenFromClient) {
    return res.status(401).json({ message: "Chưa cung cấp token" });
  }

  const bearerToken = tokenFromClient.split(" ")[1];
  jsonwebtoken.verify(bearerToken, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: `Token không hợp lệ ${err}` });
    }

    req.user = user;
    next();
  });
});

const isAdmin = asyncHandler((req, res, next) => {
  const { ID_Chucvu } = req.user.data;

  if (ID_Chucvu !== 1 && ID_Chucvu !== 2)
    return res.status(401).json({
      success: false,
      message: "Không có quyền truy cập",
    });
  next();
});

const isRoleKST = asyncHandler((req, res, next) => {
  const { ID_Chucvu } = req.user.data;

  if (ID_Chucvu !== 3)
    return res.status(401).json({
      success: false,
      message: "Chỉ kỹ sư trưởng mới có quyền thực hiện",
    });
  next();
});

module.exports = { isAuthenticated, isAdmin, isRoleKST };
