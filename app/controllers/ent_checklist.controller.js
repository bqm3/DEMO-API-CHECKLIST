const sequelize = require("../config/db.config");
const xlsx = require("xlsx");
const {
  Ent_checklist,
  Ent_khuvuc,
  Ent_tang,
  Ent_user,
  Ent_chucvu,
  Ent_toanha,
  Ent_khoicv,
  Ent_duan,
  Ent_hangmuc,
  Tb_checklistchitiet,
  Tb_checklistchitietdone,
  Tb_checklistc,
  Ent_calv,
  Ent_khuvuc_khoicv,
} = require("../models/setup.model");
const { Op, Sequelize } = require("sequelize");

exports.create = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      if (!req.body.Checklist || !req.body.Giatrinhan || !req.body.ID_Hangmuc) {
        res.status(400).json({
          message: "Phải nhập đầy đủ dữ liệu!",
        });
        return;
      }
      const sCalv = req.body.sCalv;

      const data = {
        ID_Khuvuc: req.body.ID_Khuvuc,
        ID_Tang: req.body.ID_Tang,
        ID_Hangmuc: req.body.ID_Hangmuc,
        Sothutu: req.body.Sothutu || 0,
        Maso: req.body.Maso || "",
        MaQrCode: req.body.MaQrCode || "",
        Checklist: req.body.Checklist,
        Ghichu: req.body.Ghichu || "",
        Tieuchuan: req.body.Tieuchuan || "",
        Giatridinhdanh:
          req.body.Giatridinhdanh || req.body.Giatrinhan.split("/")[0] || "",
        Giatrinhan: req.body.Giatrinhan || "",
        ID_User: userData.ID_User,
        sCalv: sCalv ? sCalv : null,
        calv_1: sCalv[0] || null,
        calv_2: sCalv[1] || null,
        calv_3: sCalv[2] || null,
        calv_4: sCalv[3] || null,
        isDelete: 0,
        Tinhtrang: 0,
        isImportant: req.body.isImportant || 0,
        isCheck: req.body.isCheck,
      };

      Ent_checklist.create(data)
        .then(async (data) => {
          res.status(200).json({
            message: "Tạo checklist thành công!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.get = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const page = parseInt(req.query.page) || 1;
    // const pageSize = 500;
    const pageSize = parseInt(req.query.limit) || 100; // Số lượng phần tử trên mỗi trang
    const offset = (page - 1) * pageSize;

    const orConditions = [];
    if (userData) {
      orConditions.push({
        "$ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
      });
    }

    const totalCount = await Ent_checklist.count({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "ID_User",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: {
        isDelete: 0,
        [Op.and]: [orConditions],
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    const data = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Tang",
        "ID_Hangmuc",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "sCalv",
        "Tinhtrang",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "ID_User",
        "isImportant",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: {
        isDelete: 0,
        [Op.and]: [orConditions],
      },
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
      ],
      offset: offset,
      limit: pageSize,
    });

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = data.filter((item) => item.ent_khuvuc !== null);

    if (filteredData.length > 0) {
      return res.status(200).json({
        message: "Danh sách checklist!",
        page: page,
        pageSize: pageSize,
        totalPages: totalPages,
        totalCount: totalCount,
        data: filteredData,
      });
    } else {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      await Ent_checklist.findByPk(req.params.id, {
        attributes: [
          "ID_Checklist",
          "ID_Khuvuc",
          "ID_Tang",
          "ID_Hangmuc",
          "Sothutu",
          "Maso",
          "MaQrCode",
          "Checklist",
          "Ghichu",
          "Tieuchuan",
          "Giatridinhdanh",
          "isCheck",
          "Giatrinhan",
          "sCalv",
          "calv_1",
          "calv_2",
          "calv_3",
          "calv_4",
          "ID_User",
          "isDelete",
          "isImportant",
          "Tinhtrang",
        ],
        include: [
          {
            model: Ent_hangmuc,
            attributes: [
              "Hangmuc",
              "Tieuchuankt",
              "ID_Khuvuc",
              "MaQrCode",
              "FileTieuChuan",
            ],
          },
          {
            model: Ent_khuvuc,
            attributes: [
              "Tenkhuvuc",
              "MaQrCode",
              "Makhuvuc",
              "Sothutu",
              "ID_Toanha",
              "ID_Khuvuc",
            ],
            include: [
              {
                model: Ent_toanha,
                attributes: ["Toanha", "ID_Toanha"],
                include: {
                  model: Ent_duan,
                  attributes: [
                    "ID_Duan",
                    "Duan",
                    "Diachi",
                    "Vido",
                    "Kinhdo",
                    "Logo",
                  ],
                  where: { ID_Duan: userData.ID_Duan },
                },
              },
              {
                model: Ent_khuvuc_khoicv,
                attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
                include: [
                  {
                    model: Ent_khoicv,
                    attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                  },
                ],
              },
            ],
          },
          {
            model: Ent_tang,
            attributes: ["Tentang"],
          },
          {
            model: Ent_user,
            include: {
              model: Ent_chucvu,
              attributes: ["Chucvu"],
            },
            attributes: ["UserName", "Email"],
          },
        ],
        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          if (data) {
            res.status(200).json({
              message: "Checklist chi tiết!",
              data: data,
            });
          } else {
            res.status(400).json({
              message: "Không có checklist cần tìm!",
            });
          }
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      if (!req.body.Giatrinhan || !req.body.Checklist) {
        return res.status(400).json({
          message: "Cần nhập đầy đủ thông tin!",
        });
      }

      // Chuẩn bị dữ liệu để cập nhật
      const reqData = {
        ID_Khuvuc: req.body.ID_Khuvuc,
        ID_Tang: req.body.ID_Tang,
        ID_Hangmuc: req.body.ID_Hangmuc,
        Sothutu: req.body.Sothutu,
        Maso: req.body.Maso,
        MaQrCode: req.body.MaQrCode,
        Checklist: req.body.Checklist,
        Ghichu: req.body.Ghichu || "",
        Giatridinhdanh: req.body.Giatridinhdanh || "",
        Giatrinhan: req.body.Giatrinhan || "",
        isCheck: req.body.isCheck,
        Tieuchuan: req.body.Tieuchuan || "",
        // sCalv: JSON.stringify(validCalv) || null,
        // calv_1: JSON.stringify(validCalv[0]) || null,
        // calv_2: JSON.stringify(validCalv[1]) || null,
        // calv_3: JSON.stringify(validCalv[2]) || null,
        // calv_4: JSON.stringify(validCalv[3]) || null,
        isDelete: 0,
        isImportant: req.body.isImportant || 0,
      };

      // Thực hiện cập nhật dữ liệu
      Ent_checklist.update(reqData, {
        where: {
          ID_Checklist: req.params.id,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật checklist thành công!",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      Ent_checklist.update(
        { isDelete: 1 },
        {
          where: {
            ID_Checklist: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa checklist thành công!",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.deleteMul = async (req, res) => {
  try {
    const userData = req.user.data;
    const deleteRows = req.body;
    const idsToDelete = deleteRows.map((row) => row.ID_Checklist);
    if (userData) {
      Ent_checklist.update(
        { isDelete: 1 },
        {
          where: {
            ID_Checklist: idsToDelete,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa checklist thành công!",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// filter data
exports.getFilter = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Khuvuc = req.body.ID_Khuvuc;
    const ID_Tang = req.body.ID_Tang;
    const ID_Toanha = req.body.ID_Toanha;
    const orConditions = [];

    const ID_KhoiCV = req.params.id;
    const ID_Calv = req.params.id_calv;
    const ID_ChecklistC = req.params.idc;
    const ID_Hangmuc = req.params.id_hm;

    if (userData) {
      if (ID_Khuvuc !== null && ID_Khuvuc !== undefined) {
        orConditions.push({ ID_Khuvuc: ID_Khuvuc });
      }

      if (ID_Hangmuc !== null) {
        orConditions.push({ ID_Hangmuc: ID_Hangmuc });
      }

      if (ID_Tang !== null) {
        orConditions.push({ ID_Tang: ID_Tang });
      }

      if (ID_Toanha !== null) {
        orConditions.push({ "$ent_khuvuc.ent_toanha.ID_Toanha$": ID_Toanha });
      }

      const checklistItems = await Tb_checklistchitiet.findAll({
        attributes: ["ID_Checklist", "isDelete", "ID_ChecklistC"],
        where: { isDelete: 0 },
      });

      const checklistDoneItems = await Tb_checklistchitietdone.findAll({
        attributes: ["Description", "isDelete", "ID_ChecklistC"],
        where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
      });

      const arrPush = [];
      checklistDoneItems.forEach((item) => {
        const idChecklists = item.Description.split(",").map(Number);
        if (idChecklists.length > 0) {
          idChecklists.map((it) => {
            if (Number(item.ID_ChecklistC) === Number(req.params.idc)) {
              arrPush.push({
                ID_ChecklistC: parseInt(item.ID_ChecklistC),
                ID_Checklist: it,
                Gioht: item.Gioht,
              });
            }
          });
        }
      });
      // // Duyệt qua từng phần tử trong mảng checklistDoneItems

      const checklistIds = checklistItems.map((item) => item.ID_Checklist);
      const checklistDoneIds = arrPush.map((item) => item.ID_Checklist);

      let whereCondition = {
        isDelete: 0,
      };
      whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;

      if (
        checklistIds &&
        Array.isArray(checklistIds) &&
        checklistIds.length > 0 &&
        checklistDoneIds &&
        checklistDoneIds.length > 0
      ) {
        whereCondition.ID_Checklist = {
          [Op.notIn]: [...checklistIds, ...checklistDoneIds],
        };
      } else if (
        checklistIds &&
        Array.isArray(checklistIds) &&
        checklistIds.length > 0
      ) {
        whereCondition.ID_Checklist = {
          [Op.notIn]: checklistIds,
        };
      } else if (checklistDoneIds && checklistDoneIds.length > 0) {
        whereCondition.ID_Checklist = {
          [Op.notIn]: checklistDoneIds,
        };
      }

      await Ent_checklist.findAll({
        attributes: [
          "ID_Checklist",
          "ID_Khuvuc",
          "ID_Tang",
          "ID_Hangmuc",
          "Sothutu",
          "Maso",
          "MaQrCode",
          "Checklist",
          "Ghichu",
          "Tieuchuan",
          "Giatridinhdanh",
          "isCheck",
          "Giatrinhan",
          "ID_User",
          "isDelete",
          "isImportant",
        ],
        include: [
          {
            model: Ent_hangmuc,
            attributes: [
              "Hangmuc",
              "Tieuchuankt",
              "ID_Khuvuc",
              "MaQrCode",
              "ID_KhoiCV",
              "FileTieuChuan",
            ],
          },
          {
            model: Ent_khuvuc,
            attributes: [
              "ID_Toanha",
              "ID_Khuvuc",
              "Sothutu",
              "MaQrCode",
              "ID_KhoiCVs",
              "Tenkhuvuc",
              "ID_User",
              "isDelete",
            ],
            where: {
              isDelete: 0,
            },
            include: [
              {
                model: Ent_khuvuc_khoicv,
                attributes: ["ID_KV_CV", "ID_Khuvuc", "ID_KhoiCV"],
                include: [
                  {
                    model: Ent_khoicv,
                    attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                  },
                ],
              },
              {
                model: Ent_toanha,
                attributes: [
                  "ID_Toanha",
                  "ID_Duan",
                  "Toanha",
                  "Sotang",
                  "isDelete",
                ],
                where: {
                  isDelete: 0,
                },
              },
            ],
          },
          {
            model: Ent_tang,
            attributes: ["Tentang"],
          },
          {
            model: Ent_user,
            include: {
              model: Ent_chucvu,
              attributes: ["Chucvu"],
            },
            attributes: ["UserName", "Email"],
          },
        ],
        where: {
          isDelete: 0,
          [Op.and]: [orConditions, whereCondition],
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Thông tin khu vực!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    } else {
      // Trả về lỗi nếu không có dữ liệu người dùng hoặc không có ID được cung cấp
      return res.status(400).json({
        message: "Vui lòng cung cấp ít nhất một trong hai ID.",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.deleteChecklists = async (req, res) => {
  try {
    const ids = req.params.ids.split(",");
    const userData = req.user.data;

    if (ids && userData) {
      Ent_checklist.update(
        { isDelete: 1 },
        {
          where: {
            ID_Checklist: ids,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa checklist thành công!",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// get data
exports.getChecklist = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_KhoiCV = req.params.id;
    const ID_ChecklistC = req.params.idc;
    const ID_Calv = req.params.id_calv;
    const ID_Hangmuc = req.params.id_hm;
    if (!userData || !ID_KhoiCV) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }
    // const pageMaxSize =
    const checklistItems = await Tb_checklistchitiet.findAll({
      attributes: ["isDelete", "ID_Checklist"],
      where: { isDelete: 0 },
    });

    const checklistDoneItems = await Tb_checklistchitietdone.findAll({
      attributes: ["Description", "isDelete", "ID_ChecklistC"],
      where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
    });

    const arrPush = [];
    checklistDoneItems.forEach((item) => {
      const idChecklists = item.Description.split(",").map(Number);
      if (idChecklists.length > 0) {
        idChecklists.map((it) => {
          if (Number(item.ID_ChecklistC) === Number(req.params.idc)) {
            arrPush.push({
              ID_ChecklistC: parseInt(item.ID_ChecklistC),
              ID_Checklist: it,
              Gioht: item.Gioht,
            });
          }
        });
      }
    });

    const checklistIds = checklistItems.map((item) => item?.ID_Checklist) || [];
    const checklistDoneIds = arrPush.map((item) => item?.ID_Checklist) || [];

    let whereCondition = {
      isDelete: 0,
      [Op.or]: { sCalv: { [Op.like]: `%${ID_Calv}%` } },
    };

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;
    // whereCondition["$ent_hangmuc.ID_KhoiCV$"] = userData?.ID_KhoiCV;

    if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds &&
      checklistDoneIds.length > 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: [...checklistIds, ...checklistDoneIds],
      };
    } else if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds.length === 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistIds,
      };
    } else if (
      checklistDoneIds &&
      checklistDoneIds.length > 0 &&
      checklistIds.length == 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistDoneIds,
      };
    }

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "ID_User",
        "sCalv",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
        "isImportant",
      ],
      include: [
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
              where: {
                ID_KhoiCV: userData?.ID_KhoiCV,
              },
            },
          ],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = checklistData.filter(
      (item) => item.ent_hangmuc !== null
    );

    return res.status(200).json({
      message:
        filteredData.length > 0
          ? "Danh sách checklist!"
          : "Không còn checklist cho ca làm việc này!",
      length: filteredData.length,
      data: filteredData,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// get data filter search
exports.getFilterSearch = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const ID_Khuvuc = req.body.ID_Khuvuc;
    const ID_Tang = req.body.ID_Tang;
    const ID_Hangmuc = req.body.ID_Hangmuc;

    const page = parseInt(req.query.page) || 1;
    // const pageSize = 500;
    const pageSize = parseInt(req.query.limit) || 100; // Số lượng phần tử trên mỗi trang
    const offset = (page - 1) * pageSize;

    const orConditions = [];
    if (userData) {
      orConditions.push({
        "$ent_hangmuc.ent_khuvuc.ent_toanha.ID_Duan$": userData.ID_Duan,
      });
    }

    if (ID_Khuvuc !== null) {
      orConditions.push({
        "$ent_hangmuc.ent_khuvuc.ID_Khuvuc$": ID_Khuvuc,
      });
    }

    if (ID_Tang !== null) {
      orConditions.push({
        ID_Tang: ID_Tang,
      });
    }

    if (ID_Hangmuc !== null) {
      orConditions.push({
        ID_Hangmuc: ID_Hangmuc,
      });
    }

    const totalCount = await Ent_checklist.count({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Tang",
        "ID_Hangmuc",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "ID_User",
        "isDelete",
        "isImportant",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: {
        isDelete: 0,
        [Op.and]: [orConditions],
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    const data = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "ID_User",
        "isDelete",
        "isImportant",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: {
        isDelete: 0,
        [Op.and]: [orConditions],
      },
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
      offset: offset,
      limit: pageSize,
    });

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = data.filter((item) => item.ent_khuvuc !== null);

    if (filteredData.length > 0) {
      return res.status(200).json({
        message: "Danh sách checklist!",
        page: page,
        pageSize: pageSize,
        totalPages: totalPages,
        data: filteredData,
      });
    } else {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.filterChecklists = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_ChecklistC = req.params.idc;
    const ID_Calv = req.params.id_calv;
    const ID_Hangmucs = req.body.dataHangmuc;

    const tbChecklist = await Tb_checklistc.findByPk(ID_ChecklistC, {
      attributes: ["ID_Hangmucs", "isDelete"],
      where: {
        isDelete: 0,
      },
    });

    const checklistItems = await Tb_checklistchitiet.findAll({
      attributes: ["isDelete", "ID_Checklist", "ID_ChecklistC"],
      where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
    });

    const checklistDoneItems = await Tb_checklistchitietdone.findAll({
      attributes: ["Description", "isDelete", "ID_ChecklistC"],
      where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
    });

    const arrPush = [];
    checklistDoneItems.forEach((item) => {
      const idChecklists = item.Description.split(",").map(Number);
      if (idChecklists.length > 0) {
        idChecklists.map((it) => {
          if (Number(item.ID_ChecklistC) === Number(req.params.idc)) {
            arrPush.push({
              ID_ChecklistC: parseInt(item.ID_ChecklistC),
              ID_Checklist: it,
              Gioht: item.Gioht,
            });
          }
        });
      }
    });

    const checklistIds =
      checklistItems
        .map((item) => item?.ID_Checklist)
        .filter((id) => !isNaN(id)) || [];

    const checklistDoneIds = arrPush
      .map((item) => item?.ID_Checklist) // Map to extract IDs
      .filter((id) => !isNaN(id));

    let whereCondition = {
      isDelete: 0,
      ID_Hangmuc: {
        [Op.in]: ID_Hangmucs,
      },
    };

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;
    // whereCondition["$ent_hangmuc.ID_KhoiCV$"] = userData?.ID_KhoiCV;

    if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds &&
      checklistDoneIds.length > 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: [...checklistIds, ...checklistDoneIds],
      };
    } else if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds.length === 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistIds,
      };
    } else if (
      checklistDoneIds &&
      checklistDoneIds.length > 0 &&
      checklistIds.length == 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistDoneIds,
      };
    }

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "isImportant",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "Tinhtrang",
        "ID_User",
        "sCalv",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Hangmuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
          where: {
            ID_Hangmuc: {
              [Op.in]: tbChecklist.ID_Hangmucs,
            },
          },
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
              where: {
                ID_KhoiCV: userData?.ID_KhoiCV,
              },
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = checklistData.filter(
      (item) => item.ent_hangmuc !== null
    );

    return res.status(200).json({
      message:
        filteredData.length > 0
          ? "Danh sách checklist!"
          : "Không còn checklist cho ca làm việc này!",
      length: filteredData.length,
      data: filteredData,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.filterReturn = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_ChecklistC = req.params.idc;
    const ID_ThietLapCa = req.params.id_calv;

    const tbChecklist = await Tb_checklistc.findByPk(ID_ChecklistC, {
      attributes: ["ID_Hangmucs", "isDelete", "ID_ThietLapCa"],
      where: {
        isDelete: 0,
        ID_ThietLapCa: ID_ThietLapCa,
      },
    });

    let whereCondition = {
      isDelete: 0,
    };

    if (
      Array.isArray(tbChecklist.ID_Hangmucs) &&
      tbChecklist.ID_Hangmucs.length > 0
    ) {
      whereCondition.ID_Hangmuc = {
        [Op.in]: tbChecklist.ID_Hangmucs,
      };
    }

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "isImportant",
        "Tinhtrang",
        "ID_User",
        "sCalv",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = checklistData.filter(
      (item) => item.ent_hangmuc !== null
    );

    return res.status(200).json({
      message:
        filteredData.length > 0
          ? "Danh sách checklist!"
          : "Không còn checklist cho ca làm việc này!",
      length: filteredData.length,
      data: filteredData,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getListChecklistWeb = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const whereCondition = {
      isDelete: 0
    }

    if(userData){
      whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;
    }

    const data = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Tang",
        "ID_Hangmuc",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isImportant",
        "isCheck",
        "Giatrinhan",
        "sCalv",
        "Tinhtrang",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "ID_User",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_KhoiCVs",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha", "ID_Duan"],
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KV_CV", "ID_Khuvuc", "ID_KhoiCV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
      ],
    });

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }
    return res.status(200).json({
      message: "Danh sách checklist!",
      data: data,
    });
   
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getChecklistTotal = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereCondition = {
      isDelete: 0,
    };

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "isImportant",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "ID_User",
        "sCalv",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
            "ID_KhoiCVs",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KV_CV", "ID_Khuvuc", "ID_KhoiCV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: whereCondition,
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    // Filter data
    const filteredData = checklistData.filter(
      (item) => item.ent_hangmuc !== null
    );

    const khoiCVData = [
      { ID_KhoiCV: 1, KhoiCV: "Khối làm sạch" },
      { ID_KhoiCV: 2, KhoiCV: "Khối kỹ thuật" },
      { ID_KhoiCV: 3, KhoiCV: "Khối bảo vệ" },
      { ID_KhoiCV: 4, KhoiCV: "Khối dịch vụ" },
    ];

    // Create a map for quick lookup of KhoiCV by ID_Khoi
    const khoiCVMap = {};
    khoiCVData.forEach((item) => {
      khoiCVMap[item.ID_KhoiCV] = item.KhoiCV;
    });

    // Count checklists by ID_KhoiCV
    const checklistCounts = {};
    filteredData.forEach((item) => {
      let ID_KhoiCVs = item.ent_khuvuc.ID_KhoiCVs;
      if (typeof ID_KhoiCVs === "string") {
        try {
          ID_KhoiCVs = JSON.parse(ID_KhoiCVs);
        } catch (error) {
          return;
        }
      }
      ID_KhoiCVs.forEach((id) => {
        const khoiCV = khoiCVMap[id];
        if (!checklistCounts[khoiCV]) {
          checklistCounts[khoiCV] = 0;
        }
        checklistCounts[khoiCV]++;
      });
    });

    // Convert counts to desired format
    const result = Object.keys(checklistCounts).map((khoiCV) => ({
      label: khoiCV,
      value: checklistCounts[khoiCV],
    }));

    return res.status(200).json({
      message:
        result.length > 0
          ? "Danh sách checklist!"
          : "Không còn checklist cho ca làm việc này!",
      length: result.length,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.uploadFiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const userData = req.user.data;

    // Read the uploaded Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    // Extract data from the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    await sequelize.transaction(async (transaction) => {
      const removeSpacesFromKeys = (obj) => {
        return Object.keys(obj).reduce((acc, key) => {
          const newKey = key?.replace(/\s+/g, "")?.toUpperCase();
          acc[newKey] = obj[key];
          return acc;
        }, {});
      };

      for (const [index, item] of data.entries()) {
        try {
          const transformedItem = removeSpacesFromKeys(item);
          const maQrHangmuc = transformedItem["MÃQRCODEHẠNGMỤC"];
          const tenHangmuc = transformedItem["TÊNHẠNGMỤC"];
          const tenTang = transformedItem["TÊNTẦNG"];
          const tenKhoiCongViec = transformedItem["TÊNKHỐICÔNGVIỆC"];
          const sttChecklist = transformedItem["STT"];
          const maChecklist = transformedItem["MÃCHECKLIST"];
          const tenChecklist = transformedItem["TÊNCHECKLIST"];
          const tieuChuanChecklist = transformedItem["TIÊUCHUẨNCHECKLIST"];
          const giaTriDanhDinh = transformedItem["GIÁTRỊĐỊNHDANH"];
          const cacGiaTriNhan = transformedItem["CÁCGIÁTRỊNHẬN"];
          const quanTrong = transformedItem["QUANTRỌNG"];
          const ghiChu = transformedItem["GHICHÚ"];

          if (!tenChecklist ) {
            console.log("Bỏ qua do thiếu tên checklist");
            continue;
          }

          if (!tenTang) {
            console.log("Bỏ qua do thiếu tên tầng");
            continue;
          }

          const hangmuc = await Ent_hangmuc.findOne({
            attributes: [
              "Hangmuc",
              "Tieuchuankt",
              "ID_Khuvuc",
              "MaQrCode",
              "FileTieuChuan",
              "ID_Hangmuc",
              "isDelete",
            ],
            include: [
              {
                model: Ent_khuvuc,
                attributes: [
                  "ID_Toanha",
                  "ID_Khuvuc",
                  "ID_KhoiCVs",
                  "Sothutu",
                  "MaQrCode",
                  "Tenkhuvuc",
                  "ID_User",
                  "isDelete",
                ],
                where: {
                  isDelete: 0,
                },
              },
            ],
            where: {
              MaQrCode: maQrHangmuc,
              Hangmuc: tenHangmuc,
              isDelete: 0,
            },
            transaction,
          });

          const tang = await Ent_tang.findOne({
            attributes: ["Tentang", "ID_Tang", "ID_Duan", "isDelete"],
            where: {
              Tentang: sequelize.where(
                sequelize.fn(
                  "UPPER",
                  sequelize.fn("TRIM", sequelize.col("Tentang"))
                ),
                "LIKE",
                tenTang.trim().toUpperCase()
              ),
              ID_Duan: userData.ID_Duan,
              isDelete: 0,
            },
            transaction,
          });

          const data = {
            ID_Khuvuc: hangmuc.ID_Khuvuc,
            ID_Tang: tang.ID_Tang,
            ID_Hangmuc: hangmuc.ID_Hangmuc,
            Sothutu: sttChecklist || 1,
            Maso: maChecklist || "",
            MaQrCode: maChecklist || "",
            Checklist: tenChecklist,
            Ghichu: ghiChu || "",
            Tieuchuan: tieuChuanChecklist || "",
            Giatridinhdanh: giaTriDanhDinh || "",
            Giatrinhan: cacGiaTriNhan || "",
            isImportant: quanTrong !== undefined ? 1 : 0,
            ID_User: userData.ID_User,

            isDelete: 0,
            Tinhtrang: 0,
          };

          const existingChecklist = await Ent_checklist.findOne({
            attributes: [
              "ID_Checklist",
              "ID_Khuvuc",
              "ID_Tang",
              "ID_Hangmuc",
              "Sothutu",
              "Maso",
              "MaQrCode",
              "Checklist",
              "Ghichu",
              "Tieuchuan",
              "Giatridinhdanh",
              "isImportant",
              "isCheck",
              "Giatrinhan",
              "sCalv",
              "Tinhtrang",
              "calv_1",
              "calv_2",
              "calv_3",
              "calv_4",
              "ID_User",
              "isDelete",
            ],
            where: {
              ID_Khuvuc: hangmuc.ID_Khuvuc,
              ID_Tang: tang.ID_Tang,
              ID_Hangmuc: hangmuc.ID_Hangmuc,
              Checklist: tenChecklist,
              isDelete: 0,
            },
            transaction,
          });

          // Nếu checklist đã tồn tại thì bỏ qua
          if (!existingChecklist) {
            await Ent_checklist.create(data, { transaction });
          } else {
            console.log(`Checklist đã có ở dòng ${index + 1}`);
          }
        } catch (error) {
          throw new Error(`Lỗi ở dòng ${index + 1}: ${error.message}`);
        }
      }
    });

    res.send({
      message: "Upload dữ liệu thành công",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};
