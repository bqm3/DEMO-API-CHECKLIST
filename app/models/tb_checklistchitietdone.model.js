const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Tb_checklistchitietdone = sequelize.define("tb_checklistchitietdone", {
    ID_Checklistchitietdone: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
       },
       ID_ChecklistC: {
        type: DataTypes.INTEGER,
      },
       Description: {
         type: DataTypes.TEXT,
       },
       Gioht: {
        type: DataTypes.TIME
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
},{
    freezeTableName: true,
    timestamps: true,
    tableName: 'tb_checklistchitietdone'
});

module.exports = Tb_checklistchitietdone;