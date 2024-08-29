const multer = require("multer");
const upload = multer();

module.exports = (app) => {
  const ent_checklist = require("../controllers/ent_checklist.controller.js");
  const { isAuthenticated } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated], ent_checklist.create);
  router.get("/", [isAuthenticated], ent_checklist.get);
  router.get("/web", [isAuthenticated], ent_checklist.getListChecklistWeb)
  router.get("/total", [isAuthenticated], ent_checklist.getChecklistTotal)

  router.get("/:id", [isAuthenticated], ent_checklist.getDetail);
  router.get("/:id/:idc/:id_calv/:id_hm", [isAuthenticated], ent_checklist.getChecklist);
  router.post("/filter/:id/:idc/:id_calv/:id_hm", [isAuthenticated], ent_checklist.getFilter);
  router.post("/filter/", [isAuthenticated], ent_checklist.getFilterSearch);
  
  router.put("/update/:id", [isAuthenticated], ent_checklist.update);
  router.put("/delete/:id", [isAuthenticated], ent_checklist.delete);
  router.put(
    "/delete-all/:ids",
    isAuthenticated,
    ent_checklist.deleteChecklists
  );
  router.put(
    "/filter-mul/:idc/:id_calv",
    isAuthenticated,
    ent_checklist.filterChecklists
  );

  router.put(
    "/filter/:idc/:id_calv",
    isAuthenticated,
    ent_checklist.KhuvucChecklists
  );
  router.post("/uploads", [isAuthenticated, upload.single('files')], ent_checklist.uploadFiles)

  app.use("/api/ent_checklist", router);
};
