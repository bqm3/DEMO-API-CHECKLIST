module.exports = (app) => {
    const ent_duan = require("../controllers/ent_duan.controller.js");
    const {isAuthenticated, isAdmin}= require('../middleware/auth_middleware.js');

    var router = require("express").Router();
  
    router.post("/create",[isAuthenticated, isAdmin], ent_duan.create);
    router.get("/",[isAuthenticated], ent_duan.get);
    router.get("/web",[isAuthenticated], ent_duan.getKhuvucByDuan);

    router.get("/thong-tin-du-an",[isAuthenticated], ent_duan.getThongtinduan);
   
    router.get("/:id",[isAuthenticated], ent_duan.getDetail);
    router.put("/update/:id",[isAuthenticated], ent_duan.update);
    router.put("/delete/:id",[isAuthenticated], ent_duan.delete);
  
    app.use("/api/ent_duan", router);
  };