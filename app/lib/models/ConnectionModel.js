module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Connection', {
    id: DataTypes.INTEGER,
    user_src_id: DataTypes.INTEGER,
    user_dest_id: DataTypes.INTEGER,
    createdAt: DataTypes.INTEGER,
    updatedAt: DataTypes.INTEGER
    // TOOD add in connected column here
  })
}