
module.exports = (app) => {
  const ent_chucvu = require("../controllers/ent_chucvu.controller.js");
  const { isAuthenticated,isAdmin } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated, isAdmin], ent_chucvu.create);
  router.get("/", isAuthenticated, ent_chucvu.get);
  router.get("/:id", isAuthenticated, ent_chucvu.getDetail);

  app.use("/api/ent_chucvu", router);
};
