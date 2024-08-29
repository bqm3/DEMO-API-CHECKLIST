const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_nhom = sequelize.define(
  "ent_nhom",
  {
    ID_Nhom: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    Tenhom: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    Soluongcanho: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    Soluongnhanvien: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    Tenhom: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    isDelete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "ent_nhom",
  }
);

module.exports = Ent_nhom;
