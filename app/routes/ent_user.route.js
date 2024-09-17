module.exports = (app) => {
    const ent_user = require("../controllers/ent_user.controller.js");
    const {isAuthenticated, isAdmin}= require('../middleware/auth_middleware.js');
  
    var router = require("express").Router();
  
    router.post("/login", ent_user.login);
    router.get("/get-online",[isAuthenticated,isAdmin], ent_user.getUserOnline);
    router.get("/gs",[isAuthenticated], ent_user.getGiamSat);
    router.get("/:id",[isAuthenticated, isAdmin], ent_user.getDetail);
    router.post("/check-auth",[isAuthenticated], ent_user.checkAuth);
    router.post("/device-token",[isAuthenticated], ent_user.deviceToken);
    router.post("/register", [isAuthenticated],ent_user.register);
    router.post("/change-password",[isAuthenticated], ent_user.changePassword);
    router.put("/delete/:id",[isAuthenticated, isAdmin], ent_user.deleteUser);
    router.put("/update/:id",[isAuthenticated, isAdmin], ent_user.updateUser);
    router.post("/noti",[isAuthenticated], ent_user.notiPush);
   
    app.use("/api/ent_user", router);
  };