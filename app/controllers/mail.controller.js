const nodemailer = require("nodemailer");
const moment = require("moment");
const {
  Ent_duan,
  Ent_chucvu,
  Ent_khuvuc,
  Ent_hangmuc,
  Ent_user,
  Ent_toanha,
  Tb_sucongoai,
} = require("../models/setup.model");
const { Op } = require("sequelize");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.main = async (req, res) => {
  try {
    // Calculate the date for the filter (3 days ago)
    const dateFix = () => {
      let d = new Date();
      d.setDate(d.getDate() - 3);
      return d;
    };
    const dateFormat = dateFix().toISOString().split("T")[0];

    // Define filter criteria for incidents
    const whereList = {
      isDelete: 0,
      Ngaysuco: {
        [Op.lte]: dateFormat,
      },
      Tinhtrangxuly: 0,
    };

    // Fetch incidents
    const dataSuCoNgoai = await Tb_sucongoai.findAll({
      attributes: [
        "ID_Suco",
        "ID_Hangmuc",
        "ID_User",
        "Ngaysuco",
        "Giosuco",
        "Noidungsuco",
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
            "isDelete",
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
          ],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          attributes: ["UserName", "Email", "Hoten"],
        },
      ],
      where: whereList,
    });

    // Fetch project managers (directors)
    const dataUser = await Ent_user.findAll({
      attributes: ["ID_Duan", "Email", "Hoten", "UserName", "ID_Chucvu", "isDelete"],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "Diachi", "Logo"],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu"],
        },
      ],
      where: {
        isDelete: 0,
        ID_Chucvu: {
          [Op.in]: [2, 3], // Directors/Managers
        },
      },
    });

    // Group incidents by project (ID_Duan)
    const incidentsByProject = {};
    dataSuCoNgoai.forEach((incident) => {
      const projectId = incident.ent_hangmuc.ent_khuvuc.ent_toanha.ID_Duan;
      if (!incidentsByProject[projectId]) {
        incidentsByProject[projectId] = [];
      }
      incidentsByProject[projectId].push(incident);
    });

    // Send emails for each project
    for (const projectId in incidentsByProject) {
      // Find email recipients for the project
      const recipients = dataUser
        .filter((user) => user.ID_Duan === parseInt(projectId))
        .map((user) => user.Email);

      if (recipients.length > 0) {
        // Create email body with incidents
        const projectIncidents = incidentsByProject[projectId]
          .map(
            (incident, index) => `
            <div>
              <h3>Sự cố thứ: ${index+1}</h3>
              <p>Khu vực: ${incident.ent_hangmuc.ent_khuvuc.Tenkhuvuc}</p>
              <p>Hạng mục: ${incident.ent_hangmuc.Hangmuc}</p>
              <p>Người gửi sự cố: ${incident.ent_user.Hoten}</p>
              <p>Ngày báo cáo: ${incident.Ngaysuco}</p>
              <p>Nội dung: ${incident.Noidungsuco}</p>
              <p>Tình trạng: Chưa xử lý</p>
            </div>`
          )
          .join("");

        // Send email
        const info = await transporter.sendMail({
          from: "PMC Checklist thông báo sự cố <phongsohoa.pmc57@gmail.com>",
          to: recipients.join(","),
          subject: `Báo cáo sự cố ngoài cho dự án`,
          html: `<div>${projectIncidents}</div>`,
        });

        console.log(`Email sent to project ID ${projectId}: ${info.messageId}`);
      }
    }

    // Send response back to client
    res.status(200).json({
      message: "Đã gửi báo cáo sự cố cho các dự án",
      dataSuco: dataSuCoNgoai,
      dataUser: dataUser,
    });
  } catch (error) {
    console.error("Error while sending emails:", error);
    res.status(500).json({ message: "Lỗi trong quá trình gửi email", error });
  }
};
