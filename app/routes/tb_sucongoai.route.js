const multer = require("multer");
const upload = multer();

module.exports = (app) => {
  const tb_sucongoai = require("../controllers/tb_sucongoai.controller.js");
  const { isAuthenticated } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  // Create a new tb_sucongoai
  router.post("/create", [isAuthenticated, upload.any()], tb_sucongoai.create);

  app.use("/api/tb_sucongoai", router);
};
