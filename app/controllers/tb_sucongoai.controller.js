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
      ID_Hangmuc:
        `${ID_Hangmuc}` !== "null" && `${ID_Hangmuc}` !== "undefined"
          ? ID_Hangmuc
          : null,
      Noidungsuco: Noidungsuco || null,
      Tinhtrangxuly: 0,
      Duongdancacanh: idsString || null,
      ID_User: ID_User,
    };

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
        "Anhkiemtra",
        "Ghichu",
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
            },
            {
              model: Ent_chucvu,
              attributes: ["Chucvu"],
            },
          ],
        },
      ],
      limit: 30,
      where: {
        isDelete: 0,
        // Tinhtrangxuly: {
        //   [Op.or]: [0, 1],
        // },
      },
      order: [
        ["Tinhtrangxuly", "ASC"],
        ["Ngaysuco", "DESC"],
        ["Ngayxuly", "DESC"],
      ],
    });

    const filteredData = data.filter((item) => {
      return item.ent_user && item.ent_user.ID_Duan == userData.ID_Duan;
    });


    if (!filteredData || filteredData.length === 0) {
      return res.status(200).json({
        message: "Không có sự cố ngoài!",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Sự cố ngoài!",
      data: filteredData,
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
    const { files } = req;
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
    const { Tinhtrangxuly, ngayXuLy, Ghichu, ID_Hangmuc } = req.body;
    if (ID_Suco && userData) {
      Tb_sucongoai.update(
        {
          Tinhtrangxuly: Tinhtrangxuly,
          Ngayxuly: ngayXuLy,
          Anhkiemtra: idsString,
          Ghichu:
            `${Ghichu}` !== "null" && `${Ghichu}` !== "undefined"
              ? Ghichu
              : null,
          ID_Hangmuc:
            `${ID_Hangmuc}` !== "null" && `${ID_Hangmuc}` !== "undefined"
              ? ID_Hangmuc
              : null,
        },
        {
          where: {
            ID_Suco: ID_Suco,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật thành công!",
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

exports.getDetail = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Suco = req.params.id;

    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const data = await Tb_sucongoai.findOne({
      attributes: [
        "ID_Suco",
        "ID_Hangmuc",
        "Ngaysuco",
        "Giosuco",
        "Noidungsuco",
        "Duongdancacanh",
        "ID_User",
        "Tinhtrangxuly",
        "Anhkiemtra",
        "Ghichu",
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
      where: {
        ID_Suco: ID_Suco, // Sử dụng giá trị cụ thể
        isDelete: 0,
      },
    });

    if (!data) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sự cố với ID này!" });
    }

    return res.status(200).json({
      message: "Thông tin sự cố",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Suco = req.params.id;
    if (ID_Suco && userData) {
      Tb_sucongoai.update(
        {
          isDelete: 1,
        },
        {
          where: {
            ID_Suco: ID_Suco,
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
    return res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.dashboardByDuAn = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const tangGiam = "desc"; // Thứ tự sắp xếp
    const userData = req.user.data;

    // Xây dựng điều kiện where cho truy vấn
    let whereClause = {
      isDelete: 0,
      "$ent_user.ID_Duan$": userData.ID_Duan,
    };

    if (year) {
      whereClause.Ngaysuco = {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      };
    }

    // Truy vấn cơ sở dữ liệu
    const relatedSucos = await Tb_sucongoai.findAll({
      attributes: [
        "ID_Hangmuc",
        "Ngaysuco",
        "Giosuco",
        "Noidungsuco",
        "ID_User",
        "Tinhtrangxuly",
        "Ngayxuly",
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
          include: [
            {
              model: Ent_khuvuc,
              required: true, // Bỏ qua nếu ent_khuvuc là null
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
                  attributes: ["Toanha", "ID_Toanha", "ID_Duan"],
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
                  },
                },
              ],
            },
          ],
        },
        {
          model: Ent_user,
          as: "ent_user",
          attributes: [
            "ID_Duan", "Hoten", "UserName", "Email", "ID_Chucvu", "isDelete"
          ],
          
        }
      ],
      where: whereClause,
    });

    // Tạo đối tượng để lưu số lượng sự cố theo trạng thái và tháng
    const tinhtrangIncidentCount = {
      "Chưa xử lý": Array(12).fill(0),
      "Đang xử lý": Array(12).fill(0),
      "Đã xử lý": Array(12).fill(0),
    };

    // Xử lý dữ liệu để đếm số lượng sự cố cho từng trạng thái theo tháng
    relatedSucos.forEach((suco) => {
      const sucoDate = new Date(suco.Ngaysuco);
      const sucoMonth = sucoDate.getMonth();

      switch (suco.Tinhtrangxuly) {
        case 0:
          tinhtrangIncidentCount["Chưa xử lý"][sucoMonth] += 1;
          break;
        case 1:
          tinhtrangIncidentCount["Đang xử lý"][sucoMonth] += 1;
          break;
        case 2:
          tinhtrangIncidentCount["Đã xử lý"][sucoMonth] += 1;
          break;
        default:
          break;
      }
    });

    // Chuyển đối tượng thành mảng kết quả
    const formatSeriesData = (data) => {
      const tinhtrangs = Object.keys(data);
      return tinhtrangs.map((tinhtrang) => ({
        name: tinhtrang,
        data: data[tinhtrang],
      }));
    };

    const formattedSeries = formatSeriesData(tinhtrangIncidentCount);

    // Sắp xếp kết quả theo tangGiam
    const sortedSeries = formattedSeries.sort((a, b) => {
      const sumA = a.data.reduce((sum, value) => sum + value, 0);
      const sumB = b.data.reduce((sum, value) => sum + value, 0);
      return tangGiam === "asc" ? sumA - sumB : sumB - sumA;
    });

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
          type: String(year), // Gán type với giá trị năm
          data: sortedSeries,
        },
      ],
    };

    // Trả về kết quả
    res.status(200).json({
      message: "Số lượng sự cố theo trạng thái và tháng",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.dashboardAll = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const tangGiam = "desc"; // Thứ tự sắp xếp

    // Xây dựng điều kiện where cho truy vấn
    let whereClause = {
      isDelete: 0,
    };

    if (year) {
      whereClause.Ngaysuco = {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      };
    }

    // Truy vấn cơ sở dữ liệu
    const relatedSucos = await Tb_sucongoai.findAll({
      attributes: [
        "ID_Hangmuc",
        "ID_User",
        "Ngaysuco",
        "Giosuco",
        "Noidungsuco",
        "ID_User",
        "Tinhtrangxuly",
        "Ngayxuly",
        "isDelete",
      ],
      where: whereClause,
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
          model: Ent_user,
          attributes: ["ID_Duan", "Hoten", "UserName"],
          include: {
            model: Ent_duan,
            attributes: ["ID_Duan", "Duan", "Diachi", "Vido", "Kinhdo", "Logo"],
          },
        },
      ],
    });

    // Tạo đối tượng để lưu số lượng sự cố theo dự án theo năm
    const projectIncidentCountByYear = {};

    // Xử lý dữ liệu để đếm số lượng sự cố theo dự án và năm
    relatedSucos.forEach((suco) => {
      const projectName = suco?.ent_user?.ent_duan?.Duan;
      const incidentYear = new Date(suco?.Ngaysuco)?.getFullYear();

      if (!projectIncidentCountByYear[incidentYear]) {
        projectIncidentCountByYear[incidentYear] = {};
      }

      if (!projectIncidentCountByYear[incidentYear][projectName]) {
        projectIncidentCountByYear[incidentYear][projectName] = 0;
      }

      projectIncidentCountByYear[incidentYear][projectName] += 1;
    });

    // Lấy danh sách tất cả các dự án
    const allProjects = Object?.values(relatedSucos)?.map(
      (suco) => suco?.ent_user?.ent_duan?.Duan
    );

    const uniqueProjects = [...new Set(allProjects)];

    // Chuyển đổi dữ liệu thành định dạng mong muốn
    const seriesData = Object?.entries(projectIncidentCountByYear)?.map(
      ([year, projectCount]) => ({
        name: year,
        data: uniqueProjects?.map((project) => projectCount[project] || 0),
      })
    );

    // Trả về kết quả
    res.status(200).json({
      message: "Số lượng sự cố theo dự án",
      // data: relatedSucos
      data: {
        categories: uniqueProjects,
        series: seriesData,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getSucoNam = async (req, res) => {
  try {
    // const year = req.query.year || new Date().getFullYear(); // Default to the current year
    const name = req.query.name;

    let whereClause = {
      isDelete: 0,
    };

    // if (year) {
    //   whereClause.Ngaysuco = {
    //     [Op.gte]: `${year}-01-01`,
    //     [Op.lte]: `${year}-12-31`,
    //   };
    // }

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
        "Anhkiemtra",
        "Ghichu",
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
              ]
            },
            {
              model: Ent_chucvu,
              attributes: ["Chucvu"],
            },
          ],
        },
      ],
      where: whereClause,
      order: [
        ["Tinhtrangxuly", "ASC"],
        ["Ngaysuco", "DESC"],
        ["Ngayxuly", "DESC"],
      ],
    });

    const filteredData = data.filter((item) => {
      return item.ent_user && item.ent_user.ent_duan && item.ent_user.ent_duan.Duan == name;
    });

    if (filteredData.length === 0) {
      return res.status(200).json({
        message: `Không tìm thấy sự cố nào cho dự án ${name}!`,
        data: [],
      });
    }

    return res.status(200).json({
      message: "Sự cố ngoài!",
      data: filteredData,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};
