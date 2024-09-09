const {
  Ent_toanha,
  Ent_khuvuc,
  Ent_khoicv,
  Ent_duan,
  Ent_khuvuc_khoicv,
  Ent_thietlapca,
  Ent_calv,
  Ent_duan_khoicv,
  Ent_nhom,
} = require("../models/setup.model");
const { Op, Sequelize, fn, col, literal, where } = require("sequelize");

exports.create = async (req, res) => {
  try {
    const userData = req.user.data;
    const { Chuky, ID_KhoiCV, ID_Duan, Ngaybatdau } = req.body;

    if (!ID_KhoiCV || !ID_Duan || !Chuky) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
    }

    if (userData) {
      const data = {
        Chuky: Chuky,
        ID_Duan: ID_Duan,
        ID_KhoiCV: ID_KhoiCV,
        Ngaybatdau: Ngaybatdau,
      };
      // Tạo khu vực mới
      const newReturn = await Ent_duan_khoicv.create(data);

      return res.status(200).json({
        message: "Thiết lập chu kỳ thành công !",
        data: newReturn,
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
    await Ent_duan_khoicv.findAll({
      attributes: [
        "ID_Duan_KhoiCV",
        "ID_KhoiCV",
        "Chuky",
        "ID_Duan",
        "Ngaybatdau",
        "isDelete",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "Diachi", "Logo"],
          include: [
            {
              model: Ent_nhom,
              attributes: ["Tennhom"],
            },
          ],
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV"],
        },
      ],
      where: {
        isDelete: 0
      }
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
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Duan_KhoiCV = req.params.id;

    if (userData) {
      const duankhoicv = await Ent_duan_khoicv.findByPk(ID_Duan_KhoiCV, {
        attributes: [
          "ID_Duan_KhoiCV",
          "ID_KhoiCV",
          "Chuky",
          "ID_Duan",
          "Ngaybatdau",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["Duan", "Diachi", "Logo"],
            include: [
              {
                model: Ent_nhom,
                attributes: ["Tennhom"],
              },
            ],
          },
          {
            model: Ent_khoicv,
            attributes: ["KhoiCV"],
          },
        ],
      });

      if (!duankhoicv) {
        return res.status(404).json({
          message: "Không tìm thấy khối công việc ở dự án.",
        });
      }

      res.status(200).json({
        message: "Chi tiết",
        data: duankhoicv,
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
    const ID_Duan_KhoiCV = req.params.id;
    const userData = req.user.data;
    const { Chuky, ID_KhoiCV, ID_Duan, Ngaybatdau } = req.body;

    if (userData) {
      Ent_duan_khoicv.update(
        {
          Chuky: Chuky,
          ID_KhoiCV: ID_KhoiCV,
          ID_Duan: ID_Duan,
          Ngaybatdau: Ngaybatdau,
        },
        {
          where: {
            ID_Duan_KhoiCV: ID_Duan_KhoiCV,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật thành công!!!",
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

exports.delete = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      Ent_duan_khoicv.update(
        { isDelete: 1 },
        {
          where: {
            ID_Duan_KhoiCV: req.params.id,
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
