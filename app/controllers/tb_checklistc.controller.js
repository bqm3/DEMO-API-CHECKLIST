const moment = require("moment");
const {
  Ent_duan,
  Ent_calv,
  Ent_khoicv,
  Tb_checklistc,
  Ent_chucvu,
  Ent_checklist,
  Ent_khuvuc,
  Ent_hangmuc,
  Ent_user,
  Ent_toanha,
  Tb_checklistchitiet,
  Tb_checklistchitietdone,
  Ent_tang,
  Ent_nhom,
  Ent_khuvuc_khoicv,
  Ent_thietlapca,
} = require("../models/setup.model");
const { Op, Sequelize } = require("sequelize");
const { uploadFile } = require("../middleware/auth_google");
const Ent_checklistc = require("../models/tb_checklistc.model");
const sequelize = require("../config/db.config");
const cron = require("node-cron");
const ExcelJS = require("exceljs");
var FileSaver = require("file-saver");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

function convertTimeFormat(timeStr) {
  if (!timeStr.includes("AM") && !timeStr.includes("PM")) {
    return timeStr;
  }

  // Tách phần giờ, phút, giây và phần AM/PM
  let [time, modifier] = timeStr.split(" ");

  // Tách giờ, phút, giây ra khỏi chuỗi thời gian
  let [hours, minutes, seconds] = time.split(":");

  // Nếu giờ là 12 AM, đổi thành 0 (nửa đêm)
  if (hours === "12" && modifier === "AM") {
    hours = "00";
  } else if (modifier === "PM" && hours !== "12") {
    // Nếu không phải 12 PM, cộng thêm 12 giờ
    hours = (parseInt(hours, 10) + 12).toString().padStart(2, "0");
  }

  // Trả về chuỗi thời gian mới
  return `${hours}:${minutes}:${seconds}`;
}

exports.createFirstChecklist = async (req, res, next) => {
  try {
    const userData = req.user.data;
    const { ID_Calv, ID_KhoiCV, Ngay, Giobd } = req.body;
    // Validate request
    if (!ID_Calv) {
      res.status(400).json({
        message: "Phải chọn ca làm việc!",
      });
      return;
    }

    const calvData = await Ent_calv.findOne({
      where: { ID_Calv: ID_Calv },
      attributes: ["Giobatdau", "Gioketthuc"],
    });

    const khoiData = await Ent_khoicv.findOne({
      where: { ID_KhoiCV: ID_KhoiCV },
      attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
    });

    const formattedDateNow = moment(Ngay).startOf("day").format("YYYY-MM-DD");

    const formattedDate = moment(khoiData.Ngaybatdau)
      .startOf("day")
      .format("YYYY-MM-DD");

    const daysDifference = moment(formattedDateNow).diff(
      moment(formattedDate),
      "days"
    );

    const remainder = daysDifference % khoiData.Chuky;

    let ngayCheck = 0;
    if(remainder> 0){
      ngayCheck = remainder
    }else {
      ngayCheck = Math.abs(remainder);
    }

    if (!calvData) {
      return res.status(400).json({
        message: "Ca làm việc không tồn tại!",
      });
    }

    const { Giobatdau, Gioketthuc } = calvData;

    const giobdMoment = moment(convertTimeFormat(Giobd), "HH:mm:ss");
    const giobatdauMoment = moment(Giobatdau, "HH:mm:ss");
    const gioketthucMoment = moment(Gioketthuc, "HH:mm:ss");

    if (gioketthucMoment.isBefore(giobatdauMoment)) {
      if (
        !giobdMoment.isBetween(
          giobatdauMoment,
          moment("23:59:59", "HH:mm:ss"),
          null,
          "[]"
        ) &&
        !giobdMoment.isBetween(
          moment("00:00:00", "HH:mm:ss"),
          gioketthucMoment,
          null,
          "[]"
        )
      ) {
        return res.status(400).json({
          message: "Giờ bắt đầu không thuộc khoảng thời gian của ca làm việc!",
        });
      }
    } else {
      // Nếu khoảng thời gian không qua nửa đêm, sử dụng logic thông thường
      if (
        !giobdMoment.isBetween(giobatdauMoment, gioketthucMoment, null, "[]")
      ) {
        return res.status(400).json({
          message: "Giờ bắt đầu không thuộc khoảng thời gian của ca làm việc!",
        });
      }
    }

    const thietlapcaData = await Ent_thietlapca.findOne({
      attributes: [
        "ID_ThietLapCa",
        "Ngaythu",
        "ID_Calv",
        "ID_Hangmucs",
        "ID_Duan",
        "isDelete"
      ],
      where: [
        {
          Ngaythu: ngayCheck,
          ID_Calv: ID_Calv,
          ID_Duan: userData.ID_Duan,
          isDelete: 0
        }
      ]
    })

    if(!thietlapcaData){
      return res.status(400).json({
        message: "Chưa thiết lập hạng mục cho ca này!",
      });
    }

    const checklistData = await Ent_checklist.findAndCountAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
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
            "ID_Khuvuc",
            "FileTieuChuan"
          ],
          where: {
            ID_Hangmuc: {
              [Op.in]: thietlapcaData.ID_Hangmucs
            } 
          }
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",

            "ID_Khuvuc",
            "ID_KhoiCVs",
            "isDelete"
          ],
          include: [
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KV_CV", "ID_Khuvuc", "ID_KhoiCV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                }
              ],
              where: {
                ID_KhoiCV: userData?.ID_KhoiCV
              }
            },
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: ["ID_Duan", "Duan", "Diachi", "Vido", "Kinhdo"],
                where: { ID_Duan: userData.ID_Duan },
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
      where: {
        isDelete: 0
      },
      order: [
        ["ID_Khuvuc", "ASC"],
      ],
    });


    Tb_checklistc.findAndCountAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_KhoiCV",
        "ID_User",
        "ID_Calv",
        "ID_ThietLapCa",
        "ID_Hangmucs",
        "TongC",
        "Ngay",
        "Tinhtrang",
      ],
      where: {
        isDelete: 0,
        [Op.and]: [
          { Ngay: Ngay },
          { ID_KhoiCV: userData.ID_KhoiCV },
          { ID_Duan: userData.ID_Duan },
          { ID_User: userData.ID_User },
          { ID_Calv: ID_Calv },
        ],
      },
    })
      .then(({ count, rows }) => {
        // Kiểm tra xem đã có checklist được tạo hay chưa
        if (count === 0) {
          // Nếu không có checklist tồn tại, tạo mới
          const data = {
            ID_User: userData.ID_User,
            ID_Calv: ID_Calv,
            ID_Duan: userData.ID_Duan,
            ID_KhoiCV: userData.ID_KhoiCV,
            ID_ThietLapCa: thietlapcaData.ID_ThietLapCa,
            Giobd: convertTimeFormat(Giobd),
            Ngay: formattedDateNow,
            TongC: 0,
            Tong: checklistData.count || 0,
            Tinhtrang: 0,
            ID_Hangmucs: thietlapcaData.ID_Hangmucs || null,
            isDelete: 0,
          };

          Tb_checklistc.create(data)
            .then((data) => {
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
        } else {
          // Nếu đã có checklist được tạo
          // Kiểm tra xem tất cả các ca checklist đều đã hoàn thành (Tinhtrang === 1)
          const allCompleted = rows.every(
            (checklist) => checklist.dataValues.Tinhtrang === 1
          );
          //
          if (allCompleted) {
            const allCompletedTwo = rows.every(
              (checklist) => checklist.dataValues.ID_Calv !== ID_Calv
            );

            if (allCompletedTwo) {
              const data = {
                ID_User: userData.ID_User,
                ID_Calv: ID_Calv,
                ID_Duan: userData.ID_Duan,
                ID_KhoiCV: userData.ID_KhoiCV,
                Giobd: convertTimeFormat(Giobd),
                ID_ThietLapCa: thietlapcaData.ID_ThietLapCa,
                Ngay: formattedDateNow,
                TongC: 0,
                Tong: checklistData.count || 0,
                Tinhtrang: 0,
                ID_Hangmucs: thietlapcaData.ID_Hangmucs || null,
                isDelete: 0,
              };

              Tb_checklistc.create(data)
                .then((data) => {
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
            } else {
              res.status(400).json({
                message: "Đã có ca làm việc",
                data: rows,
              });
            }
          } else {
            // Nếu có ít nhất một ca checklist chưa hoàn thành (Tinhtrang !== 1), không cho tạo mới
            res.status(400).json({
              message: "Có ít nhất một ca checklist chưa hoàn thành",
              data: rows,
            });
          }
        }
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

exports.getCheckListc = async (req, res, next) => {
  try {
    const userData = req.user.data;
    if (userData) {
      let whereClause = {
        ID_Duan: userData?.ID_Duan,
        isDelete: 0,
      };

      // Nếu quyền là 1 (ID_Chucvu === 1) thì không cần thêm điều kiện ID_KhoiCV
      if (userData.ID_Chucvu !== 1 && userData.ID_Chucvu !== 2) {
        whereClause.ID_KhoiCV = userData?.ID_KhoiCV;
      }

      const page = parseInt(req.query.page) || 0;
      const pageSize = parseInt(req.query.limit) || 100; // Số lượng phần tử trên mỗi trang
      const offset = page * pageSize;

      const totalCount = await Tb_checklistc.count({
        attributes: [
          "ID_ChecklistC",
          "ID_Hangmucs",
          "ID_Duan",
          "ID_KhoiCV",
          "ID_Calv",
          "ID_ThietLapCa",
          "Ngay",
          "Giobd",
          "Giochupanh1",
          "Anh1",
          "Giochupanh2",
          "Anh2",
          "Giochupanh3",
          "Anh3",
          "Giochupanh4",
          "Anh4",
          "Giokt",
          "Ghichu",
          "Tinhtrang",
          "isDelete",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["ID_Duan", "Duan", "Diachi", "Vido", "Kinhdo"],
          },
          {
            model: Ent_khoicv,
            attributes: ["ID_KhoiCV", "KhoiCV"],
          },
          {
            model: Ent_calv,
            attributes: ["ID_Calv", "Tenca", "Giobatdau", "Gioketthuc"],
          },
          {
            model: Ent_user,
            attributes: ["ID_User", "Hoten", "ID_Chucvu"],
            include: [
              {
                model: Ent_chucvu,
                attributes: ["Chucvu"],
              },
            ],
          },
        ],
        where: whereClause,
      });
      const totalPages = Math.ceil(totalCount / pageSize);
      await Tb_checklistc.findAll({
        attributes: [
          "ID_ChecklistC",
          "ID_Hangmucs",
          "ID_Duan",
          "ID_KhoiCV",
          "ID_Calv",
          "ID_ThietLapCa",
          "ID_User",
          "Ngay",
          "Tong",
          "TongC",
          "Giobd",
          "Giochupanh1",
          "Anh1",
          "Giochupanh2",
          "Anh2",
          "Giochupanh3",
          "Anh3",
          "Giochupanh4",
          "Anh4",
          "Giokt",
          "Ghichu",
          "Tinhtrang",
          "isDelete",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["ID_Duan", "Duan", "Diachi", "Vido", "Kinhdo"],
          },
          {
            model: Ent_khoicv,
            attributes: ["ID_KhoiCV", "KhoiCV"],
          },
          {
            model: Ent_calv,
            attributes: ["ID_Calv", "Tenca", "Giobatdau", "Gioketthuc"],
          },
          {
            model: Ent_user,
            attributes: ["ID_User", "Hoten", "ID_Chucvu"],
            include: [
              {
                model: Ent_chucvu,
                attributes: ["Chucvu"],
              },
            ],
          },
        ],
        where: whereClause,
        order: [
          ["Ngay", "DESC"],
          ["ID_ChecklistC", "DESC"],
        ],
        offset: offset,
        limit: pageSize,
      })
        .then((data) => {
          if (data) {
            res.status(200).json({
              message: "Danh sách checklistc!",
              page: page,
              pageSize: pageSize,
              totalPages: totalPages,
              data: data,
            });
          } else {
            res.status(400).json({
              message: "Không có checklistc!",
              data: [],
            });
          }
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
    if (req.params.id && userData) {
      await Tb_checklistc.findByPk(req.params.id, {
        attributes: [
          "ID_ChecklistC",
          "ID_Hangmucs",
          "ID_Duan",
          "ID_KhoiCV",
          "ID_Calv",
          "ID_ThietLapCa",
          "ID_User",
          "Ngay",
          "Giobd",
          "Giochupanh1",
          "Anh1",
          "Giochupanh2",
          "Anh2",
          "Giochupanh3",
          "Anh3",
          "Giochupanh4",
          "Anh4",
          "Giokt",
          "Ghichu",
          "Tinhtrang",
          "isDelete",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["ID_Duan", "Duan", "Diachi", "Vido", "Kinhdo"],
          },
          {
            model: Ent_khoicv,
            attributes: ["ID_KhoiCV", "KhoiCV"],
          },
          {
            model: Ent_calv,
            attributes: ["ID_Calv", "Tenca", "Giobatdau", "Gioketthuc"],
          },
          {
            model: Ent_user,
            attributes: ["ID_User", "Hoten", "ID_Chucvu"],
            include: [
              {
                model: Ent_chucvu,
                attributes: ["Chucvu"],
              },
            ],
          },
        ],
        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          if (data) {
            res.status(200).json({
              message: "Checklistc chi tiết!",
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

exports.close = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      Tb_checklistc.update(
        { Tinhtrang: 1, Giokt: req.body.Giokt },
        {
          where: {
            ID_ChecklistC: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Khóa ca thành công!",
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

exports.open = async (req, res) => {
  try {
    const userData = req.user.data;

    if (
      req.params.id &&
      (userData.ID_Chucvu === 1 ||
        userData.ID_Chucvu === 2 ||
        userData.ID_Chucvu === 3)
    ) {
      // Truy vấn ngày từ cơ sở dữ liệu
      const checklist = await Tb_checklistc.findOne({
        attributes: [
          "ID_ChecklistC",
          "ID_Hangmucs",
          "ID_Duan",
          "ID_KhoiCV",
          "ID_Calv",
          "ID_ThietLapCa",
          "Ngay",
          "Giobd",
          "Giochupanh1",
          "Anh1",
          "Giochupanh2",
          "Anh2",
          "Giochupanh3",
          "Anh3",
          "Giochupanh4",
          "Anh4",
          "Giokt",
          "Ghichu",
          "Tinhtrang",
          "isDelete",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["ID_Duan", "Duan", "Diachi", "Vido", "Kinhdo"],
          },
          {
            model: Ent_khoicv,
            attributes: ["ID_KhoiCV", "KhoiCV"],
          },
          {
            model: Ent_calv,
            attributes: ["ID_Calv", "Tenca", "Giobatdau", "Gioketthuc"],
          },
          {
            model: Ent_user,
            attributes: ["ID_User", "Hoten", "ID_Chucvu"],
            include: [
              {
                model: Ent_chucvu,
                attributes: ["Chucvu"],
              },
            ],
          },
        ],
        where: { ID_ChecklistC: req.params.id },
      });

      if (checklist) {
        const currentDay = new Date();
        const checklistDay = new Date(checklist.Ngay); // Giả sử cột ngày trong bảng là 'Ngay'

        // So sánh ngày hiện tại và ngày từ cơ sở dữ liệu
        if (currentDay.toDateString() === checklistDay.toDateString()) {
          // Ngày hiện tại bằng với ngày trong cơ sở dữ liệu, cho phép cập nhật
          await Tb_checklistc.update(
            { Tinhtrang: 0 },
            {
              where: { ID_ChecklistC: req.params.id },
            }
          );
          res.status(200).json({
            message: "Mở ca thành công!",
          });
        } else if (currentDay > checklistDay) {
          // Ngày hiện tại lớn hơn ngày từ cơ sở dữ liệu
          res.status(400).json({
            message: "Ngày khóa ca nhỏ hơn ngày hiện tại",
          });
        } else {
          // Ngày hiện tại nhỏ hơn ngày từ cơ sở dữ liệu (nếu có trường hợp này)
          res.status(400).json({
            message: "Không thể mở ca trước ngày đã khóa",
          });
        }
      } else {
        res.status(404).json({
          message: "Không tìm thấy bản ghi",
        });
      }
    } else {
      res.status(400).json({
        message: "Không có quyền chỉnh sửa",
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
    const ID_ChecklistC = req.params.id;

    if (req.params.id && userData) {
      Tb_checklistc.update(
        { isDelete: 1 },
        {
          where: {
            ID_ChecklistC: ID_ChecklistC,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xoá ca thành công!",
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

exports.updateTongC = async (req, res) => {
  try {
    if (req.params.id1) {
      Tb_checklistc.update(
        { TongC: req.params.id2 },
        {
          where: {
            ID_ChecklistC: req.params.id1,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Done!",
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

exports.checklistImages = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Checklist = req.params.id;
    if (userData && ID_Checklist) {
      let images = req.files;

      const uploadedFileIds = [];

      for (let f = 0; f < images.length; f += 1) {
        const fileId = await uploadFile(images[f]); // Upload file and get its id
        uploadedFileIds.push(fileId); // Push id to array
      }

      const reqData = {};

      // Populate reqData with available image data
      for (let i = 1; i <= 4; i++) {
        const imageKey = `Anh${i}`;
        const timestampKey = `Giochupanh${i}`;
        if (req.body[imageKey]) {
          const imagePath = uploadedFileIds.find(
            (file) => file.name === req.body[imageKey]
          )?.id;
          //  ;
          if (imagePath) {
            reqData[imageKey] = imagePath;
            reqData[timestampKey] = req.body[timestampKey] || "";
          }
        }
      }

      // Perform update only if reqData contains any data
      if (Object.keys(reqData).length > 0) {
        await Ent_checklistc.update(reqData, {
          where: { ID_ChecklistC: ID_Checklist },
        });

        res.status(200).json({ message: "Cập nhật khu vực thành công!" });
      } else {
        res
          .status(400)
          .json({ message: "Không có dữ liệu hình ảnh hợp lệ để cập nhật!" });
      }
    } else {
      res
        .status(401)
        .json({ message: "Bạn không có quyền truy cập! Vui lòng thử lại" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

// Chi tiết checklist trong 1 ca
exports.checklistCalv = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      const ID_ChecklistC = req.params.id;
      let whereClause = {
        isDelete: 0,
        ID_ChecklistC: ID_ChecklistC,
      };

      // Fetch checklist detail items
      const dataChecklistChiTiet = await Tb_checklistchitiet.findAll({
        attributes: [
          "ID_Checklistchitiet",
          "ID_ChecklistC",
          "ID_Checklist",
          "Ketqua",
          "Anh",
          "Gioht",
          "Ghichu",
          "isDelete",
        ],
        include: [
          {
            model: Tb_checklistc,
            attributes: [
              "ID_ChecklistC",
              "Ngay",
              "Giobd",
              "Giokt",
              "ID_KhoiCV",
              "ID_Calv",
            ],
            where: whereClause,
            include: [
              {
                model: Ent_khoicv,
                attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
              },
              {
                model: Ent_user,
                attributes: ["ID_User", "Hoten", "ID_Chucvu"],
              },
              {
                model: Ent_calv,
                attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
              },
            ],
          },
          {
            model: Ent_checklist,
            attributes: [
              "ID_Checklist",
              "ID_Hangmuc",
              "ID_Tang",
              "Sothutu",
              "Maso",
              "MaQrCode",
              "Checklist",
              "Giatridinhdanh",
              "isCheck",
              "Giatrinhan",
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
                attributes: [
                  "UserName",
                  "Email",
                  "Hoten",
                  "Ngaysinh",
                  "Gioitinh",
                  "Sodienthoai",
                ],
              },
            ],
          },
        ],
      });

      // Fetch checklist done items
      const checklistDoneItems = await Tb_checklistchitietdone.findAll({
        attributes: ["Description", "isDelete", "ID_ChecklistC", "Gioht"],
        where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
      });

      const arrPush = [];

      // Add status to dataChecklistChiTiet items if length > 0
      if (dataChecklistChiTiet.length > 0) {
        dataChecklistChiTiet.forEach((item) => {
          arrPush.push({ ...item.dataValues, status: 0 });
        });
      }

      // Extract all ID_Checklist from checklistDoneItems and fetch related data
      let checklistIds = [];
      if (checklistDoneItems.length > 0) {
          checklistDoneItems.forEach((item) => {
            const idChecklists = item.Description.split(",").map(Number); 
            checklistIds.push(...idChecklists);
          });
        // });
      }


      // Fetch related checklist data
      const relatedChecklists = await Ent_checklist.findAll({
        attributes: [
          "ID_Checklist",
          "ID_Hangmuc",
          "ID_Tang",
          "Sothutu",
          "Maso",
          "MaQrCode",
          "Checklist",
          "Giatridinhdanh",
          "isCheck",
          "Giatrinhan",
        ],
        where: {
          ID_Checklist: checklistIds,
        },
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
            attributes: [
              "UserName",
              "Email",
              "Hoten",
              "Ngaysinh",
              "Gioitinh",
              "Sodienthoai",
            ],
          },
        ],
      });

      if (checklistDoneItems.length > 0) {
        checklistDoneItems.forEach((item) => {
          if (checklistIds.length > 0) {
            checklistIds.map((it) => {
              if (Number(item.ID_ChecklistC) === Number(req.params.id)) {
                const relatedChecklist = relatedChecklists.find(
                  (rl) => rl.ID_Checklist == it
                );
                arrPush.push({
                  ID_ChecklistC: parseInt(item.ID_ChecklistC),
                  ID_Checklist: it,
                  Gioht: item.Gioht,
                  Ketqua: relatedChecklist.Giatridinhdanh,
                  status: 1,
                  ent_checklist: relatedChecklist
                });
              }
            });
          }
        });
        // });
      }

      const dataChecklistC = await Tb_checklistc.findByPk(ID_ChecklistC, {
        attributes: [
          "Ngay",
          "ID_KhoiCV",
          "ID_Duan",
          "Tinhtrang",
          "Giobd",
          "Giokt",
          "ID_User",
          "ID_Calv",
          "isDelete",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["Duan"],
          },
          {
            model: Ent_khoicv,
            attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
          },
          {
            model: Ent_calv,
            attributes: ["Tenca"],
          },
          {
            model: Ent_user,
            include: {
              model: Ent_chucvu,
              attributes: ["Chucvu"],
            },
            attributes: ["UserName", "Email"],
          },
          {
            model: Ent_user,
            attributes: ["ID_User", "Hoten", "ID_Chucvu"],
          },
        ],
        where: {
          isDelete: 0,
        },
      });

      res.status(200).json({
        message: "Danh sách checklist",
        data: arrPush,
        dataChecklistC: dataChecklistC,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.checklistCalvDinhKy = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      const ID_ChecklistC = req.params.id;
      let whereClause = {
        isDelete: 0,
        ID_ChecklistC: ID_ChecklistC,
      };

      // Fetch checklist detail items
      const dataChecklistChiTiet = await Tb_checklistchitiet.findAll({
        attributes: [
          "ID_Checklistchitiet",
          "ID_ChecklistC",
          "ID_Checklist",
          "Ketqua",
          "Anh",
          "Gioht",
          "Ghichu",
          "isDelete",
        ],
        include: [
          {
            model: Tb_checklistc,
            attributes: [
              "ID_ChecklistC",
              "Ngay",
              "Giobd",
              "Giokt",
              "ID_KhoiCV",
              "ID_Calv",
            ],
            where: whereClause,
            include: [
              {
                model: Ent_khoicv,
                attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
              },
              {
                model: Ent_user,
                attributes: ["ID_User", "Hoten", "ID_Chucvu"],
              },
              {
                model: Ent_calv,
                attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
              },
            ],
          },
          {
            model: Ent_checklist,
            attributes: [
              "ID_Checklist",
              "ID_Hangmuc",
              "ID_Tang",
              "Sothutu",
              "Maso",
              "MaQrCode",
              "Checklist",
              "Giatridinhdanh",
              "isCheck",
              "Giatrinhan",
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
                include: [
                  {
                    model: Ent_khuvuc,
                    attributes: [
                      "Tenkhuvuc",
                      "MaQrCode",
                      "Makhuvuc",
                      "Sothutu",

                      "ID_KhoiCV",
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
                          ],
                          where: { ID_Duan: userData.ID_Duan },
                        },
                      },
                    ],
                  },
                  {
                    model: Ent_khoicv,
                    attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                  },
                ],
              },
              {
                model: Ent_tang,
                attributes: ["Tentang"],
              },
              {
                model: Ent_user,
                attributes: [
                  "UserName",
                  "Email",
                  "Hoten",
                  "Ngaysinh",
                  "Gioitinh",
                  "Sodienthoai",
                ],
              },
            ],
          },
        ],
      });

      // Fetch checklist done items
      const checklistDoneItems = await Tb_checklistchitietdone.findAll({
        attributes: ["Description", "isDelete", "ID_ChecklistC"],
        where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
      });

      const arrPush = [];

      // Add status to dataChecklistChiTiet items if length > 0
      if (dataChecklistChiTiet.length > 0) {
        dataChecklistChiTiet.forEach((item) => {
          arrPush.push({ ...item.dataValues, status: 0 });
        });
      }

      // Extract all ID_Checklist from checklistDoneItems and fetch related data
      let checklistIds = [];
      if (checklistDoneItems.length > 0) {
        checklistDoneItems.forEach((item) => {
          const descriptionArray = JSON.parse(item.dataValues.Description);
          if (Array.isArray(descriptionArray)) {
            descriptionArray.forEach((description) => {
              const splitByComma = description.split(",");
              splitByComma.forEach((splitItem) => {
                const [ID_Checklist] = splitItem.split("/");
                checklistIds.push(parseInt(ID_Checklist));
              });
            });
          } else {
            console.log("descriptionArray is not an array.");
          }
        });
      }

      let initialChecklistIds = checklistIds.filter((id) => !isNaN(id));

      // Fetch related checklist data
      const relatedChecklists = await Ent_checklist.findAll({
        attributes: [
          "ID_Checklist",
          "ID_Hangmuc",
          "ID_Tang",
          "Sothutu",
          "Maso",
          "MaQrCode",
          "Checklist",
          "Giatridinhdanh",
          "isCheck",
          "Giatrinhan",
        ],
        where: {
          ID_Checklist: initialChecklistIds,
        },
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
            include: [
              {
                model: Ent_khuvuc,
                attributes: [
                  "Tenkhuvuc",
                  "MaQrCode",
                  "Makhuvuc",
                  "Sothutu",

                  "ID_KhoiCV",
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
                      ],
                      where: { ID_Duan: userData.ID_Duan },
                    },
                  },
                ],
              },
              {
                model: Ent_khoicv,
                attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
              },
            ],
          },
          {
            model: Ent_tang,
            attributes: ["Tentang"],
          },
          {
            model: Ent_user,
            attributes: [
              "UserName",
              "Email",
              "Hoten",
              "Ngaysinh",
              "Gioitinh",
              "Sodienthoai",
            ],
          },
        ],
      });

      // Merge checklistDoneItems data into arrPush
      checklistDoneItems.forEach((item) => {
        const descriptionArray = JSON.parse(item.dataValues.Description);
        if (Array.isArray(descriptionArray)) {
          descriptionArray.forEach((description) => {
            const splitByComma = description.split(",");
            splitByComma.forEach((splitItem) => {
              const [ID_Checklist, valueCheck, gioht] = splitItem.split("/");
              const relatedChecklist = relatedChecklists.find(
                (rl) => rl.ID_Checklist === parseInt(ID_Checklist)
              );
              if (relatedChecklist) {
                arrPush.push({
                  ID_Checklist: parseInt(ID_Checklist),
                  Ketqua: valueCheck,
                  Gioht: gioht,
                  status: 1,
                  ent_checklist: relatedChecklist,
                });
              }
            });
          });
        }
      });

      const dataChecklistC = await Tb_checklistc.findByPk(ID_ChecklistC, {
        attributes: [
          "Ngay",
          "ID_KhoiCV",
          "ID_Duan",
          "Tinhtrang",
          "Giobd",
          "Giokt",
          "ID_User",
          "ID_Calv",
          "isDelete",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["Duan"],
          },
          {
            model: Ent_khoicv,
            attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
          },
          {
            model: Ent_calv,
            attributes: ["Tenca"],
          },
          {
            model: Ent_user,
            include: {
              model: Ent_chucvu,
              attributes: ["Chucvu"],
            },
            attributes: ["UserName", "Email"],
          },
          {
            model: Ent_user,
            attributes: ["ID_User", "Hoten", "ID_Chucvu"],
          },
        ],
        where: {
          isDelete: 0,
        },
      });

      res.status(200).json({
        message: "Danh sách checklist",
        data: arrPush,
        dataChecklistC: dataChecklistC,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.checklistYear = async (req, res) => {
  try {
    const userData = req.user.data;
    const year = req.query.year || new Date().getFullYear(); // Get the year from the request, default to current year
    const khoi = req.query.khoi;
    if (!userData) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    // Define the where clause for the query
    let whereClause = {
      isDelete: 0,
      ID_Duan: userData.ID_Duan,
      Ngay: {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      },
    };

    if (khoi !== "all") {
      whereClause.ID_KhoiCV = khoi;
    }

    // Fetch related checklist data
    const relatedChecklists = await Tb_checklistc.findAll({
      attributes: [
        [Sequelize.fn("MONTH", Sequelize.col("Ngay")), "month"],
        [Sequelize.fn("SUM", Sequelize.col("TongC")), "totalChecklist"],
        [Sequelize.fn("SUM", Sequelize.col("Tong")), "total"],
      ],
      where: whereClause,
      group: [Sequelize.fn("MONTH", Sequelize.col("Ngay"))],
      raw: true,
    });

    // Process the data to match the required format
    let totalChecklistData = Array(12).fill(0);
    let totalData = Array(12).fill(0);

    relatedChecklists.forEach((item) => {
      const month = item.month - 1; // Adjust for zero-based index
      totalChecklistData[month] = item.totalChecklist;
      totalData[month] = item.total;
    });

    // Format the result as required
    const result = {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      series: [
        {
          type: String(year),
          data: [
            {
              name: "Kiểm tra",
              data: totalChecklistData,
            },
            {
              name: "Tổng",
              data: totalData,
            },
          ],
        },
      ],
    };

    res.status(200).json({
      message: "Danh sách checklist",
      data: result,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.checklistPercent = async (req, res) => {
  try {
    const userData = req.user.data;

    if (!userData) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereClause = {
      isDelete: 0,
      ID_Duan: userData.ID_Duan,
    };

    const results = await Tb_checklistc.findAll({
      include: [
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
      ],
      attributes: [
        [sequelize.col("ent_khoicv.KhoiCV"), "label"],
        [sequelize.col("tb_checklistc.tongC"), "totalAmount"],
        [
          sequelize.literal("tb_checklistc.tongC / tb_checklistc.tong * 100"),
          "value",
        ],
      ],
      where: whereClause,
    });

    // Chuyển đổi dữ liệu kết quả sang định dạng mong muốn
    const data = results.map((result) => {
      const { label, totalAmount, value } = result.get();
      return {
        label,
        totalAmount,
        value,
      };
    });
    processData(data).then((finalData) => {
      res.status(200).json({
        message: "Dữ liệu!",
        data: finalData,
      });
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.top3kythuatMaxMin = async (req, res) => {
  try {
    // Get the start and end dates for the past month
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    // Fetch all checklistC data for the past month
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "Tong",
        "TongC",
        "Ngay",
        "ID_KhoiCV",
        "ID_Calv",
        "ID_User",
      ],
      include: [
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
        {
          model: Ent_user,
          attributes: ["ID_User", "Hoten", "ID_Chucvu"],
        },
        {
          model: Ent_calv,
          attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
        },
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom"],
          include: [
            {
              model: Ent_nhom,
              attributes: ["Nhom"],
            },
          ],
        },
      ],
      where: {
        ID_KhoiCV: 2,
        Ngay: {
          [Op.between]: [startDate, endDate],
        },
        ID_Duan: {
          [Op.notIn]: [10, 17],
        },
      },
    });

    // Calculate total checklist and completed checklist for each project
    const projectCompletionRates = dataChecklistCs.reduce((acc, checklistC) => {
      const projectId = checklistC.ID_Duan;

      if (!acc[projectId]) {
        acc[projectId] = {
          projectTeam: checklistC.ent_duan.ent_nhom.Nhom,
          projectName: checklistC.ent_duan.Duan,
          totalChecklists: 0,
          completedChecklists: 0,
          totalChecklistsSessions: 0,
        };
      }

      acc[projectId].totalChecklists += checklistC.Tong || 0;
      acc[projectId].completedChecklists += checklistC.TongC || 0;
      acc[projectId].totalChecklistsSessions += 1;

      return acc;
    }, {});

    // Calculate completion rates
    const projectCompletionRatesArray = Object.keys(projectCompletionRates).map(
      (projectId) => {
        const projectData = projectCompletionRates[projectId];
        const completionRate = projectData.totalChecklists
          ? (projectData.completedChecklists / projectData.totalChecklists) *
            100
          : 0;

        return {
          projectId: parseInt(projectId),
          projectTeam: projectData.projectTeam,
          projectName: projectData.projectName,
          totalChecklists: projectData.totalChecklists,
          completedChecklists: projectData.completedChecklists,
          completionRate: completionRate.toFixed(2), // Format as percentage
          totalChecklistsSessions: projectData.totalChecklistsSessions,
        };
      }
    );

    // Sort projects by completion rate
    projectCompletionRatesArray.sort(
      (a, b) => b.completionRate - a.completionRate
    );

    res.status(200).json({
      message: "Tỷ lệ hoàn thành của các dự án",
      data: projectCompletionRatesArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getChecklistsErrorFromYesterday = async (req, res) => {
  try {
    // Get the date for yesterday
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Fetch all checklistC data for yesterday, excluding projects 10 and 17
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "Tong",
        "TongC",
        "Ngay",
        "ID_KhoiCV",
        "ID_Calv",
        "ID_User",
      ],
      include: [
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
        {
          model: Ent_user,
          attributes: ["ID_User", "Hoten", "ID_Chucvu"],
        },
        {
          model: Ent_calv,
          attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
        },
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom"],
          include: [
            {
              model: Ent_nhom,
              attributes: ["Nhom"],
            },
          ],
        },
      ],
      where: {
        Ngay: yesterday,
        ID_Duan: {
          [Op.notIn]: [10, 17],
        },
      },
    });

    // Fetch checklist detail items for the related checklistC
    const checklistDetailItems = await Tb_checklistchitiet.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Checklist",
        "Ketqua",
        "Anh",
        "Ghichu",
        "Gioht",
      ],
      where: {
        ID_ChecklistC: {
          [Op.in]: dataChecklistCs.map(
            (checklistC) => checklistC.ID_ChecklistC
          ),
        },
        Anh: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
        Ghichu: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
      },
      include: [
        {
          model: Tb_checklistc,
          attributes: [
            "ID_ChecklistC",
            "ID_Hangmucs",
            "ID_Duan",
            "ID_KhoiCV",
            "ID_Calv",

            "ID_User",
            "Ngay",
            "Tong",
            "TongC",
            "Giobd",
            "Giochupanh1",
            "Anh1",
            "Giochupanh2",
            "Anh2",
            "Giochupanh3",
            "Anh3",
            "Giochupanh4",
            "Anh4",
            "Giokt",
            "Ghichu",
            "Tinhtrang",
            "isDelete",
          ],
          include: [
            {
              model: Ent_khoicv,
              attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
            },
            {
              model: Ent_user,
              attributes: ["ID_User", "Hoten", "ID_Chucvu"],
            },
            {
              model: Ent_calv,
              attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
            },
          ],
        },
        {
          model: Ent_checklist,
          attributes: [
            "ID_Checklist",
            "ID_Khuvuc",
            "ID_Hangmuc",
            "ID_Tang",
            "Sothutu",
            "Maso",
            "MaQrCode",
            "Checklist",
            "Giatridinhdanh",
            "isCheck",
            "Giatrinhan",
          ],
          include: [
            {
              model: Ent_khuvuc,
              attributes: ["Tenkhuvuc", "MaQrCode", "Makhuvuc", "Sothutu"],

              include: [
                {
                  model: Ent_toanha,
                  attributes: ["Toanha", "ID_Duan"],

                  include: [
                    {
                      model: Ent_duan,
                      attributes: ["Duan", "ID_Nhom"],
                      include: [
                        {
                          model: Ent_nhom,
                          attributes: ["Nhom"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              model: Ent_hangmuc,
              attributes: [
                "Hangmuc",
                "Tieuchuankt",
                "ID_Khuvuc",
                "MaQrCode",
                "ID_KhoiCV",
                "ID_KhoiCV",
                "FileTieuChuan",
              ],
            },
            {
              model: Ent_tang,
              attributes: ["Tentang"],
            },
            {
              model: Ent_user,
              attributes: [
                "UserName",
                "Email",
                "Hoten",
                "Ngaysinh",
                "Gioitinh",
                "Sodienthoai",
              ],
            },
          ],
        },
      ],
    });

    // Create a dictionary to aggregate data by project
    const result = {};

    dataChecklistCs.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const projectName = checklistC.ent_duan.Duan;

      // Initialize project data if it doesn't exist
      if (!result[projectId]) {
        result[projectId] = {
          projectId,
          projectName,
          errorCount: 0,
          errorDetails: [],
        };
      }
    });

    // Populate error details and count errors
    checklistDetailItems.forEach((item) => {
      const projectId = dataChecklistCs.find(
        (checklistC) => checklistC.ID_ChecklistC === item.ID_ChecklistC
      ).ID_Duan;

      result[projectId].errorDetails.push({
        checklistId: item.ID_Checklist,
        checklistName: item.ent_checklist.Checklist,
        image: `https://lh3.googleusercontent.com/d/${item.Anh}=s1000?authuser=0`,
        note: item.Ghichu,
        gioht: item.Gioht,
        Ngay: item.tb_checklistc.Ngay,
        calv: item.tb_checklistc.ent_calv?.Tenca,
        Giamsat: item.tb_checklistc.ent_user.Hoten,
        khoilv: item.tb_checklistc.ent_khoicv?.KhoiCV,
      });

      result[projectId].errorCount += 1;
    });

    // Convert result object to array
    const resultArray = Object.values(result);

    res.status(200).json({
      message: "Danh sách checklist lỗi của ngày hôm qua",
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getChecklistsErrorFromWeek = async (req, res) => {
  try {
    const userData = req.user.data;

    // Get the date for yesterday
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
    const now = moment().format("YYYY-MM-DD");

    // Fetch all checklistC data for yesterday, excluding projects 10 and 17
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "Tong",
        "TongC",
        "Ngay",
        "ID_KhoiCV",
        "ID_Calv",
        "ID_User",
      ],
      include: [
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
        {
          model: Ent_user,
          attributes: ["ID_User", "Hoten", "ID_Chucvu"],
        },
        {
          model: Ent_calv,
          attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
        },
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom"],
          include: [
            {
              model: Ent_nhom,
              attributes: ["Nhom"],
            },
          ],
        },
      ],
      where: {
        Ngay: {
          [Op.between]: [yesterday, now],
        },
        ID_Duan: userData.ID_Duan,
      },
    });

    // Fetch checklist detail items for the related checklistC
    const checklistDetailItems = await Tb_checklistchitiet.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Checklist",
        "Ketqua",
        "Anh",
        "Ghichu",
        "Gioht",
      ],
      where: {
        ID_ChecklistC: {
          [Op.in]: dataChecklistCs.map(
            (checklistC) => checklistC.ID_ChecklistC
          ),
        },
        Anh: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
        Ghichu: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
      },
      include: [
        {
          model: Tb_checklistc,
          attributes: [
            "ID_ChecklistC",
            "ID_Hangmucs",
            "ID_Duan",
            "ID_KhoiCV",
            "ID_Calv",

            "ID_User",
            "Ngay",
            "Tong",
            "TongC",
            "Giobd",
            "Giochupanh1",
            "Anh1",
            "Giochupanh2",
            "Anh2",
            "Giochupanh3",
            "Anh3",
            "Giochupanh4",
            "Anh4",
            "Giokt",
            "Ghichu",
            "Tinhtrang",
            "isDelete",
          ],
          include: [
            {
              model: Ent_khoicv,
              attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
            },
            {
              model: Ent_user,
              attributes: ["ID_User", "Hoten", "ID_Chucvu"],
            },
            {
              model: Ent_calv,
              attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
            },
          ],
        },
        {
          model: Ent_checklist,
          attributes: [
            "ID_Checklist",
            "ID_Khuvuc",
            "ID_Hangmuc",
            "ID_Tang",
            "Sothutu",
            "Maso",
            "MaQrCode",
            "Checklist",
            "Giatridinhdanh",
            "isCheck",
            "Giatrinhan",
          ],
          include: [
            {
              model: Ent_khuvuc,
              attributes: ["Tenkhuvuc", "MaQrCode", "Makhuvuc", "Sothutu"],

              include: [
                {
                  model: Ent_toanha,
                  attributes: ["Toanha", "ID_Duan"],

                  include: [
                    {
                      model: Ent_duan,
                      attributes: ["Duan", "ID_Nhom"],
                      include: [
                        {
                          model: Ent_nhom,
                          attributes: ["Nhom"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              model: Ent_hangmuc,
              attributes: [
                "Hangmuc",
                "Tieuchuankt",
                "ID_Khuvuc",
                "MaQrCode",
                "ID_KhoiCV",
                "FileTieuChuan",
                "ID_KhoiCV",
              ],
            },
            {
              model: Ent_tang,
              attributes: ["Tentang"],
            },
            {
              model: Ent_user,
              attributes: [
                "UserName",
                "Email",
                "Hoten",
                "Ngaysinh",
                "Gioitinh",
                "Sodienthoai",
              ],
            },
          ],
        },
      ],
    });

    // Create a dictionary to aggregate data by project
    const result = {};

    dataChecklistCs.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const projectName = checklistC.ent_duan.Duan;

      // Initialize project data if it doesn't exist
      if (!result[projectId]) {
        result[projectId] = {
          projectId,
          projectName,
          errorCount: 0,
          errorDetails: [],
        };
      }
    });

    // Populate error details and count errors
    checklistDetailItems.forEach((item) => {
      const projectId = dataChecklistCs.find(
        (checklistC) => checklistC.ID_ChecklistC === item.ID_ChecklistC
      ).ID_Duan;

      result[projectId].errorDetails.push({
        checklistId: item.ID_Checklist,
        checklistName: item.ent_checklist.Checklist,
        Anh: item.Anh,
        image: `https://lh3.googleusercontent.com/d/${item.Anh}=s1000?authuser=0`,
        note: item.Ghichu,
        gioht: item.Gioht,
        Ngay: item.tb_checklistc.Ngay,
        calv: item.tb_checklistc.ent_calv?.Tenca,
        Giamsat: item.tb_checklistc.ent_user.Hoten,
        khoilv: item.tb_checklistc.ent_khoicv?.KhoiCV,
      });

      result[projectId].errorCount += 1;
    });

    // Convert result object to array
    const resultArray = Object.values(result);

    res.status(200).json({
      message: "Danh sách checklist lỗi một tuần",
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getChecklistsError = async (req, res) => {
  try {
    const userData = req.user.data;
    const orConditions = [];
    orConditions.push({
      "$ent_hangmuc.ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
    });

    console.log("userData.ID_Duan", userData.ID_Duan);

    // Fetch all checklistC data for yesterday, excluding projects 10 and 17
    const dataChecklistCs = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Tinhtrang",
        "Checklist",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
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
            "ID_KhoiCV",
            "ID_KhoiCV",
            "ID_Khuvuc",
            "FileTieuChuan",
          ],
          include: [
            {
              model: Ent_khuvuc,
              attributes: ["Tenkhuvuc", "MaQrCode", "Makhuvuc", "Sothutu"],

              include: [
                {
                  model: Ent_toanha,
                  attributes: ["Toanha", "ID_Duan"],
                  include: [
                    {
                      model: Ent_duan,
                      attributes: ["Duan", "ID_Nhom", "ID_Duan"],
                      include: [
                        {
                          model: Ent_nhom,
                          attributes: ["Nhom"],
                        },
                      ],
                      where: {
                        ID_Duan: userData.ID_Duan,
                      },
                    },
                  ],
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
          attributes: [
            "UserName",
            "Email",
            "Hoten",
            "Ngaysinh",
            "Gioitinh",
            "Sodienthoai",
          ],
        },
      ],
      where: {
        Tinhtrang: 1,
        isDelete: 0,
        [Op.and]: [orConditions],
      },
    });

    // Convert result object to array
    const resultArray = Object.values(dataChecklistCs);

    res.status(200).json({
      message: "Danh sách checklist lỗi trong dự án",
      count: dataChecklistCs.length,
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getProjectsChecklistStatus = async (req, res) => {
  try {
    // Get the date for yesterday
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Fetch all checklistC data for yesterday, excluding projects 10 and 17
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: ["ID_ChecklistC", "ID_Duan", "Ngay"],
      where: {
        Ngay: yesterday,
        ID_Duan: {
          [Op.notIn]: [10, 17],
        },
      },
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan"],
        },
      ],
    });

    // Fetch all checklist detail items for the related checklistC
    const checklistDetailItems = await Tb_checklistchitiet.findAll({
      attributes: ["ID_ChecklistC"],
      where: {
        ID_ChecklistC: {
          [Op.in]: dataChecklistCs.map(
            (checklistC) => checklistC.ID_ChecklistC
          ),
        },
      },
    });

    // Create a dictionary to aggregate data by project
    const result = {};

    dataChecklistCs.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const projectName = checklistC.ent_duan.Duan;

      // Initialize project data if it doesn't exist
      if (!result[projectId]) {
        result[projectId] = {
          projectId,
          projectName,
          createdShifts: 0,
          shiftsWithoutChecklist: 0,
        };
      }

      // Increment created shifts
      result[projectId].createdShifts += 1;
    });

    // Populate shifts without checklist
    dataChecklistCs.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const checklistExists = checklistDetailItems.some(
        (item) => item.ID_ChecklistC === checklistC.ID_ChecklistC
      );

      if (!checklistExists) {
        result[projectId].shiftsWithoutChecklist += 1;
      }
    });

    // Convert result object to array
    const resultArray = Object.values(result);

    res.status(200).json({
      message:
        "Trạng thái ca làm việc và checklist của các dự án trong ngày hôm qua",
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

// const projectCompletionRates = dataChecklistCs.map((checklistC) =>
//   { const projectId = checklistC.ID_Duan;
//     const totalChecklistCount = dataChecklistChiTiet.filter( (item) => item.ID_ChecklistC === checklistC.ID_ChecklistC ).length;
//     const completedChecklistCount = arrPush.filter( (item) => item.ent_checklist.ID_Duan === projectId ).length;
//     const completionRate = (completedChecklistCount / totalChecklistCount) * 100;
//     return { projectId: projectId, projectName: checklistC.ent_duan.Duan, totalChecklistCount, completedChecklistCount, completionRate: completionRate.toFixed(2)
//       // Format as percentage
//        }; }); res.status(200).json({ message: "Tỉ lệ hoàn thành của các dự án", data: projectCompletionRates, });

exports.checklistKhoiCVPercent = async (req, res) => {
  try {
    const userData = req.user.data;

    if (!userData) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereClause = {
      isDelete: 0,
      ID_Duan: userData.ID_Duan,
    };
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.fileChecklistSuCo = async (req, res) => {
  try {
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.createExcelFile = async (req, res) => {
  try {
    const list_IDChecklistC = req.body.list_IDChecklistC || [];
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const tenBoPhan = req.body.tenBoPhan;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Checklist Report");

    let whereClause = {
      isDelete: 0,
      ID_ChecklistC: {
        [Op.in]: list_IDChecklistC,
      },
    };

    const dataChecklistC = await Tb_checklistchitiet.findAll({
      attributes: [
        "ID_Checklistchitiet",
        "ID_ChecklistC",
        "ID_Checklist",
        "Ketqua",
        "Anh",
        "Gioht",
        "Ghichu",
        "isDelete",
      ],
      include: [
        {
          model: Tb_checklistc,
          attributes: [
            "ID_ChecklistC",
            "ID_Hangmucs",
            "ID_Duan",
            "ID_KhoiCV",
            "ID_Calv",

            "ID_User",
            "Ngay",
            "Tong",
            "TongC",
            "Giobd",
            "Giochupanh1",
            "Anh1",
            "Giochupanh2",
            "Anh2",
            "Giochupanh3",
            "Anh3",
            "Giochupanh4",
            "Anh4",
            "Giokt",
            "Ghichu",
            "Tinhtrang",
            "isDelete",
          ],
          include: [
            {
              model: Ent_khoicv,
              attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
            },
            {
              model: Ent_user,
              attributes: ["ID_User", "Hoten", "ID_Chucvu"],
            },
            {
              model: Ent_calv,
              attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
            },
          ],
        },
        {
          model: Ent_checklist,
          attributes: [
            "ID_Checklist",
            "ID_Khuvuc",
            "ID_Hangmuc",
            "ID_Tang",
            "Sothutu",
            "Maso",
            "MaQrCode",
            "Checklist",
            "Giatridinhdanh",
            "isCheck",
            "Giatrinhan",
          ],
          include: [
            {
              model: Ent_khuvuc,
              attributes: ["Tenkhuvuc", "MaQrCode", "Makhuvuc", "Sothutu"],

              include: [
                {
                  model: Ent_toanha,
                  attributes: ["Toanha", "ID_Duan"],

                  include: [
                    {
                      model: Ent_duan,
                      attributes: ["Duan"],
                    },
                  ],
                },
              ],
            },
            {
              model: Ent_hangmuc,
              attributes: [
                "Hangmuc",
                "Tieuchuankt",
                "ID_Khuvuc",
                "MaQrCode",
                "ID_KhoiCV",
                "ID_KhoiCV",
                "FileTieuChuan",
                "isDelete",
              ],
            },
            {
              model: Ent_tang,
              attributes: ["Tentang"],
            },
            {
              model: Ent_user,
              attributes: [
                "UserName",
                "Email",
                "Hoten",
                "Ngaysinh",
                "Gioitinh",
                "Sodienthoai",
              ],
            },
          ],
        },
      ],
      where: whereClause,
    });

    worksheet.columns = [
      { header: "STT", key: "stt", width: 5 },
      { header: "Checklist", key: "checklist", width: 25 },
      { header: "Tầng", key: "tang", width: 10 },
      { header: "Khu vực", key: "khuvuc", width: 15 },
      { header: "Hạng mục", key: "hangmuc", width: 15 },
      { header: "Ngày", key: "ngay", width: 15 },
      { header: "Ca", key: "ca", width: 10 },
      { header: "Nhân viên", key: "nhanvien", width: 20 },
      { header: "Ghi nhận lỗi", key: "ghinhanloi", width: 20 },
      { header: "Thời gian lỗi", key: "thoigianloi", width: 20 },
      { header: "Hình ảnh", key: "hinhanh", width: 100, height: 100 },
      { header: "Ghi chú", key: "ghichuloi", width: 20 },
      { header: "Tình trạng xử lý", key: "tinhtrang", width: 20 },
    ];

    worksheet.mergeCells("A1:J1");
    const headerRow = worksheet.getCell("A1");
    headerRow.value = "BÁO CÁO CHECKLIST CÓ VẤN ĐỀ";
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.font = { size: 16, bold: true };

    worksheet.mergeCells("A3:B3");
    worksheet.getCell("A3").value = startDate
      ? `Từ ngày: ${moment(startDate).format("DD/MM/YYYY")}`
      : `Từ ngày:`;

    worksheet.mergeCells("C3:D3");
    worksheet.getCell("C3").value = endDate
      ? `Đến ngày: ${moment(endDate).format("DD/MM/YYYY")}`
      : `Đến ngày:`;

    worksheet.mergeCells("E3:F3");
    worksheet.getCell("E3").value = `Tên Bộ phận: ${tenBoPhan}`;

    const tableHeaderRow = worksheet.getRow(5);
    tableHeaderRow.values = [
      "STT",
      "Checklist",
      "Tầng",
      "Khu vực",
      "Hạng mục",
      "Ngày",
      "Ca",
      "Nhân viên",
      "Ghi nhận lỗi",
      "Thời gian lỗi",
      "Hình ảnh",
      "Đường dẫn ảnh",
      "Ghi chú",
      "Tình trạng xử lý",
    ];
    tableHeaderRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    for (let i = 0; i < dataChecklistC.length; i++) {
      const rowIndex = i + 6; // Adjust for header rows

      // Add text data to the row
      worksheet.addRow([
        i + 1,
        dataChecklistC[i]?.ent_checklist?.Checklist,
        dataChecklistC[i]?.ent_checklist?.ent_tang?.Tentang,
        dataChecklistC[i]?.ent_checklist?.ent_khuvuc?.Tenkhuvuc,
        dataChecklistC[i]?.ent_checklist?.ent_hangmuc?.Hangmuc,
        dataChecklistC[i]?.tb_checklistc?.Ngay,
        dataChecklistC[i]?.tb_checklistc?.ent_calv?.Tenca,
        dataChecklistC[i]?.tb_checklistc?.ent_user?.Hoten,
        dataChecklistC[i]?.Ketqua,
        dataChecklistC[i]?.Gioht,
        "", // Placeholder for the image
        `https://lh3.googleusercontent.com/d/${dataChecklistC[i]?.Anh}=s1000?authuser=0`,
        dataChecklistC[i]?.Ghichu,
        dataChecklistC[i]?.ent_checklist?.Tinhtrang == 1
          ? "Chưa xử lý"
          : "Đã xử lý",
      ]);

      // Download the image and add it to the Excel file
      if (dataChecklistC[i]?.Anh) {
        const imageUrl = `https://lh3.googleusercontent.com/d/${dataChecklistC[i]?.Anh}=s1000?authuser=0`;
        const imagePath = path.join(__dirname, `image_${i}.png`);

        // Download the image
        const response = await axios({
          url: imageUrl,
          responseType: "arraybuffer",
        });

        fs.writeFileSync(imagePath, response.data);

        // Add image to the worksheet
        const imageId = workbook.addImage({
          filename: imagePath,
          extension: "png",
        });

        worksheet.addImage(imageId, {
          tl: { col: 10, row: rowIndex - 1 },
          ext: { width: 100, height: 100 },
        });
      }
    }

    // Generate the Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Clean up the downloaded images
    for (let i = 0; i < dataChecklistC.length; i++) {
      const imagePath = path.join(__dirname, `image_${i}.png`);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Checklist_Report.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

async function processData(data) {
  const aggregatedData = {};

  data.forEach((item) => {
    const { label, totalAmount, value } = item;

    if (!aggregatedData[label]) {
      aggregatedData[label] = {
        totalAmount: 0,
        totalValue: 0,
        count: 0,
      };
    }

    aggregatedData[label].totalAmount += totalAmount;
    if (value !== null) {
      aggregatedData[label].totalValue += parseFloat(value);
      aggregatedData[label].count++;
    }
  });

  const finalData = [];

  for (const label in aggregatedData) {
    const { totalAmount, totalValue, count } = aggregatedData[label];
    finalData.push({
      label,
      totalAmount,
      value: count > 0 ? (totalValue / count).toFixed(4) : null,
    });
  }

  return finalData;
}

// cron job
cron.schedule("0 * * * *", async function () {
  console.log("---------------------");
  console.log("Running Cron Job");

  const currentDateTime = new Date();
  const currentDateString = currentDateTime.toISOString().split("T")[0];

  // Tính toán ngày hiện tại trừ đi 1 ngày
  const yesterdayDateTime = new Date(currentDateTime);
  yesterdayDateTime.setDate(currentDateTime.getDate() - 4);
  const yesterdayDateString = yesterdayDateTime.toISOString().split("T")[0];

  try {
    // Tìm các bản ghi thoả mãn điều kiện
    const results = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Calv",

        "ID_User",
        "Ngay",
        "Tong",
        "TongC",
        "Giobd",
        "Giochupanh1",
        "Anh1",
        "Giochupanh2",
        "Anh2",
        "Giochupanh3",
        "Anh3",
        "Giochupanh4",
        "Anh4",
        "Giokt",
        "Ghichu",
        "Tinhtrang",
        "isDelete",
      ],
      include: [
        {
          model: Ent_calv,
          attributes: ["Giobatdau", "Gioketthuc"],
        },
      ],
      where: {
        isDelete: 0,
        Tinhtrang: 0,
        Ngay: {
          [Op.between]: [yesterdayDateString, currentDateString],
        },
      },
    });

    const formattedTime = currentDateTime.toLocaleTimeString("en-GB", {
      hour12: false,
    });

    const updates = results.map((record) => {
      const { Gioketthuc, Giobatdau } = record.ent_calv;
      const gioketthucDateTime = new Date(`${record.Ngay}T${Gioketthuc}`);
      const giobatdauDateTime = new Date(`${record.Ngay}T${Giobatdau}`);

      if (
        giobatdauDateTime < gioketthucDateTime &&
        currentDateTime >= gioketthucDateTime
      ) {
        return Tb_checklistc.update(
          { Tinhtrang: 1, Giokt: formattedTime },
          { where: { ID_ChecklistC: record.ID_ChecklistC } }
        );
      }

      if (
        giobatdauDateTime >= gioketthucDateTime &&
        currentDateTime < giobatdauDateTime &&
        currentDateTime >= gioketthucDateTime
      ) {
        return Tb_checklistc.update(
          { Tinhtrang: 1, Giokt: formattedTime },
          { where: { ID_ChecklistC: record.ID_ChecklistC } }
        );
      }
    });

    await Promise.all(updates);
    console.log("Cron job completed successfully");
    console.log("============================");
  } catch (error) {
    console.error("Error running cron job:", error);
  }
});
