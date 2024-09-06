const { uploadFile } = require("../middleware/auth_google");
const {
  Ent_calv,
  Ent_duan,
  Ent_khoicv,
  Ent_user,
  Ent_chucvu,
  Tb_sucongoai,
  Ent_hangmuc,
  Ent_khuvuc,
  Ent_toanha,
  Ent_khuvuc_khoicv,
} = require("../models/setup.model");
const { Op } = require("sequelize");

exports.create = async (req, res) => {
  try {
    const userData = req.user.data;
    const { body, files } = req;
    const {
      Ngaysuco,
      Giosuco,
      ID_Hangmuc,
      Noidungsuco,
      Tinhtrangxuly,
      ID_User,
    } = body;

    const uploadedFileIds = [];
    if (files) {
      for (const image of files) {
        const fileId = await uploadFile(image);
        uploadedFileIds.push({ id: fileId, name: image.originalname });
      }
    }
    const ids = uploadedFileIds.map((file) => file.id.id);

    // Nối các id lại thành chuỗi, cách nhau bằng dấu phẩy
    const idsString = ids.join(",");

    const data = {
      Ngaysuco: Ngaysuco || null,
      Giosuco: Giosuco || null,
      ID_Hangmuc: ID_Hangmuc,
      Noidungsuco: Noidungsuco || null,
      Tinhtrangxuly: Tinhtrangxuly || null,
      Duongdancacanh: idsString || null,
      ID_User: ID_User,
    };

    console.log("data", data);

    Tb_sucongoai.create(data)
      .then(() => {
        res.status(200).json({
          message: "Gửi sự cố thành công!",
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
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

    const data = await Tb_sucongoai.findAll({
      attributes: [
        "ID_Suco",
        "ID_Hangmuc",
        "Ngaysuco",
        "Giosuco",
        "Noidungsuco",
        "Duongdancacanh",
        "ID_User",
        "Tinhtrangxuly",
        "Ngayxuly",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          as: "ent_hangmuc",
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
            "ID_Khuvuc",
          ],
        },
        {
          model: Ent_user,
          attributes: ["UserName", "Email", "Hoten", "ID_Duan"],
          include: [
            {
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
            {
              model: Ent_chucvu,
              attributes: ["Chucvu"],
            },
          ],
        },
      ],
      limit: 50,
      where: {
        isDelete: 0,
        // Tinhtrangxuly: {
        //   [Op.or]: [0, 1],
        // },
      },
      order: [
        ["Tinhtrangxuly", "ASC"],
        ["Ngaysuco", "DESC"],
        
      ],
    });

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "Không có sự cố ngoài!",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Sự cố ngoài!",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Suco = req.params.id;
    const { Tinhtrangxuly } = req.body;
    if (ID_Suco && userData) {
      Tb_sucongoai.update(
        {
          Tinhtrangxuly: Tinhtrangxuly,
        },
        {
          where: {
            ID_Suco: ID_Suco,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật thành công!"
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};
