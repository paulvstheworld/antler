var http = require('http')
  , express = require('express')
  , hbs = require('hbs')
  , Sequelize = require('sequelize')
  , cookie = require('cookie')
  
  // servers
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  
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

app.configure(function() {
  app.set('port', process.env.PORT || 8080);
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.set('views', __dirname + '/../views')
  app.use(express.static(__dirname + '/../static'));
  app.use(express.bodyParser());
});

// register hbs helpers
templateHelpers.registerHelpers();


/************* ROUTES *************/
app.get('/', function(req, res, next) {
  var sessionid = sessionHelpers.getSessionId(req);
  if(sessionid) {
    UserModel.find({ where: { sessionid: sessionid}})
      .success(function(user) {
        if(user) {
          return res.render('index');
        }
        else {
          return res.redirect('/login');
        }
      });
  }
  else {
    return res.redirect('/login');
  }
});

app.get('/login', function(req, res) {
  var sessionid = sessionHelpers.getSessionId(req);
  if (sessionid){
    console.log(sessionid);
    UserModel.find({ where: { sessionid: sessionid}})
      .success(function(user) {
        if(user) {
          return res.redirect('/');
        }
        else {
          return res.render('login', { errors: JSON.stringify([])});
        }
      });
  }
  else {
    return res.render('login', { errors: JSON.stringify([])});
  }
});

app.post('/login', function(req, res) {
  var sessionid = null;
  var email = req.body.email || '';
  var firstname = req.body.firstname || '';
  var lastinitial = req.body.lastinitial || '';
  
  var loginValidator = new LoginValidator(email, firstname, lastinitial);
  
  if(!loginValidator.isValid()) {
    return res.render('login', {
      email: email,
      firstname: firstname,
      lastinitial: lastinitial,
      errors: JSON.stringify(loginValidator.getErrors())
    });
  }
  
  else {
    // get new session id
    sessionid = sessionHelpers.getNewSessionid();
    // set new session id
    sessionHelpers.setSessionId(sessionid, res);
    
    // update user info in DB
    UserModel.find({
     where: {email:email} 
    }).success(function(user) {
      if(user) {
        user.updateAttributes({
          firstname: firstname,
          lastname: lastinitial,
          sessionid: sessionid
        }).success(function() {
          return res.redirect('/');
        })
      }
      // add user to DB
      else {
        UserModel.create({
          email: email,
          firstname: firstname,
          lastname: lastinitial,
          sessionid: sessionid
        }).success(function() {
          return res.redirect('/');
        })
      }
    });
  }
});


// save session id to socket
io.set('authorization', function (data, accept) {
  // check if there's a cookie header
  if (data.headers.cookie) {
    // if there is, parse the cookie
    data.cookie = cookie.parse(data.headers.cookie);
    // note that you will need to use the same key to grad the
    // session id, as you specified in the Express setup.
    data.sessionID = data.cookie['sessionid'];
  } 
  else {
   // if there isn't, turn down the connection with a message
   // and leave the function.
   return accept('No cookie transmitted.', false);
  }
  
  // accept the incoming connection
  accept(null, true);
});


io.sockets.on('connection', function(socket) {
  var sessionid = socket.handshake.sessionID;
  
  UserModel.find({where: {sessionid: sessionid}})
    .success(function(user) {
      var allUsers = userCollection.getAllUsers();
      var currUser = null;
      var userObj = null;
      
      // emit all previous users already in channel
      for(var i=0, len=allUsers.length; i<len; i++) {
        userObj = allUsers[i];
        if(userObj.active) {
          socket.emit('guest.active', userObj.getValues());
        } 
      }
      
      // add current user
      currUser = new User(user, true);
      userCollection.addUser(socket.id, currUser);
      
      // add current socket with user id
      socketCollection.addSocket(user.id, socket);
      
      // emit and broadcast that a user is active!
      socket.emit('user.active', currUser.getValues());
      socket.broadcast.emit('guest.active', currUser.getValues());
      
      // set user to inactive
      setTimeout(function() {
        currUser.active = false;
        socket.emit('user.inactive', currUser.getValues());
        socket.broadcast.emit('guest.inactive', currUser.getValues());
      }, INACTIVE_TIMEOUT);
    });
  
  socket.on('disconnect', function() {
    var name = '';
    var user = userCollection.getUserBySocketID(this.id);
    if(user) {
      name = [user.firstname, user.lastname ].join(' ');
      this.broadcast.emit('guest.disconnected', user);
      userCollection.removeUserBySocketID(this.id);
      
      console.log('sessionid = ' + name + ' has left');
      
      // remove socket object from the socketCollection
      socketCollection.removeSocket(user.id);
    }
  });
  
  socket.on('connect.request.confirm', function(data) {
    ConnectionModel.find({where:[
      '(id=? AND user_src_id=?) OR (id=? AND user_dest_id=?)',
      data.connectionId, data.userId, data.connectionId, data.userId
    ]}).success(function(connection) {
      if(connection) {
        connection.connected = true;
        connection.save()
          .success(function(connection) {
            console.log('###########');
            console.log('connection id=' + connection.id + ' connected=' + connection.connected);
            console.log('###########');
          });
      }
    });
    
    
  })
  
  // TODO finish this
  socket.on('connect.request', function(data) {
    var user = userCollection.getUserBySocketID(this.id);
    var guestID = data.id
    if(user) {
      console.log('user id=' + user.id + ' requests to be connected with ' + guestID);
      
      //look up guest user
      UserModel.find({where: {id:guestID}})
        .success(function(guestUser) {
          if(guestUser) {
            console.log('found guest user');
            
            ConnectionModel.find({where: [
              '(user_src_id=? AND user_dest_id=?) OR (user_src_id=? AND user_dest_id=?)',
              user.id, guestUser.id, guestUser.id, user.id
            ]})
              .success(function(connection) {
                var guestSocket = null;
                
                if(connection) {
                  if(connection.connected) {
                    console.log('confirmed connection exists');
                    
                    // notify the requested user that a connection has already been made
                    socket.emit('connect.already', guestUser.dataValues);
                    console.log('connect.already');
                  }
                  else {
                    console.log('unconfirmed connection exists');
                    
                    guestSocket = socketCollection.getSocketByUserId(guestID);
                    guestSocket.emit('connect.request.send', {
                      user: user,
                      connectionId: connection.id
                    });
                  }
                }
                else {
                  guestSocket = socketCollection.getSocketByUserId(guestID);
                  
                  ConnectionModel.create({
                    user_src_id: user.id,
                    user_dest_id: guestID
                  }).success(function(connection) {
                    guestSocket.emit('connect.request.send', {
                      user: user,
                      connectionId: connection.id
                    });
                    
                    console.log(
                      'created connection src=' + connection.user_src_id + ' dest=' + connection.user_dest_id);
                  });
                  
                  console.log('should create connection for user id=' + user.id + ' and guest id=' + guestID);
                }
              })
          }
          else {
            // TODO -- tell requested user that the guest user no longer exists
            console.log('notify user that guest no longer exists'); 
          }
        });
    }
  })
});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});