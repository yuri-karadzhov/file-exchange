var express = require('express');
var sio = require('socket.io');
var http = require('http');
var path = require('path');
var crypto = require('crypto');

var port = process.env.PORT || 3000;

var routes = require('./routes/index');

var app = express();
var server = http.createServer(app);
var io = sio(server);

var store = {
  set: function(url, data) {
    this[url] = data;
  }
, setDown: function(url, down) {
    if(!this[url]) return;
    this[url].down = down;
  }
, get: function(url) {
    return this[url];
  }
, delete: function(url) {
    delete this[url];
  }
}; //TODO change to redis store

var toHash = function(data) {
  hash = crypto.createHash('md5');
  hash.update(
    data.name
  + data.size
  + data.type
  + data.date
  , 'ascii');
  return hash.digest('hex');
};

server.listen(port, function() {
  console.log('Server listening on port ' + port);
});

io.on('connection', function(socket) {
  console.log('connected');

  socket.on('file', function(data) {
    console.log(data);
    var url = toHash(data);
    console.log(url);
    socket.url = url;
    data.up = socket.id;
    store.set(url, data);
    socket.emit('hash', url);
  });

  socket.on('info', function(url) {
    var data = store.get(url);
    if(data) {
      socket.emit('file', {
        name: data.name
      , size: data.size
      , type: data.type
      , date: data.date
      });
    } else {
      socket.emit('message', 'File not found');
    }
  });

  socket.on('download', function(url) {
    var data = store.get(url);
    if(data) {
      store.setDown(url, socket.id);
      var up = io.sockets.connected[data.up];
      if(up) {
        up.emit('download');
      } else {
        socket.emit('message', 'File not found');
      }
    } else {
      socket.emit('message', 'File not found');
    }
  });

  socket.on('next', function(url) {
    var data = store.get(url);
    if(data) {
      var up = io.sockets.connected[data.up];
      if(up) {
        up.emit('next');
      } else {
        socket.emit('message', 'File not found');
      }
    } else {
      socket.emit('message', 'File not found');
    }
  });

  socket.on('upload', function(chunk) {
    var data = store.get(socket.url);
    if(data) {
      var down = io.sockets.connected[data.down];
      if(down) {
        down.emit('upload', chunk);
      } else {
        socket.emit('message', 'Download interrupted');
      }
    } else {
      socket.emit('message', 'Download interrupted');
    }
  });

  socket.on('end', function() {
    var data = store.get(socket.url);
    if(data) {
      var down = io.sockets.connected[data.down];
      if(down) {
        store.delete(socket.url);
        down.emit('end');
      } else {
        socket.emit('message', 'Download interrupted');
      }
    } else {
      socket.emit('message', 'Download interrupted');
    }
  });

  socket.on('disconnect', function() {
    store.delete(socket.url);
  });

});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.use('/', routes);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
