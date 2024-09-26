const {
  Ent_user,
  Ent_duan,
  Ent_khoicv,
  Ent_chucvu,
} = require("../models/setup.model");
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const { Op } = require("sequelize");
const fetch = require("node-fetch");
const moment = require("moment-timezone");
const sequelize = require("../config/db.config");
const xlsx = require("xlsx");

// Login User
exports.login = async (req, res) => {
  try {
    // Check if username and password are provided
    if (!req.body.UserName || !req.body.Password) {
      return res.status(400).json({
        message: "Sai tài khoản hoặc mật khẩu. Vui lòng thử lại!!",
      });
    }

    // Find user by username
    const user = await Ent_user.findOne({
      where: {
        UserName: req.body.UserName,
      },
      attributes: [
        "ID_User",
        "UserName",
        "ID_Chucvu",
        "ID_Duan",
        "Password",
        "ID_KhoiCV",
        "Email",
        "isDelete",
      ],
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
    });

    // Check if user exists and is not deleted
    if (user && user.isDelete === 0) {
      // Compare passwords
      const passwordValid = await bcrypt.compare(
        req.body.Password,
        user.Password
      );

      if (passwordValid) {
        // Generate JWT token
        const token = jsonwebtoken.sign(
          {
            data: user,
          },
          process.env.JWT_SECRET,
          {
            algorithm: "HS256",
            expiresIn: "7d",
          }
        );

        // Set token as cookie
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        return res.status(200).json({ token: token, user: user });
      } else {
        // Incorrect password
        return res
          .status(400)
          .json({ message: "Sai mật khẩu. Vui lòng thử lại." });
      }
    } else {
      // User not found or deleted
      return res.status(400).json({
        message:
          "Bạn không thể đăng nhập. Vui lòng nhắn tin cho phòng chuyển đổi số.",
      });
    }
  } catch (err) {
    // Internal server error
    return res.status(500).json({
      message: err ? err.message : "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// Create User
exports.register = async (req, res, next) => {
  try {
    const {
      UserName,
      Password,
      ID_Chucvu,
      Hoten,
      Sodienthoai,
      Gioitinh,
      Ngaysinh,
      ID_KhoiCV,
      Email,
      ID_Duan
    } = req.body;
    if (!UserName || !Password || !ID_Chucvu) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu.",
      });
    }
    const userData = req.user.data;
    const user = await Ent_user.findOne({
      where: {
        [Op.and]: [
          { UserName: UserName },
          { Email: Email },
          {ID_Duan: ID_Duan}
        ],
      },
      attributes: [
        "ID_User",
        "UserName",
        "ID_Chucvu",
        "ID_Duan",
        "Password",
        "ID_KhoiCV",
        "Email",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan"],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu"],
        },
      ],
    });

    if (user !== null) {
      return res.status(401).json({
        message: "Tài khoản hoặc Email đã bị trùng.",
      });
    }

    const salt = genSaltSync(10);
    var data = {
      UserName: UserName,
      Email: Email,
      Password: await hashSync(Password, salt),
      ID_Chucvu: ID_Chucvu,
      ID_Duan: ID_Duan || null,
      Hoten: Hoten || null,
      Sodienthoai: Sodienthoai || null,
      Gioitinh: Gioitinh || null,
      Ngaysinh: Ngaysinh || null,
      ID_KhoiCV: ID_Chucvu == 1 || ID_Chucvu == 2 ? null : ID_KhoiCV,
      isDelete: 0,
    };

    Ent_user.create(data)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (err) {
    console.log("err", err);
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau",
    });
  }
};

// Change Password
exports.changePassword = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
    }

    const userData = req.user.data;
    if (userData) {
      const { currentPassword, newPassword } = req.body;
      const isPasswordValid = await compareSync(
        currentPassword,
        userData?.Password
      );
      if (!isPasswordValid) {
        return res.status(403).json({ message: "Sai mật khẩu" });
      }
      const now = new Date();
      const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
      const vietnamTime = new Date(utcNow + 7 * 60 * 60000);

      const year = vietnamTime.getFullYear();
      const month = String(vietnamTime.getMonth() + 1).padStart(2, "0");
      const day = String(vietnamTime.getDate()).padStart(2, "0");
      const hours = String(vietnamTime.getHours()).padStart(2, "0");
      const minutes = String(vietnamTime.getMinutes()).padStart(2, "0");
      const seconds = String(vietnamTime.getSeconds()).padStart(2, "0");

      const formattedVietnamTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      const hashedNewPassword = await hashSync(newPassword, 10);
      await Ent_user.update(
        {
          Password: hashedNewPassword,
          updateTime: formattedVietnamTime, // Add the current time to the update
        },
        {
          where: {
            ID_User: userData.ID_User,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật mật khẩu thành công!",
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

// Update user
exports.updateUser = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
    }

    const userData = req.user.data;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const {
      ID_Duan,
      ID_Chucvu,
      ID_KhoiCV,
      UserName,
      Email,
      Password,
      Hoten,
      Sodienthoai,
      Gioitinh,
    } = req.body;

    // Kiểm tra xem có dữ liệu mật khẩu được gửi không
    let updateData = {
      ID_Duan,
      ID_Chucvu,
      ID_KhoiCV: ID_KhoiCV === null || ID_KhoiCV === "" ? null : ID_KhoiCV,
      UserName,
      Hoten,
      Sodienthoai,
      Gioitinh,
      Email,
      isDelete: 0,
    };

    if (Password) {
      const hashedNewPassword = await hashSync(Password, 10);
      updateData.Password = hashedNewPassword;
    }

    await Ent_user.update(updateData, {
      where: {
        ID_User: req.params.id,
      },
    });

    return res.status(200).json({ message: "Cập nhật thông tin thành công!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

// Get All User
exports.deleteUser = async (req, res, next) => {
  try {
    const userData = req.user.data;
    if (userData) {
      await Ent_user.update(
        {
          isDelete: 1,
        },
        {
          where: {
            ID_User: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa tài khoản thành công!",
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

// Get User Online
exports.getUserOnline = async (req, res, next) => {
  try {
    const userData = req.user.data;
    let whereClause = {
      isDelete: 0,
    };

    if (userData.ID_Chucvu !== 1 || userData.ent_chucvu.Chucvu !== "PSH") {
      whereClause.ID_Duan = userData.ID_Duan;
    }

    await Ent_user.findAll({
      attributes: [
        "ID_User",
        "UserName",
        "Email",
        "Password",
        "Hoten",
        "Sodienthoai",
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Chucvu",
        "isDelete",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "Diachi", "Logo"],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu"],
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
      ],
      where: whereClause,
      order: [
        ["ID_Duan", "ASC"],
        ["ID_Chucvu", "ASC"],
      ],
    })
      .then((data) => {
        res.status(200).json({
          message: "Danh sách nhân viên!",
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
    if (userData) {
      let whereClause = {
        isDelete: 0,
      };

      if (userData.ID_Chucvu !== 1 || userData.ent_chucvu.Chucvu !== "PSH") {
        whereClause.ID_Duan = userData.ID_Duan;
      }

      await Ent_user.findByPk(req.params.id, {
        attributes: [
          "ID_User",
          "UserName",
          "Email",
          "Hoten",
          "Sodienthoai",
          "Ngaysinh",
          "Gioitinh",
          "Password",
          "ID_Duan",
          "ID_KhoiCV",
          "ID_Chucvu",
          "isDelete",
          "ID_Chucvu",
        ],
        order: [
          ["ID_Duan", "ASC"],
          ["ID_Chucvu", "ASC"],
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["Duan", "Diachi", "Logo"],
          },
          {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          {
            model: Ent_khoicv,
            attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
          },
        ],
        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Thông tin User!",
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

//get Check auth
exports.checkAuth = async (req, res, next) => {
  try {
    const userData = req.user.data;
    await Ent_user.findByPk(userData.ID_User, {
      attributes: [
        "ID_User",
        "UserName",
        "Email",
        "Password",
        "Hoten",
        "Gioitinh",
        "Sodienthoai",
        "Ngaysinh",
        "ID_Duan",
        "ID_KhoiCV",
        "deviceToken",
        "ID_Chucvu",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "Diachi", "Logo"],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu"],
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
      ],
      where: {
        isDelete: 0,
      },
    })
      .then((data) => {
        res.status(200).json({
          message: "Thông tin User!",
          data: data,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// get account checklist giam sat by du an
exports.getGiamSat = async (req, res, next) => {
  try {
    const userData = req.user.data;
    if (userData) {
      const whereCondition = {
        isDelete: 0,
        ID_Chucvu: 4,
        ID_Duan: userData.ID_Duan,
      };
      await Ent_user.findAll({
        attributes: [
          "ID_User",
          "UserName",
          "Email",

          "Password",
          "ID_Duan",
          "ID_KhoiCV",
          "ID_Chucvu",
          "isDelete",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: ["Duan", "Diachi", "Logo"],
          },
          {
            model: Ent_chucvu,
            attributes: ["Chucvu"],
          },
          {
            model: Ent_khoicv,
            attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
          },
        ],
        where: whereCondition,
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách nhân viên!",
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

exports.deviceToken = async (req, res, next) => {
  try {
    const userData = req.user.data;
    if (userData) {
      const { deviceToken } = req.body;

      // Tìm kiếm deviceToken trong bảng Ent_user
      const existingUser = await Ent_user.findOne({
        attributes: [
          "ID_User",
          "UserName",
          "Email",
          "Password",
          "ID_Duan",
          "ID_KhoiCV",
          "deviceToken",
          "ID_Chucvu",
        ],
        where: {
          deviceToken: deviceToken,
          ID_User: { [Op.ne]: userData.ID_User },
        },
      });
      console.log('existingUser', existingUser)

      // Nếu tìm thấy user khác có deviceToken này, cập nhật deviceToken của họ thành null
      if (existingUser) {
        await Ent_user.update(
          { deviceToken: null },
          {
            where: {
              ID_User: existingUser.ID_User,
            },
          }
        );
      }
      // Cập nhật deviceToken cho user hiện tại
      await Ent_user.update(
        { deviceToken: deviceToken },
        {
          where: {
            ID_User: userData.ID_User,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật device token thành công!",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });

      // return res.status(200).json({ message: "Cập nhật device token thành công!" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

async function sendPushNotification(expoPushToken, message) {
  // console.log('expoPushToken',expoPushToken)
  const payload = {
    to: expoPushToken,
    sound: "default",
    title: message.title,
    body: message.body,
    data: message.data,
  };
  // console.log('payload', payload)

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Error sending push notification: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  return data;
}

exports.notiPush = async (message) => {
  try {
    const users = await Ent_user.findAll({
      attributes: [
        "deviceToken",
        "ID_User",
        "UserName",
        "Email",
        "Password",
        "ID_Duan",
        "ID_KhoiCV",

        "ID_Chucvu",
        "isDelete",
      ],
      where: { isDelete: 0 },
    });
    // users.map((user) => console.log(user.ID_Duan, "|", user.ID_KhoiCV))
    // console.log('message.data.userData.ID_KhoiCV',message.data.userData.ID_KhoiCV)
    const tokens = users
      .filter(
        (user) =>
          user.deviceToken &&
          user.ID_Duan === message.data.userData.ID_Duan &&
          user.ID_KhoiCV == message.data.userData.ID_KhoiCV &&
          user.ID_User !== message.data.userData.ID_User
      )
      .map((user) => user.deviceToken);

    const new_message = {
      title: message.title,
      body: message.body,
      data: {
        Ketqua: message.data.Ketqua[0],
        Gioht: message.data.Gioht[0],
        Ghichu: message.data.Ghichu[0],
      },
    };
    const notificationPromises = tokens.map((token) =>
      sendPushNotification(token, new_message)
    );

    const results = await Promise.all(notificationPromises);

    return {
      success: true,
      message: "Notifications sent to all users",
      results,
    };
  } catch (error) {
    console.error("Error sending notifications:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadFileUsers = async (req, res) => {
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

        const tenKhoiCongViec = transformedItem["KHỐICÔNGVIỆC"];
        const duAn = transformedItem["DỰÁN"];
        const hoTen = transformedItem["HỌTÊN"];
        const gioiTinh = transformedItem["GIỚITÍNH"];
        const namSinh = transformedItem["NĂMSINH"];
        const soDienThoai = transformedItem["SỐĐIỆNTHOẠI"];
        const chucVu = transformedItem["CHỨCVỤ"];
        const gmail = transformedItem["GMAIL"];
        const taiKhoan = transformedItem["TÀIKHOẢN"];
        const matKhau = transformedItem["MẬTKHẨU"];

        const sanitizedTenToanha = duAn?.replace(/\t/g, ""); // Loại bỏ tất cả các ký tự tab

        const dataChucvu = await Ent_chucvu.findOne({
          attributes: ["ID_Chucvu", "Chucvu", "isDelete"],

          where: {
            Chucvu: sequelize.where(
              sequelize.fn("UPPER", sequelize.col("Chucvu")),
              "LIKE",
              chucVu.toUpperCase()
            ),
            isDelete: 0,
          },
        });
        if (!dataChucvu) {
          return res.status(500).json({
            message: "Không tìm chức vụ phù hợp",
          });
        }

        const dataKhoiCV = await Ent_khoicv.findOne({
          attributes: ["ID_KhoiCV", "KhoiCV", "isDelete"],

          where: {
            KhoiCV: sequelize.where(
              sequelize.fn("UPPER", sequelize.col("KhoiCV")),
              "LIKE",
              tenKhoiCongViec.toUpperCase()
            ),
            isDelete: 0,
          },
        });
        if (!dataKhoiCV) {
          return res.status(500).json({
            message: "Không tìm khối công việc phù hợp",
          });
        }

        
        const dataUser = await Ent_user.findOne({
          attributes: [
            "ID_User",
            "ID_Duan",
            "ID_Chucvu",
            "ID_KhoiCV",
            "isDelete",
            "Hoten",
            "UserName",
            "Email",
          ],
          where: {
            UserName: taiKhoan,
            ID_Duan: userData.ID_Duan,
            isDelete: 0,
          },
          transaction,
        });

        if (dataUser) {
          console.log(`User đã tồn tại, bỏ qua`);
          continue; // Skip the current iteration and move to the next item
        }
        const salt = genSaltSync(10);
        const dataInsert = {
          ID_Duan: userData.ID_Duan,
          ID_Chucvu: dataChucvu.ID_Chucvu,
          ID_KhoiCV: dataKhoiCV.ID_KhoiCV,
          Password: await hashSync(`${matKhau}`, salt),
          Email: gmail,
          UserName: taiKhoan,
          Hoten: hoTen,
          Gioitinh: gioiTinh,
          Sodienthoai: soDienThoai,
          Ngaysinh: namSinh,
          isDelete: 0,
        };

        await Ent_user.create(dataInsert, {
          transaction,
        });
      }
    });

    res.send({
      message: "File uploaded and data processed successfully",
      data,
    });
  } catch (err) {
    console.error("Error at line", err.stack.split("\n")[1].trim());
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
      error: err.stack,
    });
  }
};
