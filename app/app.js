var http = require('http')
  , express = require('express')
  , hbs = require('hbs')
  , Sequelize = require('sequelize')
  
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

User.find({ where:{id: 1} })
  .success(function(user) {
    if(user) {
      console.log(user.values);
    }
  })


templateHelpers.registerHelpers();

app.configure(function() {
  app.set('port', process.env.PORT || 8080);
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.set('views', __dirname + '/../views')
  app.use(express.static(__dirname + '/../static'));
  app.use(express.bodyParser());
});



app.get('/', function(req, res, next) {
  var sessionId = sessionHelpers.getSessionId(req);
  
  if(!sessionId) {
    res.redirect('/login');
  }
  else {
    res.render('index');
  }
});


app.get('/login', function(req, res) {
  var sessionid = sessionHelpers.getSessionId(req);
  if (sessionid){
    res.redirect('/');
  }
  return res.render('login', { errors: JSON.stringify([])});
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


io.sockets.on('connection', function(socket) {
  socket.on('disconnect', function() {
    socket.broadcast('user.left', {
      msg: 'user left'
    });
  });
});


server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});