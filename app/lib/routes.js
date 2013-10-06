var Sequelize = require('sequelize')
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
  
  // helpers
  , sessionHelpers = require(__dirname + '/helpers/session.js')
  , LoginValidator = require(__dirname + '/validators/LoginValidator.js')


module.exports = function(app) {
  /************* ROUTES *************/
  app.get('/', function(req, res, next) {
    var sessionid = sessionHelpers.getSessionId(req);
    if(sessionid) {
      UserModel.find({ where: { sessionid: sessionid}})
        .success(function(user) {
          if(user) {
            ConnectionModel.findAll({where:[
              '(user_src_id=? OR user_dest_id=?) AND connected=true',
              user.id, user.id
            ]}).success(function(connections) {
              var connectionIds = [];
              var otherUser = null;
              
              for(var i=0, len=connections.length; i<len; i++) {
                otherUserID = (user.id === connections[i].user_src_id) ? 
                    connections[i].user_dest_id : connections[i].user_src_id; 
                connectionIds.push(otherUserID);
              }
              
              return res.render('index', {connectionIds: JSON.stringify(connectionIds)});
            });
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
  
  app.get('/reconnect', function(req, res) {
    var sessionid = sessionHelpers.getSessionId(req);
    if (sessionid){
      console.log(sessionid);
      UserModel.find({ where: { sessionid: sessionid}})
        .success(function(userModel) {
          if(userModel) {
            // render reconnect with user data
            res.render('reconnect', {user: userModel.dataValues});
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
            sessionid: sessionid,
            image: '',
          }).success(function() {
            return res.redirect('/');
          })
        }
      });
    }
  });
  
}