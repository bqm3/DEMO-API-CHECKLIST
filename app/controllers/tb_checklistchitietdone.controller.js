const {
  Tb_checklistchitietdone,
  Tb_checklistc,
  Ent_checklist,
} = require("../models/setup.model");
const { Op, Sequelize } = require("sequelize");

exports.create = (req, res) => {
  try {
    const userData = req.user.data;

    if (!userData) {
      res.status(401).json({
        message: "Bạn không có quyền tạo dự án!",
      });
      return;
    }
    const {
      ID_Checklists,
      Description,
      checklistLength,
      ID_ChecklistC,
      Vido,
      Kinhdo,
      Docao,
      Gioht,
    } = req.body;

    if (!Description || !Gioht) {
      res.status(400).json({
        message: "Không thể checklist dữ liệu!",
      });
      return;
    }

    // Create a Tb_checklistchitietdone
    const data = {
      Description: Description || "",
      Vido: Vido || null,
      Gioht: Gioht,
      Kinhdo: Kinhdo || null,
      Docao: Docao || null,
      ID_ChecklistC: ID_ChecklistC || null,
      isDelete: 0,
    };

    // Save Tb_checklistchitietdone in the database
    Tb_checklistchitietdone.create(data)
      .then(async (createdData) => {
        try {
          // Find the checklist record to check current TongC
          const checklistC = await Tb_checklistc.findOne({
            attributes: ["ID_ChecklistC", "TongC", "Tong"],
            where: { ID_ChecklistC: ID_ChecklistC },
          });

          if (checklistC) {
            const currentTongC = checklistC.TongC;
            const totalTong = checklistC.Tong;

            if (currentTongC < totalTong) {
              // Update TongC only if it is less than Tong
              await Tb_checklistc.update(
                { TongC: Sequelize.literal(`TongC + ${checklistLength}`) },
                {
                  where: { ID_ChecklistC: ID_ChecklistC },
                }
              );
            }
          }

          // Update Ent_checklist Tinhtrang
          await Ent_checklist.update(
            { Tinhtrang: 0 },
            {
              where: {
                ID_Checklist: {
                  [Op.in]: ID_Checklists,
                },
              },
            }
          );

          res.status(200).json({
            message: "Checklist thành công!",
            data: createdData,
          });
        } catch (error) {
          res.status(500).json({
            message: error.message || "Lỗi! Vui lòng thử lại sau.",
          });
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

exports.getDataFormat = async (req, res) => {
  try {
    const checklistDoneItems = await Tb_checklistchitietdone.findAll({
      attributes: ["Description", "Gioht", "ID_ChecklistC"],
      where: { isDelete: 0 },
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

    // Trả về dữ liệu hoặc thực hiện các thao tác khác ở đây
    res.status(200).json(arrPush);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy dữ liệu." });
  }
};
