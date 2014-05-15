$(function(){

  var support = window.File && window.FileReader && window.FileList && window.Blob;

  var CHUNK = 256*1024; //256Kb
  var start = 0;
  var stop = CHUNK;
  var count;
  var total;
  var tail;

  var info = $('#info');
  var upload = $('#file-upload');
  var fileDrop = $('#file-drop');
  var exchange = $('#file-exchange');
  var hash = $('#hash');
  var progress = $('.progress').hide();
  var bar = $('.progress-bar');

  var file;

  var socket = io();

  var done = function() {
    progress.hide();
    info.html('File was downloaded successfully');
    hash.html('');
    socket.emit('end');
  };

  var fileReadChunk = function() {
    if(count === 0) {
      return done();
    }
    if(count === 1) {
      if(!tail) return done();
      stop = file.size;
    }
    var reader = new FileReader();
    var blob = file.slice(start, stop);
    reader.readAsArrayBuffer(blob);

    reader.onloadend = function(e) {
      var target = e.target;
      if(target.readyState == FileReader.DONE) {
        bar.css('width', 100 - 100 * count / total + '%');
        socket.emit('upload', target.result);
        start = stop;
        stop = stop + CHUNK;
        count--;
      }
    };
  };

  var change = function(files) {
    file = files[0];
    info.html(escape(file.name) + ' '
      + (file.type || 'n/a') + ' '
      + ((~~(file.size * 100 / 1024 / 1024)) / 100) + 'Mb last modified: '
      + file.lastModifiedDate.toLocaleDateString()
    );
    fileDrop.removeClass('highlighted').hide();
    upload.hide();
    socket.emit('file', {
      name: file.name
    , size: file.size
    , type: file.type
    , date: file.lastModifiedDate
    });
  };

  if(!support) {
    window.alert('The File APIs are not fully supported in this browser.');
  }

  socket.on('hash', function(url) {
    hash.html('http://localhost:3000/' + url);
  });

  socket.on('download', function() {
    console.log('down');
    progress.show();
    count = ~~(file.size / CHUNK) + 1;
    total = count;
    tail = file.size % CHUNK;
    fileReadChunk();
  });

  socket.on('next', function() {
    console.log('next');
    fileReadChunk();
  });

  socket.on('disconnect', function() {
    window.location.reload();
  });

  upload.on('click', function() {
    exchange.click();
  });

  exchange.bind({
    change: function() {
      var files = this.files;
      change(files);
    }
  });

  fileDrop.bind({
    dragenter: function() {
      $(this).addClass('highlighted');
      return false;
    }
  , dragover: function() {
      return false;
    }
  , dragleave: function() {
      $(this).removeClass('highlighted');
      return false;
    }
  , drop: function(e) {
      e.preventDefault();
      var data = e.originalEvent.dataTransfer;
      change(data.files);
      return false;
    }
  });

});
