const Ent_duan = require("./ent_duan.model");
const Ent_toanha = require("./ent_toanha.model");
const Ent_calv = require("./ent_calv.model");
const Ent_hangmuc = require("./ent_hangmuc.model");
const Ent_checklist = require("./ent_checklist.model");
const Ent_chucvu = require("./ent_chucvu.model");
const Ent_khoicv = require("./ent_khoicv.model");
const Ent_khuvuc = require("./ent_khuvuc.model");
const Ent_tang = require("./ent_tang.model");
const Ent_user = require("./ent_user.model");
const Tb_checklistc = require("./tb_checklistc.model");
const Tb_checklistchitiet = require("./tb_checklistchitiet.model");
const Tb_checklistchitietdone = require("./tb_checklistchitietdone.model");
const Tb_sucongoai = require("./tb_sucongoai.model");
const Ent_ChecklistReplace = require('./ent_checklistreplace.model')
const Ent_nhom = require('./ent_nhom.model')
const Ent_khuvuc_khoicv = require('./ent_khuvuc_khoicv.model')
const Ent_thietlapca = require('./ent_thietlapca.model')
const Ent_duan_khoicv = require('./ent_duan_khoicv.model')

//Duan an + khoi cv  ====================================================================
Ent_duan.hasMany(Ent_duan_khoicv, {as: "ent_duan_khoicv",foreignKey: 'ID_Duan'})
Ent_duan_khoicv.belongsTo(Ent_duan, {foreignKey: "ID_Duan"})

Ent_khoicv.hasMany(Ent_duan_khoicv, {as: "ent_duan_khoicv",foreignKey: 'ID_KhoiCV'})
Ent_duan_khoicv.belongsTo(Ent_khoicv, {foreignKey: "ID_KhoiCV"})

// Su co ngoai ===========================================================================
Ent_khuvuc_khoicv.hasMany(Tb_sucongoai, { as: "ent_khuvuc_khoicv", foreignKey: "ID_KV_CV" });
Tb_sucongoai.belongsTo(Ent_khuvuc_khoicv, { foreignKey: "ID_KV_CV" })

Ent_hangmuc.hasMany(Tb_sucongoai, { as: "ent_hangmuc", foreignKey: "ID_Hangmuc" });
Tb_sucongoai.belongsTo(Ent_hangmuc, { foreignKey: "ID_Hangmuc" })

Ent_user.hasMany(Tb_sucongoai, { as: "ent_user", foreignKey: "ID_User" });
Tb_sucongoai.belongsTo(Ent_user, { foreignKey: "ID_User" })

// Thiet lap ca ===========================================================================
Ent_khoicv.hasMany(Ent_thietlapca, { as: 'ent_khoicv', foreignKey: 'ID_KhoiCV' });
Ent_thietlapca.belongsTo(Ent_khoicv, { foreignKey: "ID_KhoiCV" })

Ent_calv.hasMany(Ent_thietlapca, { as: 'ent_calv', foreignKey: 'ID_Calv' });
Ent_thietlapca.belongsTo(Ent_calv, { foreignKey: "ID_Calv" })

Ent_duan.hasMany(Ent_thietlapca, { as: 'ent_duan', foreignKey: 'ID_Duan' });
Ent_thietlapca.belongsTo(Ent_duan, { foreignKey: "ID_Duan" })

// Du an ===========================================================================
Ent_nhom.hasMany(Ent_duan, { as: 'ent_nhom', foreignKey: 'ID_Nhom' });
Ent_duan.belongsTo(Ent_nhom, { foreignKey: 'ID_Nhom' });


// Toa nha ===========================================================================
Ent_duan.hasMany(Ent_toanha, { as: 'ent_toanha', foreignKey: 'ID_Duan' });
Ent_toanha.belongsTo(Ent_duan, { foreignKey: 'ID_Duan' });

// Tang ===========================================================================
Ent_duan.hasMany(Ent_tang, { as: "ent_tang" });
Ent_tang.belongsTo(Ent_duan, {
  foreignKey: "ID_Duan",
});

Ent_user.hasMany(Ent_tang, { as: "ent_tang" });
Ent_tang.belongsTo(Ent_user, {
  foreignKey: "ID_User",
});

// Khu vuc ===========================================================================
Ent_user.hasMany(Ent_khuvuc, { foreignKey: 'ID_User' });
Ent_khuvuc.belongsTo(Ent_user, {
  foreignKey: "ID_User",
});

Ent_khuvuc.hasMany(Ent_khuvuc_khoicv, { foreignKey: 'ID_Khuvuc' });
Ent_khuvuc_khoicv.belongsTo(Ent_khuvuc, { foreignKey: 'ID_Khuvuc' });

Ent_khoicv.hasMany(Ent_khuvuc_khoicv, { foreignKey: 'ID_KhoiCV' });
Ent_khuvuc_khoicv.belongsTo(Ent_khoicv, { foreignKey: 'ID_KhoiCV' });

Ent_toanha.hasMany(Ent_khuvuc, { as: 'ent_khuvuc', foreignKey: 'ID_Toanha' });
Ent_khuvuc.belongsTo(Ent_toanha, {
  foreignKey: "ID_Toanha",
});


// Ca lam viec ===========================================================================
Ent_duan.hasMany(Ent_calv);
Ent_calv.belongsTo(Ent_duan, {
  foreignKey: "ID_Duan",
});

Ent_khoicv.hasMany(Ent_calv);
Ent_calv.belongsTo(Ent_khoicv, {
  foreignKey: "ID_KhoiCV",
});

Ent_user.hasMany(Ent_calv);
Ent_calv.belongsTo(Ent_user, {
  foreignKey: "ID_User",
});

// User ===========================================================================
Ent_chucvu.hasMany(Ent_user);
Ent_user.belongsTo(Ent_chucvu, {
  foreignKey: "ID_Chucvu",
});

Ent_duan.hasMany(Ent_user);
Ent_user.belongsTo(Ent_duan, {
  foreignKey: "ID_Duan",
});

Ent_khoicv.hasMany(Ent_user);
Ent_user.belongsTo(Ent_khoicv, {
  foreignKey: "ID_KhoiCV",
});

// Checklist ===========================================================================
Ent_khuvuc.hasMany(Ent_checklist);
Ent_checklist.belongsTo(Ent_khuvuc, {
  foreignKey: "ID_Khuvuc",
});

Ent_hangmuc.hasMany(Ent_checklist);
Ent_checklist.belongsTo(Ent_hangmuc, {
  foreignKey: "ID_Hangmuc",
});

Ent_tang.hasMany(Ent_checklist);
Ent_checklist.belongsTo(Ent_tang, {
  foreignKey: "ID_Tang",
});


Ent_user.hasMany(Ent_checklist);
Ent_checklist.belongsTo(Ent_user, {
  foreignKey: "ID_User",
});


// Checklist Faild ===========================================================================
Ent_checklist.hasMany(Ent_ChecklistReplace, { as: 'ent_checklistreplace', foreignKey: "ID_Checklist" });
Ent_ChecklistReplace.belongsTo(Ent_checklist, {
  foreignKey: "ID_Checklist"
})

// Hạng mục ===========================================================================
Ent_khuvuc.hasMany(Ent_hangmuc, { as: 'ent_hangmuc', foreignKey: 'ID_Khuvuc' });
Ent_hangmuc.belongsTo(Ent_khuvuc, {
  foreignKey: "ID_Khuvuc",
});


//ChecklistC ===========================================================================
Ent_duan.hasMany(Tb_checklistc);
Tb_checklistc.belongsTo(Ent_duan, {
  foreignKey: "ID_Duan",
});

Ent_user.hasMany(Tb_checklistc);
Tb_checklistc.belongsTo(Ent_user, {
  foreignKey: "ID_User",
});

Ent_khoicv.hasMany(Tb_checklistc);
Tb_checklistc.belongsTo(Ent_khoicv, {
  foreignKey: "ID_KhoiCV",
});

Ent_calv.hasMany(Tb_checklistc);
Tb_checklistc.belongsTo(Ent_calv, {
  foreignKey: "ID_Calv",
});

Ent_thietlapca.hasMany(Tb_checklistc);
Tb_checklistc.belongsTo(Ent_thietlapca, {
  foreignKey: "ID_ThietLapCa",
});



// Checklist Chi tiet ===========================================================================
Ent_checklist.hasMany(Tb_checklistchitiet);
Tb_checklistchitiet.belongsTo(Ent_checklist, {
  foreignKey: "ID_Checklist",
});

Tb_checklistchitiet.belongsTo(Tb_checklistc, {
  foreignKey: 'ID_ChecklistC', // Khóa ngoại trỏ đến bảng Tb_checklistc
  as: 'tb_checklistc' // Alias (bạn có thể thay đổi tùy theo mô hình của bạn)
});

Tb_checklistc.hasMany(Tb_checklistchitiet, {
  foreignKey: 'ID_ChecklistC', // Khóa ngoại ở bảng Tb_checklistchitiet
  as: 'tb_checklistchitiets' // Alias được sử dụng trong `include`
});


// Checklist Chi tiet Done ===========================================================================
Tb_checklistc.hasMany(Tb_checklistchitietdone);
Tb_checklistchitietdone.belongsTo(Tb_checklistc, {
  foreignKey: "ID_ChecklistC",
});

module.exports = {
  Ent_toanha,
  Ent_duan,
  Ent_khuvuc,
  Ent_khoicv,
  Ent_hangmuc,
  Ent_khuvuc_khoicv,
  Ent_user,
  Ent_calv,
  Ent_chucvu,
  Ent_tang,
  Ent_checklist,
  Ent_ChecklistReplace,
  Tb_checklistc,
  Tb_checklistchitiet,
  Tb_checklistchitietdone,
  Ent_nhom,
  Ent_thietlapca,
  Tb_sucongoai,
  Ent_duan_khoicv
};
