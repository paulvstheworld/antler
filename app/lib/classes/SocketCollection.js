SocketCollection = function() {
  this.sockets = [];
}

SocketCollection.prototype.addSocket = function(userid, socket) {
  this.sockets.push({
    userid: userid,
    socket: socket
  });
};

SocketCollection.prototype.removeSocket = function(userid) {
  for(var i=0, len=this.sockets.length; i<len; i++) {
    if(this.sockets[i].userid === userid) {
      this.sockets.splice(i, 1);
      return;
    }
  }
}

SocketCollection.prototype.getSocketByUserId = function(userid) {
  var socketObj = null;
  
  for(var i=0, len=this.sockets.length; i<len; i++) {
    if(this.sockets[i].userid === userid) {
      socketObj = this.sockets[i].socket;
      break;
    }
  }
  
  return socketObj;
}

module.exports = SocketCollection;