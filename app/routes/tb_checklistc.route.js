const multer = require("multer");
const upload = multer();

module.exports = (app) => {
  const tb_checklistc = require("../controllers/tb_checklistc.controller.js");
  const { isAuthenticated } = require("../middleware/auth_middleware.js");
  const uploader = require("../config/cloudinary.config");

  var router = require("express").Router();

  router.post(
    "/create",
    [isAuthenticated],
    tb_checklistc.createFirstChecklist
  );

  router.get(
    "/ca/:id",
    [isAuthenticated],
    tb_checklistc.checklistCalv
  );

  router.get(
    "/ca-dinh-ky/:id",
    [isAuthenticated],
    tb_checklistc.checklistCalvDinhKy
  );

  router.get("/top3", tb_checklistc.top3kythuatMaxMin);
  router.get("/list-checklist-error", tb_checklistc.getChecklistsErrorFromYesterday);
  router.get("/list-project-none", tb_checklistc.getProjectsChecklistStatus);
  router.get("/list-checklist-error-project", [isAuthenticated], tb_checklistc.getChecklistsErrorFromWeek)
  router.get("/list-checklist", [isAuthenticated], tb_checklistc.getChecklistsError)
  
  router.get("/year", [isAuthenticated], tb_checklistc.checklistYear);
  router.get("/percent", [isAuthenticated], tb_checklistc.checklistPercent);
  router.get("/", [isAuthenticated], tb_checklistc.getCheckListc);
  router.get("/:id", [isAuthenticated], tb_checklistc.getDetail);
  router.put("/close/:id", [isAuthenticated], tb_checklistc.close);
  router.put("/open/:id", [isAuthenticated], tb_checklistc.open);
  router.get("/update-tongC/:id1/:id2", tb_checklistc.updateTongC);
  router.put("/delete/:id", [isAuthenticated], tb_checklistc.delete);
  router.post("/baocao", [isAuthenticated], tb_checklistc.createExcelFile);
 
  router.post(
    "/update_images/:id",
    [isAuthenticated, upload.any()],
    tb_checklistc.checklistImages
  );

  app.use("/api/tb_checklistc", router);
};
