module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Connection', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_src_id: DataTypes.INTEGER,
    user_dest_id: DataTypes.INTEGER,
    createdAt: DataTypes.INTEGER,
    updatedAt: DataTypes.INTEGER,
    connected: DataTypes.BOOLEAN,
    emailed: DataTypes.BOOLEAN
  })
}