module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: DataTypes.INTEGER, 
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    email: DataTypes.STRING,
    sessionid: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  })
}