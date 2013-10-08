var http = require('http')
  , express = require('express')
  , hbs = require('hbs')
  , cookie = require('cookie')
  
  // servers
  , app = express()
  , routes = require(__dirname + '/lib/routes')
  , sockets = require(__dirname + '/lib/sockets')
  , server = http.createServer(app).listen(8013,function () {
      var addr = server.address();
      console.log('Express server listening on http://' + addr.address + ':' + addr.port);
  })
  
  // helpers
  , templateHelpers = require(__dirname + '/lib/helpers/template.js')




app.configure(function() {
  app.set('port', process.env.PORT || 8013);
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.set('views', __dirname + '/../views')
  app.use(express.static(__dirname + '/../static'));
  app.use(express.bodyParser());
});


// setup express routes
routes(app);

// setup socket connection
sockets.socketServer(app, server);

// register hbs helpers
templateHelpers.registerHelpers();