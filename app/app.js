var http = require('http')
  , express = require('express')
  , hbs = require('hbs')
  , Sequelize = require('sequelize')
  , cookie = require('cookie')
  
  // servers
  , app = express()
  , routes = require(__dirname + '/lib/routes')
  , server = http.createServer(app).listen(8080, function () {
      var addr = server.address();
      console.log('Express server listening on http://' + addr.address + ':' + addr.port);
  })
  
  // dbconnection
  sequelize = new Sequelize('antler', 'root', null, {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    define: {
        freezeTableName: true,
        syncOnAssociation: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
        timestamps: true
      }
  })
  
  // models
  , UserModel = sequelize.import(__dirname + '/lib/models/UserModel')
  , ConnectionModel = sequelize.import(__dirname + '/lib/models/ConnectionModel')
  
  // classes
  , User = require(__dirname + '/lib/classes/User')
  , UserCollection = require(__dirname + '/lib/classes/UserCollection')
  , SocketCollection = require(__dirname + '/lib/classes/SocketCollection')
  
  // helpers
  , sessionHelpers = require(__dirname + '/lib/helpers/session.js')
  , templateHelpers = require(__dirname + '/lib/helpers/template.js')
  , LoginValidator = require(__dirname + '/lib/validators/LoginValidator.js')
  


var INACTIVE_TIMEOUT = 1000 * 60; // 30 secs

var userCollection = new UserCollection();
var socketCollection = new SocketCollection();

var sockets = require(__dirname + '/lib/sockets');
sockets.socketServer(app, server);

app.configure(function() {
  app.set('port', process.env.PORT || 8080);
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.set('views', __dirname + '/../views')
  app.use(express.static(__dirname + '/../static'));
  app.use(express.bodyParser());
});

// setup express routes
routes(app);

// register hbs helpers
templateHelpers.registerHelpers();