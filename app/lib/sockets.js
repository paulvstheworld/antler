var socketio = require('socket.io')
  , cookie = require('cookie')
  , Sequelize = require('sequelize')
  
  
  // database
  , sequelize = new Sequelize('antler', 'root', null, {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    omitNull: true,
    define: {
        freezeTableName: true,
        syncOnAssociation: true,
        charset: 'utf8',
        collate: 'utf8_general_ci',
        timestamps: true
      }
  })
  
  // models
  , UserModel = sequelize.import(__dirname + '/models/UserModel')
  , ConnectionModel = sequelize.import(__dirname + '/models/ConnectionModel')
  
  // classes
  , User = require(__dirname + '/classes/User')
  , UserCollection = require(__dirname + '/classes/UserCollection')
  , SocketCollection = require(__dirname + '/classes/SocketCollection')
  
  // constants
  , constants = require(__dirname + '/appConstants');

var INACTIVE_TIMEOUT = constants.INACTIVE_TIMEOUT;

var userCollection = new UserCollection();
var socketCollection = new SocketCollection();

var timeouts = {};

exports.socketServer = function (app, server) {
  var io = socketio.listen(server);
  
  // make sure the headers have cookies with session id
  io.set('authorization', function(data, accept) {
    if (data.headers.cookie) {
      data.cookie = cookie.parse(data.headers.cookie);
      data.sessionID = data.cookie['sessionid'];
    }
    else {
     // if there isn't, turn down the connection with a message and leave the function.
     return accept('No cookie transmitted.', false);
    }
    
    // accept the incoming connection
    accept(null, true);
  });
  
  
  // on connection get user object (find or create)
  io.sockets.on('connection', function (socket) {
    var sessionID = socket.handshake.sessionID;
    
    // LOOK UP USER AND HANDLE CASES FROM HERE
    UserModel.find({
        where: {sessionid:sessionID}, 
        attributes:['id', 'firstname', 'lastname']
    })
    .success(function(userModel) {
      var allUsers = userCollection.getAllUsers();
      var currUser = null;
      var user = null;
      
      // emit all previous users already in channel
      for(var i=0, len=allUsers.length; i<len; i++) {
        user = allUsers[i];
        if(user.active) {
          socket.emit('guest.active', user.getValues());
        }
      }
      
      // add current user
      currUser = new User(userModel, true);
      userCollection.addUser(socket.id, currUser);
      
      // add current socket with user id
      socketCollection.addSocket(userModel.id, socket);
      
      // emit and broadcast that a user is active!
      socket.emit('user.active', currUser.getValues());
      socket.broadcast.emit('guest.active', currUser.getValues());
      
      // set user to inactive
      timeouts[userModel.id] = setTimeout(function() {
        currUser.active = false;
        socket.emit('user.inactive', currUser.getValues());
        socket.broadcast.emit('guest.inactive', currUser.getValues());
      }, INACTIVE_TIMEOUT);
    })
    
    
    socket.on('disconnect', function() {
      var name = '';
      var user = userCollection.getUserBySocketID(this.id);
      if(user) {
        name = [user.firstname, user.lastname].join(' ');
        this.broadcast.emit('guest.disconnected', user);
        
        // clearTimeout
        clearTimeout(timeouts[user.id])
        
        // remove user
        userCollection.removeUserBySocketID(this.id);
        
        // remove user socket connection
        socketCollection.removeSocket(user.id);
        
        console.log('user=' + name + ' has left');
      }
    });
    
    
    socket.on('connect.request', function(data) {
      var user = userCollection.getUserBySocketID(this.id);
      var guestID = data.id;
      
      if(user) {
        console.log('user id=' + user.id + ' requests to be connected with guest id=' + guestID);
        
        // lookup guest user
        UserModel.find({
          where: {id:guestID}, 
          attributes:['id', 'firstname', 'lastname']
        })
        .success(function(guestUserModel) {
          if(guestUserModel) {
            console.log('found guest user');
          }
          
          // lookup connection
          ConnectionModel.find({where: [
            '(user_src_id=? AND user_dest_id=?) OR (user_src_id=? AND user_dest_id=?)',
            user.id, guestUserModel.id, guestUserModel.id, user.id
          ]}).success(function(connection) {
            var guestSocket = null;
            
            if(connection) {
              if(connection.connected) {
                // notify the requested user that a connection has already been made
                socket.emit('connect.already', guestUserModel.dataValues);
                console.log('connect.already');
              }
              else {
                var guestSocket = socketCollection.getSocketByUserId(guestUserModel.id);
                guestSocket.emit('connect.request.send', {
                  user: user, 
                  connectionId: connection.id
                });
              }
            }
            else {
              ConnectionModel.create({
                user_src_id: user.id,
                user_dest_id: guestUserModel.id,
                emailed: false,
              }).success(function(connection){
                console.log(connection.values);
                
                var guestSocket = socketCollection.getSocketByUserId(guestUserModel.id);
                guestSocket.emit('connect.request.send', {
                  user: user,
                  connectionId: connection.id
                });
              }) 
            }
            
          })
        })// end success
      }
    });
    
    
    socket.on('connect.request.confirm', function(data) {
      ConnectionModel.find({ where:[
        '(id=? AND user_src_id=?) OR (id=? AND user_dest_id=?)',
        data.connectionId, data.userId, data.connectionId, data.userId
      ]}).success(function(connection) {
        if(connection) {
          connection.connected = true;
          connection.save()
            .success(function(connection) {
              var destUserSocket = socketCollection.getSocketByUserId(connection.user_dest_id);
              var srcUserSocket = socketCollection.getSocketByUserId(connection.user_src_id)
              
              destUserSocket.emit('connect.request.confirmed', {
                connectionId: connection.id,
                userId: connection.user_src_id
              });
              
              srcUserSocket.emit('connect.request.confirmed', {
                connectionId: connection.id,
                userId: connection.user_dest_id
              });
              console.log('connection id=' + connection.id + ' connected=' + connection.connected);
            })
        }
        else {
          // handle connection not found
        }
      })
    });
    
    
  });
  
  
};