var fs = require('fs')
  , uuid = require('uuid')
  , config = require(__dirname + '/../config.js')
  , Sequelize = require('sequelize')
  , sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    dialect: config.db.dialect,
    host: config.db.host,
    port: config.db.port,
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
  
  // constants
  , constants = require(__dirname + '/appConstants');

var INACTIVE_TIMEOUT = constants.INACTIVE_TIMEOUT;

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
              
              return res.render('index', {
                socket_host: config.socket.host,
                socket_port: config.socket.port,
                connectionIds: JSON.stringify(connectionIds),
                INACTIVE_TIME: JSON.stringify(INACTIVE_TIMEOUT)
              });
            });
          }
          else {
            return res.redirect('/intro');
          }
        });
    }
    else {
      return res.redirect('/intro');
    }
  });
  
  app.get('/intro', function(req, res) {
    var sessionid = sessionHelpers.getSessionId(req);
    if (sessionid){
      console.log(sessionid);
      UserModel.find({ where: { sessionid: sessionid}})
        .success(function(user) {
          if(user) {
            return res.redirect('/');
          }
          else {
            return res.render('intro', { errors: JSON.stringify([])});
          }
        });
    }
    else {
      return res.render('intro', { errors: JSON.stringify([])});
    }
  });
  
  
  app.get('/about', function(req, res) {
    var sessionid = sessionHelpers.getSessionId(req);
    if(sessionid) {
     UserModel.find({ where: { sessionid: sessionid}})
        .success(function(user) {
          if(user) {
            return res.render('about', { user_in: 'true' });
          }
          else {
            return res.render('about', { user_in: 'false' });
          }
        });
    }
    else {
      return res.render('about', { user_in: 'false' });
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
            res.render('reconnect', {user: userModel.dataValues,INACTIVE_TIME: JSON.stringify(INACTIVE_TIMEOUT)});
            
            
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
  
  
  
/*  to show all maybe?
  
  app.get('/my_connections', function(req, res) {
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
              
              return res.render('my_connections', {
                connectionIds: JSON.stringify(connectionIds),
                INACTIVE_TIME: JSON.stringify(INACTIVE_TIMEOUT)
              });
            });
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
*/
  
  app.post('/login', function(req, res) {
    var sessionid = null;
    var email = req.body.email || '';
    var firstname = req.body.firstname || '';
    var lastinitial = req.body.lastinitial || '';
    var imgname = uuid.v4() + '.jpg';

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
      
      UserModel.find({
        where: {email:email}
      }).success(function(user) {
        
        
        fs.readFile(req.files.imgpic.path, function (err, data) {
          var newPath = [__dirname, "/../../static/uploads/", imgname].join('');
          
/*
			function cropImage(path,size) {
				var im = require('imagemagick');
	    		
				im.crop({
		    		srcPath: path,
	                dstPath: path,
	                width: size,
	                height: size,
	                quality: 1,
	  				gravity: "North",
	  				filter: 'Blackman',
	  				customArgs: ['-auto-orient', true],
				}, function(err, stdout, stderr){
					if (err) throw err
					//fs.writeFileSync(path, stdout, 'binary');
					});
					
	  		};
 */    	  		


			function cropImage(path,size) {
				var gm = require('gm').subClass({ imageMagick: true });				
	    		
	    		
	    		
	    		img = gm(path);

	    		
	    		img.autoOrient().write(path,function(){
		    		img = gm(path);
					img.size(function(err, value){

					if(value.width > value.height){
						var newHeight = 100;
						var newWidth = null;
						var cropOffsetX = Math.round(( value.width / (value.height/100) )/2 - 50 );
						var cropOffsetY = 0;
					} else {
						var newHeight = null;
						var newWidth = 100;
						var cropOffsetX = 0;
						var cropOffsetY = Math.round( (value.height / (value.width/100))/2 - 50);

					}

					console.log(cropOffsetX);
					console.log(cropOffsetY);

					img.gravity("Center")
						.resize(newWidth, newHeight)
						.write(path, function (err) {
					  			if (err) throw err
							img
								.crop(100,100,cropOffsetX,cropOffsetY)
								.write(path, function (err) {
						  			if (err) throw err
							});
	
					});
	


				})
				})
	    		
				
					
	  		};

          if(data.length > 0) {
            fs.writeFile(newPath, data, function (err) {
              if(user) {
                user.updateAttributes({
                  firstname: firstname,
                  lastname: lastinitial,
                  sessionid: sessionid,
                  image: imgname,
                }).success(function() {
                  cropImage(newPath,"100");
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
                  image: imgname,
                }).success(function() {
                  cropImage(newPath,"100");
                  return res.redirect('/');
                })
              }
            });// end writeFile
          }
          else {
            if(user) {
              user.updateAttributes({
                firstname: firstname,
                lastname: lastinitial,
                sessionid: sessionid,
              }).success(function() {
                return res.redirect('/');
              })
            }
            // add user to DB
            else {
            
            	var rando=Math.floor(Math.random()*6)
            
              UserModel.create({
                email: email,
                firstname: firstname,
                lastname: lastinitial,
                sessionid: sessionid,
                image: 'a'+rando+'.jpg',
              }).success(function() {
                return res.redirect('/');
              })
            }
          }
        }); // end readFile
        
       
        
        
        
      }); // end success
      
      
      
    } // end else
    
    
       
    
    
    
    
  }); // end POST
  
}