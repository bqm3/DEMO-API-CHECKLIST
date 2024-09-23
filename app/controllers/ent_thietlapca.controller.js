const {
  Ent_toanha,
  Ent_khuvuc,
  Ent_khoicv,
  Ent_duan,
  Ent_hangmuc,
  Ent_tang,
  Ent_checklist,
  Ent_khuvuc_khoicv,
  Ent_thietlapca,
  Ent_calv,
  Ent_duan_khoicv,
} = require("../models/setup.model");
const { Op, Sequelize, fn, col, literal, where } = require("sequelize");
const sequelize = require("../config/db.config");
const xlsx = require("xlsx");

exports.create = async (req, res) => {
  try {
    const userData = req.user.data;
    const { Ngaythu, ID_Calv, Sochecklist, ID_Hangmucs } = req.body;

    if (!ID_Calv || !ID_Hangmucs) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
    }

    const findKhuvuc = await Ent_thietlapca.findOne({
      attributes: [
        "ID_Duan",
        "ID_Calv",
        "Ngaythu",
        "ID_Hangmucs",
        "Sochecklist",
        "ID_ThietLapCa",
        "isDelete",
      ],
      where: {
        ID_Calv: ID_Calv,
        Ngaythu: Ngaythu,
        isDelete: 0
      }
    })

    const checklistCount = await Ent_checklist.count({
      where: {
        ID_Hangmuc: {
          [Op.in]: ID_Hangmucs, // Assuming ID_Hangmucs is an array
        },
      },
    });

    if(findKhuvuc){
      return res.status(400).json({
        message: "Ca làm việc và ngày thực hiện đã tồn tại",
      });
    }

    if (userData) {
      const data = {
        Ngaythu: Ngaythu,
        Sochecklist: Sochecklist,
        ID_Hangmucs: ID_Hangmucs,
        Sochecklist: checklistCount,
        ID_Calv: ID_Calv,
        ID_Duan: userData.ID_Duan,
      };
      // Tạo khu vực mới
      const newKhuvuc = await Ent_thietlapca.create(data);

      return res.status(200).json({
        message: "Thiết lập ca thành công !",
        data: newKhuvuc,
      });
    }
  } catch (err) {
    console.error(err); // Log lỗi để giúp chẩn đoán vấn đề
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.get = async (req, res) => {
  try {
    const userData = req.user.data;
    let whereCondition = {
      isDelete: 0,
      ID_Duan: userData?.ID_Duan,
    };
    if (userData) {
      await Ent_thietlapca.findAll({
        attributes: [
          "ID_Duan",
          "ID_Calv",
          "Ngaythu",
          "Sochecklist",
          "ID_Hangmucs",
          "ID_ThietLapCa",
          "isDelete",
        ],
        include: [
          {
            model: Ent_calv,
            attributes: ["Tenca", "ID_KhoiCV", "ID_Calv"],
            include: [
              {
                model: Ent_khoicv,
                attributes: ["KhoiCV", "Ngaybatdau", "Chuky", "ID_KhoiCV"],
                order: [["ID_KhoiCV", "ASC"]],
              },
            ],
          },
          {
            model: Ent_duan,
            attributes: ["Duan"],
          },
        ],
        where: whereCondition,
        order: [["Ngaythu", "ASC"]],
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách thiết lập ca!",
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

exports.getDetail = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_ThietLapCa = req.params.id;

    // Điều kiện để tìm kiếm theo ID_ThietLapCa
    let whereCondition = {
      isDelete: 0,
      ID_Duan: userData?.ID_Duan,
    };

    if (userData) {
      // Truy vấn để lấy dữ liệu từ Ent_thietlapca
      const thietlapca = await Ent_thietlapca.findByPk(ID_ThietLapCa, {
        attributes: [
          "ID_Duan",
          "ID_Calv",
          "Ngaythu",
          "ID_Hangmucs",
          "Sochecklist",
          "ID_ThietLapCa",
          "isDelete",
        ],
        include: [
          {
            model: Ent_calv,
            attributes: ["Tenca", "ID_KhoiCV"],
          },
          {
            model: Ent_duan,
            attributes: ["Duan", "Logo"],
            include: [
              {
                model: Ent_duan_khoicv,
                as: "ent_duan_khoicv",
                attributes: ["ID_KhoiCV", "ID_Duan", "Chuky", "Ngaybatdau"],
              }
            ]
          },
        ],
        where: whereCondition,
      });

      // Kiểm tra xem thietlapca có tồn tại không
      if (!thietlapca) {
        return res.status(404).json({
          message: "Không tìm thấy thiết lập ca với ID này.",
        });
      }

      // Truy vấn Ent_khuvuc dựa trên ID_Hangmucs lấy được từ thietlapca
      const khuvucData = await Ent_khuvuc.findAll({
        attributes: [
          "ID_Khuvuc",
          "ID_Toanha",
          "Sothutu",
          "ID_KhoiCVs",
          "Makhuvuc",
          "MaQrCode",
          
          "Tenkhuvuc",
          "ID_User",
          "isDelete",
        ],
        include: [
          {
            model: Ent_toanha,
            attributes: ["Toanha", "Sotang"],
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
          {
            model: Ent_hangmuc,
            as: "ent_hangmuc",
            attributes: [
              "ID_Hangmuc",
              "ID_Khuvuc",
              "MaQrCode",
              "Hangmuc",
              "Tieuchuankt",
              "FileTieuChuan",
              "isDelete",
            ],
            where: {
              ID_Hangmuc: {
                [Op.in]: thietlapca.ID_Hangmucs,
              }, // Lọc theo ID_Hangmucs của thietlapca
            },
          },
        ],
      });

      // Trả về dữ liệu lấy được từ khuvucData
      res.status(200).json({
        message: "Danh sách thiết lập ca!",
        data: khuvucData,
        thietlapca: thietlapca,
      });
    }
  } catch (err) {
    // Xử lý lỗi
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const ID_ThietLapCa = req.params.id;
    const userData = req.user.data;
    const { ID_KhoiCV, ID_Calv, Ngaythu, ID_Hangmucs } = req.body;
    if (!ID_Calv || !ID_Hangmucs) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
    }
    const checklistCount = await Ent_checklist.count({
      where: {
        ID_Hangmuc: {
          [Op.in]: ID_Hangmucs, // Assuming ID_Hangmucs is an array
        },
      },
    });

    Ent_thietlapca.update(
      {
        ID_Duan: userData.ID_Duan,
        ID_Calv: ID_Calv,
        Ngaythu: Ngaythu,
        Sochecklist: checklistCount,
        ID_Hangmucs: ID_Hangmucs,
      },
      {
        where: {
          ID_ThietLapCa: ID_ThietLapCa,
        },
      }
    ) .then((data) => {
      res.status(200).json({
        message: "Cập nhật tòa nhà thành công!!!",
        data: data,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message || "Lỗi! Vui lòng thử lại sau.",
      });
    })
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
      Ent_thietlapca.update(
        { isDelete: 1 },
        {
          where: {
            ID_ThietLapCa: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa thành công!",
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
