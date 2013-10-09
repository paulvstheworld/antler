var config = {
  app: {},
  socket: {},
  db: {}
}

if (process.env.NODE_ENV == 'prod') {
  config.app.host = '0.0.0.0';
  config.app.port = 8013;
  
  config.socket.host = 'antler.io';
  config.socket.port = 8013
  
  config.db.dialect = 'mysql';
  config.db.port = 3306;
  config.db.name = 'antlerio_antlerdb';
  config.db.user = 'antlerio_dbadmin';
  config.db.password = 'Take8a8stab8at8beersDB'
}
else if (process.env.NODE_ENV == 'allister') {
  config.app.host = '0.0.0.0';
  config.app.port = 8013;
  
  config.socket.host = 'localhost';
  config.socket.port = 8013
  
  config.db.dialect = 'mysql';
  config.db.port = 3306;
  config.db.name = 'antlerio_antlerdb';
  config.db.user = 'antlerio_dbadmin';
  config.db.password = 'Take8a8stab8at8beersDB'
}
else if (process.env.NODE_ENV == 'mike') {
  config.app.host = '0.0.0.0';
  config.app.port = 8013;
  
  config.socket.host = 'localhost';
  config.socket.port = 8013
  
  config.db.dialect = 'mysql';
  config.db.port = 3306;
  config.db.name = 'antlerio_antlerdb';
  config.db.user = 'antlerio_dbadmin';
  config.db.password = 'Take8a8stab8at8beersDB'
}
else if (process.env.NODE_ENV == 'paul') {
  config.app.host = '0.0.0.0';
  config.app.port = 3000;
  
  config.socket.host = 'localhost';
  config.socket.port = 3000
  
  config.db.dialect = 'mysql';
  config.db.port = 3306;
  config.db.name = 'antler';
  config.db.user = 'root';
  config.db.password = null;
}
else {
  config.app.host = '0.0.0.0';
  config.app.port = 8013;
  
  config.socket.host = 'antler.io';
  config.socket.port = 8013
  
  config.db.dialect = 'mysql';
  config.db.port = 3306;
  config.db.name = 'antlerio_antlerdb';
  config.db.user = 'antlerio_dbadmin';
  config.db.password = 'Take8a8stab8at8beersDB'
}

module.exports = config;
