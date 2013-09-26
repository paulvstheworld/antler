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
  , User = sequelize.import(__dirname + '/lib/models/User')
  , Connection = sequelize.import(__dirname + '/lib/models/Connection')
  
  // helpers
  , sessionHelpers = require(__dirname + '/lib/helpers/session.js')
  , templateHelpers = require(__dirname + '/lib/helpers/template.js')
  , LoginValidator = require(__dirname + '/lib/validators/LoginValidator.js')


var INACTIVE_TIMEOUT = 1000 * 30; // 30 secs
var usersBySocket = {};


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
    User.find({ where: { sessionid: sessionid}})
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
    User.find({ where: { sessionid: sessionid}})
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
    
    // add user to database
    User.find({
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
      else {
        User.create({
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
  
  User.find({where: {sessionid: sessionid}})
    .success(function(user) {
      usersBySocket[socket.id] = user;
      socket.emit('user.active', user.dataValues);
      socket.broadcast.emit('guest.active', user.dataValues);
      
      setTimeout(function() {
        socket.emit('user.inactive', user.dataValues);
        socket.broadcast.emit('guest.inactive', user.dataValues);
      }, INACTIVE_TIMEOUT);
    });
  
  socket.on('disconnect', function() {
    var name = '';
    var user = usersBySocket[this.id];
    
    if(user) {
      name = [user.firstname, user.lastname ].join(' ');
      this.broadcast.emit('guest.disconnected', user);
      
      console.log('sessionid = ' + name + ' has left');
      delete usersBySocket[this.id];
    }
  });
  
  // TODO finish this
  socket.on('connect.request', function(data) {
    var user = usersBySocket[this.id];
    var guestID = data.id
    if(user) {
      console.log('user id=' + user.id + ' requests to be connected with ' + guestID);
      
      
      //look up guest user
      User.find({where: {id:guestID}})
        .success(function(guestUser) {
          if(guestUser) {
            console.log('found guest user');
            // check if connect already exists (either forward or reverse connection)
              // if there isn't a connection, send confirmation request to guest
              // else notify the requested user that a conncetion has already been made
          }
          else {
            // TODO -- tell requested user that the guest user no longer exists
            console.log('notify user that guest no longer exists'); 
          }
        });
      
      // check if connect already exists (either forward or reverse connection)
      
      // if there isn't a connection requests to be saved
      // else notify the requested user that a connection has already been made
    }
  })
});


server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});