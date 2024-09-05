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
    const { body, files } = req;
    const {Ngaysuco, Giosuco,ID_Hangmuc, Noidungsuco,Tinhtrangsuco} = body;

    console.log('files',files)
    console.log('Ngaysuco, Giosuco,ID_Hangmuc, Noidungsuco,Tinhtrangsuco', Ngaysuco, Giosuco,ID_Hangmuc, Noidungsuco,Tinhtrangsuco)
    const uploadedFileIds = [];

    // for (let f = 0; f < files.length; f += 1) {
    //   const fileId = await uploadFile(files[f]); // Upload file and get its id
    //   uploadedFileIds.push(fileId); // Push id to array
    // }

    // // Now you can use uploadedFileIds array to save ids to database or perform any other operations

    // res.status(200).json({ message: "Form Submitted", uploadedFileIds });

    // let records = req.body;
    // let images = req.files;
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};
