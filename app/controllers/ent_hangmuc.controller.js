const {
  Ent_hangmuc,
  Ent_toanha,
  Ent_khoicv,
  Ent_khuvuc_khoicv,
} = require("../models/setup.model");
const { Ent_khuvuc } = require("../models/setup.model");
const { Op } = require("sequelize");
const sequelize = require("../config/db.config");
const xlsx = require("xlsx");

// Create and Save a new Ent_tang
exports.create = async (req, res, next) => {
  // Validate request
  try {
    if (!req.body.Hangmuc || !req.body.MaQrCode) {
      res.status(400).json({
        message: "Cần nhập đầy đủ thông tin!",
      });
      return;
    }
    const MaQrCode = req.body.MaQrCode;

    const userData = req.user.data;
    if (userData) {
      const existingHangMuc = await Ent_hangmuc.findOne({
        where: {
          MaQrCode: MaQrCode,
          isDelete: 0,
        },
        attributes: ["ID_Hangmuc", "MaQrCode", "isDelete"],
      });

      // Kiểm tra QR code trong Ent_khuvuc
      const existingKhuVuc = await Ent_khuvuc.findOne({
        attributes: ["ID_Khuvuc", "MaQrCode", "isDelete"],
        where: {
          MaQrCode: MaQrCode,
          isDelete: 0,
        },
      });

      if (existingHangMuc || existingKhuVuc) {
        // QR code đã tồn tại trong một trong hai bảng
        return res.status(500).json({
          message: "QR code trùng lặp, không thể thêm mới.",
        });
      } else {
        // QR code không trùng lặp, cho phép thêm mới
        const data = {
          ID_Khuvuc: req.body.ID_Khuvuc,
          MaQrCode: req.body.MaQrCode,
          Hangmuc: req.body.Hangmuc,
          FileTieuChuan: req.body.FileTieuChuan,
          Important: req.body.Important,
          Tieuchuankt: req.body.Tieuchuankt || null,
          isDelete: 0,
        };

        Ent_hangmuc.create(data)
          .then((data) => {
            res.status(200).json({
              message: "Tạo hạng mục thành công!",
              data: data,
            });
          })
          .catch((err) => {
            res.status(500).json({
              message: err.message || "Lỗi! Vui lòng thử lại sau.",
            });
          });
      }
    } else {
      return res.status(500).json({
        message: "Bạn không có quyền tạo hạng mục.",
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
    const orConditions = [];
    if (userData) {
      orConditions.push({
        "$ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
      });

      await Ent_hangmuc.findAll({
        attributes: [
          "ID_Hangmuc",
          "ID_Khuvuc",
          "MaQrCode",
          "Hangmuc",
          "Tieuchuankt",
          "Important",
          "FileTieuChuan",
          "isDelete",
        ],
        include: [
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
        ],
        where: {
          isDelete: 0,
          [Op.and]: [orConditions],
        },
        order: [["ID_Khuvuc", "ASC"]],
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách hạng mục!!!",
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
    const orConditions = [];
    if (userData) {
      orConditions.push({
        "$ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
      });
      if (userData.ID_KhoiCV !== null) {
        orConditions.push({
          $ID_KhoiCV$: userData.ID_KhoiCV,
        });
      }
      await Ent_hangmuc.findByPk(req.params.id, {
        attributes: [
          "ID_Hangmuc",
          "ID_Khuvuc",
          "MaQrCode",
          "Hangmuc",
          "Tieuchuankt",
          "Important",
          "isDelete",
          "FileTieuChuan",
        ],
        include: [
          {
            model: Ent_khuvuc,
            attributes: [
              "ID_Toanha",
              "ID_Khuvuc",
              "Sothutu",
              "MaQrCode",
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
        ],
        where: {
          isDelete: 0,
          [Op.and]: [orConditions],
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Hạng mục cần tìm!",
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

exports.update = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      const reqData = {
        ID_Khuvuc: req.body.ID_Khuvuc,
        MaQrCode: req.body.MaQrCode,
        Hangmuc: req.body.Hangmuc,
        Tieuchuankt: req.body.Tieuchuankt,
        FileTieuChuan: req.body.FileTieuChuan,
        Important: req.body.Important,
        isDelete: 0,
      };

      // Kiểm tra xem mã QR Code mới có trùng với bất kỳ bản ghi nào khác trong cơ sở dữ liệu không
      const existingHangMuc = await Ent_hangmuc.findOne({
        where: {
          MaQrCode: req.body.MaQrCode,
          ID_Hangmuc: { [Op.ne]: req.params.id },
          isDelete: 0,
        },
        attributes: ["MaQrCode", "ID_Hangmuc"],
      });

      const existingKhuVuc = await Ent_khuvuc.findOne({
        attributes: ["ID_Khuvuc", "MaQrCode", "isDelete"],
        where: {
          MaQrCode: req.body.MaQrCode,
          isDelete: 0,
        },
      });

      if (existingHangMuc || existingKhuVuc) {
        res.status(400).json({
          message: "Mã QR Code đã tồn tại!",
        });
        return;
      }

      Ent_hangmuc.update(reqData, {
        where: {
          ID_Hangmuc: req.params.id,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật hạng mục thành công!",
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
      Ent_hangmuc.update(
        { isDelete: 1 },
        {
          where: {
            ID_Hangmuc: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa hạng mục thành công!",
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
    const idsToDelete = deleteRows.map((row) => row.ID_Hangmuc);
    if (userData) {
      Ent_hangmuc.update(
        { isDelete: 1 },
        {
          where: {
            ID_Hangmuc: idsToDelete,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa hạng mục thành công!",
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

exports.filterByKhuvuc = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Khuvuc = req.params.id;

    if (userData) {
      // Xây dựng điều kiện where dựa trên các giá trị đã kiểm tra
      const whereCondition = {
        [Op.and]: [],
      };

      if (userData.ID_Chucvu === 1 || userData.UserName === "PSH") {
        // Nếu userData.ID_Chucvu == 1, không cần thêm điều kiện where, lấy tất cả khu vực
      } else {
        // Nếu userData.ID_Chucvu !== 1, thêm điều kiện where theo ID_KhoiCV và ID_Duan
        if (userData.ID_Duan !== null) {
          whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData.ID_Duan;
        }
        // if (userData.ID_KhoiCV !== null) {
        //   whereCondition["$ID_KhoiCV$"] = userData.ID_KhoiCV;
        // }
        if (
          ID_Khuvuc !== null &&
          ID_Khuvuc !== undefined &&
          ID_Khuvuc !== "" &&
          ID_Khuvuc !== "null"
        ) {
          whereCondition[Op.and].push({
            ID_Khuvuc: ID_Khuvuc,
          });
        }
      }
      // Thêm điều kiện isDelete
      whereCondition.isDelete = 0;
      Ent_hangmuc.findAll({
        attributes: [
          "ID_Hangmuc",
          "MaQrCode",
          "Hangmuc",
          "Tieuchuankt",
          "Important",
          "isDelete",
          "FileTieuChuan",
        ],
        include: [
          {
            model: Ent_khuvuc,
            attributes: [
              "ID_Khuvuc",
              "ID_Toanha",
              "Sothutu",
              "Makhuvuc",
              "MaQrCode",
              "Tenkhuvuc",
              "ID_User",
              "isDelete",
            ],
            include: [
              {
                model: Ent_toanha,
                attributes: ["Toanha", "Sotang", "ID_Toanha"],
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
        ],
        where: whereCondition,
        order: [["ID_Khuvuc", "ASC"]],
      })
        .then((data) => {
          res.status(200).json({
            message: "Thông tin hạng mục!",
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

exports.getHangmucTotal = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData || !userData.ID_Duan) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereCondition = {
      isDelete: 0,
      "$ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
    };

    const hangmucData = await Ent_hangmuc.findAll({
      attributes: [
        "ID_Hangmuc",
        "ID_Khuvuc",
        "MaQrCode",
        "Hangmuc",
        "Tieuchuankt",
        "Important",
        "isDelete",
        "FileTieuChuan",
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

          include: [
            {
              model: Ent_toanha,
              attributes: [
                "ID_Toanha",
                "ID_Duan",
                "Toanha",
                "Sotang",
                "isDelete",
              ],
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
          where: {
            isDelete: 0,
          },
        },
      ],
      where: whereCondition,
    });

    if (!hangmucData || hangmucData.length === 0) {
      return res.status(200).json({
        message: "Không có hạng mục!",
        data: [],
      });
    }

    const khoiCVData = [
      { ID_KhoiCV: 1, KhoiCV: "Khối làm sạch" },
      { ID_KhoiCV: 2, KhoiCV: "Khối kỹ thuật" },
      { ID_KhoiCV: 3, KhoiCV: "Khối bảo vệ" },
      { ID_KhoiCV: 4, KhoiCV: "Khối dịch vụ" },
    ];

    const khoiCVMap = {};
    khoiCVData.forEach((item) => {
      khoiCVMap[item.ID_KhoiCV] = item.KhoiCV;
    });

    const hangmucCounts = {};
    hangmucData.forEach((item) => {
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
        if (!hangmucCounts[khoiCV]) {
          hangmucCounts[khoiCV] = 0;
        }
        hangmucCounts[khoiCV]++;
      });
    });
    
    // Convert counts to desired format
    const result = Object.keys(hangmucCounts).map((khoiCV) => ({
      label: khoiCV,
      value: hangmucCounts[khoiCV],
    }));

    return res.status(200).json({
      message: "Danh sách hạng mục!",
      length: result.length,
      data: result,
    });
  } catch (err) {
    console.error("Error in getHangmucTotal:", err);
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

      for (const item of data) {
        const transformedItem = removeSpacesFromKeys(item);
        const tenKhuvuc = transformedItem["TÊNKHUVỰC"];
        const maQrKhuvuc = transformedItem["MÃQRCODEKHUVỰC"];
        const maQrHangmuc = transformedItem["MÃQRCODEHẠNGMỤC"];
        const tenHangmuc = transformedItem["TÊNHẠNGMỤC"];

        const khuVuc = await Ent_khuvuc.findOne({
          attributes: ["ID_Khuvuc", "MaQrCode", "Tenkhuvuc", "isDelete"],
          where: {
            MaQrCode: maQrKhuvuc,
            Tenkhuvuc: tenKhuvuc,
            isDelete: 0,
          },
          transaction,
        });
        if (!khuVuc) {
          console.log(`Khu vực với MaQrCode ${maQrKhuvuc} không tìm thấy`);
          continue; // Skip the current iteration and move to the next item
        }

        // Check if tenKhuvuc already exists in the database
        const existingHangMuc = await Ent_hangmuc.findOne({
          attributes: ["ID_Hangmuc", "Hangmuc", "MaQrCode", "ID_Khuvuc"],
          where: {
            [Op.and]: [
              { Hangmuc: tenHangmuc },
              { MaQrCode: maQrHangmuc },
              { ID_Khuvuc: khuVuc.ID_Khuvuc },
              { isDelete: 0 },
            ],
          },
          transaction,
        });

        if (!existingHangMuc || !khuVuc) {
          // If tenKhuvuc doesn't exist, create a new entry
          const dataInsert = {
            ID_Khuvuc: khuVuc.ID_Khuvuc,
            MaQrCode: maQrHangmuc,
            Hangmuc: tenHangmuc,
            isDelete: 0,
          };

          await Ent_hangmuc.create(dataInsert, { transaction });
        } else {
          console.log(
            `Hang muc "${tenHangmuc}" đã tồn tại, bỏ qua việc tạo mới.`
          );
        }
      }
    });

    res.send({
      message: "File uploaded and data processed successfully",
      data,
    });
  } catch (err) {
    console.log("err", err);
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};
