module.exports = (app) => {
  const ent_toanha = require("../controllers/ent_toanha.controller.js");
  const {
    isAuthenticated,
    isAdmin,
  } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated, isAdmin], ent_toanha.create);
  router.get("/", [isAuthenticated], ent_toanha.get);
  router.get("/khuvuc/:id", [isAuthenticated], ent_toanha.getKhuvucByToanha);
  router.get("/:id", [isAuthenticated], ent_toanha.getDetail);
  router.put("/update/:id", [isAuthenticated], ent_toanha.update);
  router.put("/delete/:id", [isAuthenticated], ent_toanha.delete);

  app.use("/api/ent_toanha", router);
};
