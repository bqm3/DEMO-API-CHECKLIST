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

    if (userData) {
      const data = {
        Ngaythu: Ngaythu,
        Sochecklist: Sochecklist,
        ID_Hangmucs: ID_Hangmucs,
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

// exports.get = async (req, res) => {
//   try {
//     const userData = req.user.data;
//     const orConditions = [];
//     let whereCondition = {
//       isDelete: 0,
//     };
//     if (userData) {
//       orConditions.push({ "$ent_toanha.ID_Duan$": userData?.ID_Duan });
//       if (userData?.ID_KhoiCV !== null && userData?.ID_KhoiCV !== undefined) {
//         whereCondition[Op.or] = [
//           { $ID_KhoiCVs$: { [Op.contains]: [userData?.ID_KhoiCV] } },
//         ];
//       }

//       await Ent_khuvuc.findAll({
//         attributes: [
//           "ID_Khuvuc",
//           "ID_Toanha",
//           "Sothutu",
//           "ID_KhoiCVs",
//           "Makhuvuc",
//           "MaQrCode",
//           "Tenkhuvuc",
//           "ID_User",
//           "isDelete",
//         ],
//         include: [
//           {
//             model: Ent_toanha,
//             attributes: ["Toanha", "Sotang"],
//           },
//           {
//             model: Ent_khuvuc_khoicv,
//             attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
//             include: [
//               {
//                 model: Ent_khoicv,
//                 attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
//               },
//             ],
//           },
//         ],
//         where: [
//           whereCondition,
//           {
//             [Op.and]: [orConditions],
//           },
//         ],
//         order: [["ID_Toanha", "ASC"]],
//       })
//         .then((data) => {
//           res.status(200).json({
//             message: "Danh sách khu vực!",
//             data: data,
//           });
//         })
//         .catch((err) => {
//           res.status(500).json({
//             message: err.message || "Lỗi! Vui lòng thử lại sau.",
//           });
//         });
//     }
//   } catch (err) {
//     return res.status(500).json({
//       message: err.message || "Lỗi! Vui lòng thử lại sau.",
//     });
//   }
// };

// exports.getDetail = async (req, res) => {
//   try {
//     const userData = req.user.data;
//     if (req.params.id && userData) {
//       const khuvucDetail = await Ent_khuvuc.findByPk(req.params.id, {
//         attributes: [
//           "ID_Khuvuc",
//           "ID_Toanha",
//           "Sothutu",
//           "ID_KhoiCVs",
//           "Makhuvuc",
//           "MaQrCode",
//           "Tenkhuvuc",
//           "ID_User",
//           "isDelete",
//         ],
//         include: [
//           {
//             model: Ent_toanha,
//             attributes: ["Toanha", "Sotang"],
//           },
//           {
//             model: Ent_khuvuc_khoicv,
//             attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
//             include: [
//               {
//                 model: Ent_khoicv,
//                 attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
//               },
//             ],
//           },
//         ],
//         where: {
//           isDelete: 0,
//         },
//       });

//       // Check if the data exists
//       if (!khuvucDetail) {
//         return res.status(404).json({
//           message: "Không tìm thấy khu vực!",
//         });
//       }

//       // Extract and combine the ID_KhoiCVs from ent_khuvuc_khoicvs
//       const ID_KhoiCVs = khuvucDetail.ent_khuvuc_khoicvs.map(
//         (item) => item.ID_KhoiCV
//       );

//       // Prepare the response data
//       const responseData = {
//         ID_Khuvuc: khuvucDetail.ID_Khuvuc,
//         ID_Toanha: khuvucDetail.ID_Toanha,
//         Sothutu: khuvucDetail.Sothutu,
//         Makhuvuc: khuvucDetail.Makhuvuc,
//         MaQrCode: khuvucDetail.MaQrCode,
//         Tenkhuvuc: khuvucDetail.Tenkhuvuc,
//         ID_User: khuvucDetail.ID_User,
//         isDelete: khuvucDetail.isDelete,
//         ID_KhoiCVs: ID_KhoiCVs,
//         Toanha: khuvucDetail.ent_toanha ? khuvucDetail.ent_toanha.Toanha : null,
//         Sotang: khuvucDetail.ent_toanha ? khuvucDetail.ent_toanha.Sotang : null,
//         Khoicvs: khuvucDetail.ent_khuvuc_khoicvs.map((item) => ({
//           ID_KhoiCV: item.ID_KhoiCV,
//           KhoiCV: item.Ent_khoicv ? item.ent_khoicv.KhoiCV : null,
//         })),
//       };

//       // Return the response
//       res.status(200).json({
//         message: "Khu vực chi tiết!",
//         data: responseData,
//       });
//     }
//   } catch (err) {
//     return res.status(500).json({
//       message: err.message || "Lỗi! Vui lòng thử lại sau.",
//     });
//   }
// };

// exports.update = async (req, res) => {
//   try {
//     const userData = req.user.data;
//     if (req.params.id && userData) {
//       const { ID_Toanha, Sothutu, Makhuvuc, MaQrCode, Tenkhuvuc, ID_KhoiCVs } =
//         req.body;

//       const reqData = {
//         ID_Toanha,
//         Sothutu,
//         Makhuvuc,
//         MaQrCode,
//         ID_KhoiCVs,
//         Tenkhuvuc,
//         ID_User: userData.ID_User,
//         isDelete: 0,
//       };

//       // Check if the MaQrCode is not empty and not null
//       if (MaQrCode && MaQrCode.trim() !== "") {
//         // Check if the MaQrCode is already taken by another record
//         const existingKhuvuc = await Ent_khuvuc.findOne({
//           where: {
//             [Op.and]: [
//               { MaQrCode: { [Op.not]: null, [Op.ne]: "" } },
//               { ID_Khuvuc: { [Op.ne]: req.params.id } },
//               { MaQrCode: MaQrCode },
//             ],
//           },
//         });

//         if (existingKhuvuc) {
//           return res.status(400).json({
//             message: "Mã QR Code đã tồn tại!",
//           });
//         }
//       }

//       // Update the ent_khuvuc record
//       await Ent_khuvuc.update(reqData, {
//         where: { ID_Khuvuc: req.params.id },
//       });

//       // If ID_KhoiCVs is provided, update ent_khuvuc_khoicv records
//       if (Array.isArray(ID_KhoiCVs) && ID_KhoiCVs.length > 0) {
//         // Delete old assignments for this khu vực
//         await Ent_khuvuc_khoicv.destroy({
//           where: { ID_Khuvuc: req.params.id },
//         });

//         // Create new assignments based on the provided ID_KhoiCVs
//         const assignments = ID_KhoiCVs.map((ID_KhoiCV) => ({
//           ID_Khuvuc: req.params.id,
//           ID_KhoiCV,
//         }));

//         await Ent_khuvuc_khoicv.bulkCreate(assignments);
//       }

//       // Respond with success message
//       res.status(200).json({
//         message: "Cập nhật khu vực thành công!",
//       });
//     } else {
//       res.status(400).json({
//         message: "Thiếu dữ liệu người dùng hoặc ID khu vực không hợp lệ!",
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       message: error.message || "Lỗi! Vui lòng thử lại sau.",
//     });
//   }
// };

// exports.delete = async (req, res) => {
//   try {
//     const userData = req.user.data;
//     if (req.params.id && userData) {
//       Ent_khuvuc.update(
//         { isDelete: 1 },
//         {
//           where: {
//             ID_Khuvuc: req.params.id,
//           },
//         }
//       )
//         .then((data) => {
//           res.status(200).json({
//             message: "Xóa khu vực thành công!",
//           });
//         })
//         .catch((err) => {
//           res.status(500).json({
//             message: err.message || "Lỗi! Vui lòng thử lại sau.",
//           });
//         });
//     }
//   } catch (error) {
//     res.status(500).json({
//       message: error.message || "Lỗi! Vui lòng thử lại sau.",
//     });
//   }
// };
