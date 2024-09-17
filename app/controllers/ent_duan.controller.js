const { Ent_duan, Ent_khuvuc, Ent_toanha, Ent_hangmuc, Ent_nhom, Ent_khuvuc_khoicv, Ent_khoicv } = require("../models/setup.model");
const { Op } = require("sequelize");

exports.create = (req, res) => {
  try {
    const userData = req.user.data;

    if (!userData) {
      res.status(401).json({
        message: "Bạn không có quyền tạo dự án!",
      });
      return;
    }
    if (!req.body.Duan) {
      res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
      return;
    }

    // Create a Ent_duan
    const data = {
      Duan: req.body.Duan,
      ID_Nhom: req.body.ID_Nhom,
      Diachi: req.body.Diachi,
      Vido: req.body.Vido,
      Kinhdo: req.body.Kinhdo,
      Logo: req.body.Logo,
      isDelete: 0,
    };

    // Save Ent_duan in the database
    Ent_duan.create(data)
      .then((data) => {
        res.status(200).json({
          message: "Tạo dự án thành công!",
          data: data,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.get = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData && userData.ent_chucvu.Chucvu === "PSH") {
      await Ent_duan.findAll({
        attributes: [
          "ID_Duan",
          "Duan",
          "Diachi",
          "ID_Nhom",
          "Vido",
          "Kinhdo",
          "Logo",
          "isDelete",
        ],
        include: [
          {
            model: Ent_toanha,
            as: "ent_toanha", // Ensure this matches the alias used in your model definition
            attributes: ["Toanha", "Sotang", "ID_Duan", "Vido", "Kinhdo"],
            where: { isDelete: 0 },
            required: false, // Use this to include projects without buildings
          },
          {
            model: Ent_nhom,
            as: "ent_nhom",
            attributes: ["Tennhom","ID_Nhom"],
          }
        ],
        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách dự án!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    } else if (userData && userData.ent_chucvu.Chucvu !== "PSH") {
      await Ent_duan.findAll({
        attributes: [
          "ID_Duan",
          "Duan",
          "Diachi",
          "ID_Nhom",
          "Vido",
          "Kinhdo",
          "Logo",
          "isDelete",
        ],
        include: [
          {
            model: Ent_toanha,
            as: "ent_toanha", // Ensure this matches the alias used in your model definition
            attributes: ["Toanha", "Sotang", "ID_Duan", "Vido", "Kinhdo"],
            where: { isDelete: 0 },
            required: false, // Use this to include projects without buildings
          },
          {
            model: Ent_nhom,
            as:"ent_nhom",
            attributes: ["Tennhom","ID_Nhom"],
          }
        ],
        where: {
          [Op.and]: {
            isDelete: 0,
            ID_Duan: userData.ID_Duan,
          },
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách dự án!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    } else {
      return res.status(401).json({
        message: "Bạn không có quyền truy cập",
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
    if (userData && userData.ent_chucvu.Chucvu === "PSH") {
      await Ent_duan.findByPk(req.params.id, {
        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách dự án!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    } else if (userData && userData.ent_chucvu.Chucvu !== "PSH") {
      await Ent_duan.findAll({
        where: {
          [Op.and]: {
            isDelete: 0,
            ID_Duan: userData.ID_Duan,
          },
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách dự án!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    } else {
      return res.status(401).json({
        message: "Bạn không có quyền truy cập",
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
      Ent_duan.update(
        {
          Duan: req.body.Duan,
          Diachi: req.body.Diachi,
          Vido: req.body.Vido,
          Kinhdo: req.body.Kinhdo,
          Logo: req.body.Logo,
          ID_Nhom: req.body.ID_Nhom,
        },
        {
          where: {
            ID_Duan: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Dự án chi tiết!",
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

exports.delete = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      Ent_duan.update(
        { isDelete: 1 },
        {
          where: {
            ID_Duan: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa dự án thành công!",
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

exports.getKhuvucByDuan = async (req, res) => {
  try {
    const data = await Ent_duan.findAll({
      attributes: [
        "ID_Duan",
        "Duan",
        "Diachi",
        "ID_Nhom",
        "Vido",
        "Kinhdo",
        "Logo",
        "isDelete",
      ],
      include: [
        {
          model: Ent_toanha,
          as: "ent_toanha", // Ensure this matches the alias used in your model definition
          attributes: ["Toanha", "Sotang", "ID_Duan", "Vido", "Kinhdo"],
          where: { isDelete: 0 },
          required: false, // Use this to include projects without buildings
        },
        {
          model: Ent_nhom,
          attributes: ["Tennhom","ID_Nhom"],
        }
      ],
      where: {
        isDelete: 0,
      },
    });

    const result = data.map((duan) => ({
      ID_Duan: duan.ID_Duan,
      Duan: duan.Duan,
      Diachi: duan.Diachi,
      Vido: duan.Vido,
      Kinhdo: duan.Kinhdo,
      ID_Nhom: duan.ID_Nhom,
      Logo: duan.Logo,
      toanhas: duan.ent_toanha.map((khuvuc) => ({
        ID_Toanha: khuvuc.ID_Toanha,
        Toanha: khuvuc.Toanha,
        Sotang: khuvuc.Sotang,
        Vido: khuvuc.Vido,
        Kinhdo: khuvuc.Kinhdo,
      })),
    }));

    res.status(200).json({
      message: "Danh sách dự án với khu vực!",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getThongtinduan = async (req, res) => {
  try {
    const data = await Ent_duan.findAll({
      attributes: [
        "ID_Duan",
        "Duan",
        "Diachi",
        "Vido",
        "Kinhdo",
        "ID_Nhom",
        "Logo",
        "isDelete",
      ],
      include: [
        {
          model: Ent_toanha,
          as: "ent_toanha",
          attributes: ["ID_Toanha", "Toanha", "Sotang", "ID_Duan", "Vido", "Kinhdo", "isDelete"],
          where: { isDelete: 0 },
          required: false,
          include: [
            {
              model: Ent_khuvuc,
              as: "ent_khuvuc",
              attributes: ["ID_Khuvuc", "Makhuvuc", "MaQrCode", "Tenkhuvuc", "isDelete"],
              where: { isDelete: 0 },
              required: false,
              include: [
                {
                  model: Ent_hangmuc,
                  as: "ent_hangmuc",
                  attributes: ["ID_Hangmuc", "ID_Khuvuc", "Hangmuc", "MaQrCode", "isDelete", "Tieuchuankt", "FileTieuChuan"],
                  where: { isDelete: 0 },
                  required: false,
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
          ],
        },
        {
          model: Ent_nhom,
          attributes: ["Tennhom","ID_Nhom"]
        }
      ],
      where: {
        isDelete: 0,
      }
    });

    const result = data.map((duan) => {
      let totalHangmucInDuan = 0;
      let totalKhuvucInDuan = 0;

      const toanhas = duan.ent_toanha.map((toanha) => {
        let totalHangmucInToanha = 0;
        const khoisSet = new Set(); // Sử dụng Set để loại bỏ trùng lặp tên khối
        const khuvucs = toanha.ent_khuvuc.map((khuvuc) => {
          const hangmucs = khuvuc.ent_hangmuc.map((hangmuc) => ({
            ID_Hangmuc: hangmuc.ID_Hangmuc,
            Hangmuc: hangmuc.Hangmuc,
            MaQrCode: hangmuc.MaQrCode,
            Tieuchuankt: hangmuc.Tieuchuankt,
          }));

          const khoicvs = khuvuc.ent_khuvuc_khoicvs.map((cv) => {
            khoisSet.add(cv.ent_khoicv.KhoiCV); // Thêm tên khối vào Set
            return {
              ID_KhoiCV: cv.ID_KhoiCV,
              ID_Khuvuc: cv.ID_Khuvuc,
              ID_KV_CV: cv.ID_KV_CV
            };
          });

          const hangMucLength = hangmucs.length;
          totalHangmucInToanha += hangMucLength;
          return {
            ID_Khuvuc: khuvuc.ID_Khuvuc,
            ID_KhoiCVs: khoicvs,
            Makhuvuc: khuvuc.Makhuvuc,
            MaQrCode: khuvuc.MaQrCode,
            Tenkhuvuc: khuvuc.Tenkhuvuc,
            hangMucLength: hangMucLength,
            hangmuc: hangmucs,
          };
        });

        const khuvucLength = khuvucs.length;
        totalHangmucInDuan += totalHangmucInToanha;
        totalKhuvucInDuan += khuvucLength;

        const tenKhois = Array.from(khoisSet); // Chuyển Set thành mảng tên khối
        return {
          ID_Toanha: toanha.ID_Toanha,
          Toanha: toanha.Toanha,
          Sotang: toanha.Sotang,
          Vido: toanha.Vido,
          Kinhdo: toanha.Kinhdo,
          khuvucLength: khuvucLength,
          khuvuc: khuvucs,
          totalHangmucInToanha,
          tenKhois, // Thêm trường danh sách tên khối
        };
      });

      return {
        ID_Duan: duan.ID_Duan,
        Duan: duan.Duan,
        Diachi: duan.Diachi,
        Vido: duan.Vido,
        Kinhdo: duan.Kinhdo,
        Logo: duan.Logo,
        toanhas: toanhas,
        totalHangmucInDuan,
        totalKhuvucInDuan,
      };
    });

    res.status(200).json({
      message: "Danh sách dự án với khu vực!",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getThongtinduantheonhom = async(req, res) => {
  try {
    const data = await Ent_duan.findAll({
      attributes: [
        "ID_Duan",
        "Duan",
        "Diachi",
        "Vido",
        "Kinhdo",
        "ID_Nhom",
        "Logo",
        "isDelete",
      ],
      include: [
        // {
        //   model: Ent_toanha,
        //   as: "ent_toanha",
        //   attributes: ["ID_Toanha", "Toanha", "Sotang", "ID_Duan", "Vido", "Kinhdo", "isDelete"],
        //   where: { isDelete: 0 },
        //   required: false,
        //   include: [
        //     {
        //       model: Ent_khuvuc,
        //       as: "ent_khuvuc",
        //       attributes: ["ID_Khuvuc", "Makhuvuc", "MaQrCode", "Tenkhuvuc", "isDelete"],
        //       where: { isDelete: 0 },
        //       required: false,
        //       include: [
        //         {
        //           model: Ent_hangmuc,
        //           as: "ent_hangmuc",
        //           attributes: ["ID_Hangmuc", "ID_Khuvuc", "Hangmuc", "MaQrCode", "isDelete", "Tieuchuankt", "FileTieuChuan"],
        //           where: { isDelete: 0 },
        //           required: false,
        //         },
        //       ],
        //     },
        //   ],
        // },
        {
          model: Ent_nhom,
          attributes: ["Tennhom","ID_Nhom"]
        }
      ],
      where: {
        isDelete: 0,
      },
    });

    const groupedData = data.reduce((acc, item) => {
      const groupName = item.ent_nhom.Tennhom;
      
      // Nếu chưa có key với tên nhóm, tạo mới
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
    
      // Thêm dự án vào nhóm tương ứng
      acc[groupName].push(item);
    
      return acc;
    }, {});
    
    res.status(200).json({
      message: "Danh sách dự án với nhóm!",
      data: groupedData,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
}

