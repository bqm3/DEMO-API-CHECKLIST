const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Tb_checklistchitiet = sequelize.define(
  "tb_checklistchitiet",
  {
    ID_Checklistchitiet: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_ChecklistC: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ID_Checklist: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Ketqua: {
      type: DataTypes.CHAR,
    },
    Anh: {
      type: DataTypes.CHAR,
    },
    Ngay: {
      type: DataTypes.DATE,
    },
    Gioht: {
      type: DataTypes.TIME,
    },
    Ghichu: {
      type: DataTypes.TEXT,
    },
    Vido: {
      type: DataTypes.CHAR,
    },
    Kinhdo: {
      type: DataTypes.CHAR,
    },
    Docao: {
      type: DataTypes.CHAR,
    },
    isDelete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "tb_checklistchitiet",
  }
);

module.exports = Tb_checklistchitiet;
