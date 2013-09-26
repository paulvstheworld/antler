UserCollection = function() {
  this.users = [];
}

UserCollection.prototype.addUser = function (socketID, user) {
  this.users.push({ id: socketID, user:user });
}

UserCollection.prototype.getAllUsers = function() {
  var users = [];
  for(var i=0, len=this.users.length; i<len; i++) {
    users.push(this.users[i].user);
  }
  return users;
};


UserCollection.prototype.getUserBySocketID = function(socketID) {
  var user = null;
  
  for(var i=0, len=this.users.length; i<len; i++) {
    if (socketID === this.users[i].id) {
      user = this.users[i].user;
      break;
    }
  }
  
  return user;
}

UserCollection.prototype.getUserByUserID = function(userID) {
  var user = null;
  
  for(var i=0, len=this.users.length; i<len; i++) {
    if (userID === this.users[i].user.id) {
      user = this.users[i].user;
      break;
    }
  }
  
  return user;
}

UserCollection.prototype.getSocketIDByUserId = function(userID) {
  var socketID = '';
  
  for(var i=0, len=this.users.length; i<len; i++) {
    if (userID === this.users[i].user.id) {
      socketID = this.users[i].id
      break;
    }
  }
  
  return socketID;
}

UserCollection.prototype.removeUserBySocketID = function(socketID) {
  for(var i=0, len=this.users.length; i<len; i++) {
    if (socketID === this.users[i].id) {
      this.users.splice(i, 1);
      break;
    }
  }
}

UserCollection.prototype.removeUserByUserId = function(userID) {
  for(var i=0, len=this.users.length; i<len; i++) {
    if(userID === this.users[i].user.id) {
      this.users.splice(i, 1);
      break;
    }
  }
}

module.exports = UserCollection;