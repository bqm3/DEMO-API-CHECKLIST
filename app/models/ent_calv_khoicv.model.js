const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_calv_khoicv = sequelize.define("ent_calv_khoicv", {
    ID_Calv_KhoiCV: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
       },
       ID_Calv: {
         type: DataTypes.INTEGER,
         allowNull: false,
       },
       ID_KhoiCV: {
        type: DataTypes.INTEGER,
        allowNull: false,
       },
       isDelete: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
       },
},{
    freezeTableName: true,
    timestamps: true,
    tableName: 'ent_calv_khoicv'
});

module.exports = Ent_calv_khoicv;