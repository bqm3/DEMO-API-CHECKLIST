module.exports = (app) => {
  const ent_thietlapca = require("../controllers/ent_thietlapca.controller.js");
  const { isAuthenticated } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  // Create a new Ent_calv
  router.post("/create", [isAuthenticated], ent_thietlapca.create);
  
  app.use("/api/ent_thietlapca", router);
};
