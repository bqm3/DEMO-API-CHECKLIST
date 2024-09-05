const {
  Ent_calv,
  Ent_duan,
  Ent_khoicv,
  Ent_user,
  Ent_chucvu,
} = require("../models/setup.model");
const { Op } = require("sequelize");

exports.create = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      let giokt = req.body.Gioketthuc;
      let giobd = req.body.Giobatdau;
      if (!req.body.Tenca) {
        return res.status(400).json({
          message: "Cần nhập đầy đủ thông tin!",
        });
      } else if (!giobd || !giokt) {
        return res.status(400).json({
          message: "Cần có thời gian bắt đầu và kết thúc!",
        });
      }

      const reqData = {
        ID_Duan: userData.ID_Duan,
        ID_KhoiCV: req.body.ID_KhoiCV,
        Tenca: req.body.Tenca,
        Giobatdau: giobd,
        Gioketthuc: giokt,
        ID_User: userData.ID_User,
        isDelete: 0,
      };

      // Kiểm tra xem có ca làm việc nào đã tồn tại với ID_KhoiCV và Tenca tương tự không
      const existingCalv = await Ent_calv.findOne({
        where: {
          ID_KhoiCV: req.body.ID_KhoiCV,
          Tenca: req.body.Tenca,
          ID_Duan: userData.ID_Duan,
          isDelete: 0,
        },
        attributes: [
          "ID_Calv",
          "ID_KhoiCV",
          "ID_Duan",
          "Tenca",
          "Giobatdau",
          "Gioketthuc",
          "ID_User",
          "isDelete",
        ],
      });

      if (existingCalv) {
        return res.status(400).json({
          message: "Ca làm việc đã tồn tại!",
        });
      }

      // Nếu không có ca làm việc nào trùng, thêm mới
      Ent_calv.create(reqData)
        .then((data) => {
          res.status(200).json({
            message: "Tạo ca làm việc thành công!",
            data: data,
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
