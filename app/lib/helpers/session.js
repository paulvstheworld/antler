var uuid = require('uuid');
var SESSION_KEY = 'sessionid';

module.exports.getSessionCookieKey = function() {
  return SESSION_KEY;
}

module.exports.getSessionId = function(req) {
  var cookies = [];
  var cookieParts = [];
  var key = '';
  var val = '';
  
  if(req.headers.cookie) {
    cookies = req.headers.cookie.split(';');
    
    for(var i=0, len=cookies.length; i<len; i++) {
      cookieParts = cookies[i].split('=');
      key = cookieParts[0].trim();
      val = cookieParts[1].trim();
      
      if(SESSION_KEY === key) {
        return val;
      }
    }
  }
  
  return null;
};


module.exports.getNewSessionid = function() {
  return uuid.v4();
};

module.exports.setSessionId = function(sessionId, res) {
  res.setHeader('Set-Cookie', 'sessionid=' + sessionId);
};

module.exports.handleIndexSessionId = function() {
  return function(err, req, res, next) {
    var cookies = [];
    var cookieParts = [];
    var key = '';
    var val = '';
    
    console.log('in handleIndexSessionId');
    
    if(req.headers.cookie) {
      cookies = req.headers.cookie.split(';');
      
      for(var i=0, len=cookies.length; i<len; i++) {
        cookieParts = cookies[i].split('=');
        key = cookieParts[0].trim();
        val = cookieParts[1].trim();
        
        if(SESSION_KEY === key) {
          console.log('found session key=' + SESSION_KEY);
          /*
              => Key with user exists so attach user to req
              => Key does not match any user
              => Check user (w/ email address exists)
                => exists: update user sessionid with new id
                => !exists: generate new user with email address & name
          */
        }
      }
    }
  }
}

module.exports.handleSessionId = function() {
  return function(err, req, res, next) {
    var cookies = [];
    var cookieParks = [];
    var key = '';
    var val = '';
    
    if(req.headers.cookie) {
      cookies = req.headers.cookie.split(';');
      
      for(var i=0, len=cookies.length; i<len; i++) {
        cookieParks = cookies[i].split('=');
        key = cookieParts[0].trim();
        val = cookieParts[1].trim();
        
        if(SESSION_KEY === key) {
          next();
        }
        else {
          // redirect to login page
          res.redirect("/user/login");
        }
      }
    }
    
    console.log("couldn't find cookie key=" + SESSION_KEY);
    console.log("create new session and store it in DB")
    console.error(err.stack);
    return next();
  };
};