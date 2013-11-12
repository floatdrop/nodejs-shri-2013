
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    spawn = require('child_process').spawn;

var app = express();

var io = require("socket.io");

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/', function(req, res){
  res.sendfile(__dirname + '/views/index.html');
});

var server =  http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var users = {};

io = io.listen(server);
io.sockets.on('connection', function (socket) {
  users[socket.id] = {};
  socket.on('run-console', function(data) {
    var node = spawn("node", ['-p', data.code]);
    node.on('error', function(error) {
      socket.emit('console', {error: error});
    });
    node.on('exit', function(code, signal) {
      socket.emit('console', {exit: code, signal: signal});
    });
    node.stderr.on('data', function (data) {
      socket.emit('console', {data: data, std: 'stderr'});
    });
    node.stdout.on('data', function (data) {
      socket.emit('console', {data: data, std: 'stdout'});
    });
    setTimeout(function() { node.kill('SIGHUP'); }, 10 * 60 * 1000);
  });

});

