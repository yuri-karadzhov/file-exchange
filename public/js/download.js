$(function() {

  var error = $('#error');
  var info = $('#info');
  var download = $('#file-download').hide();
  var progress = $('.progress').hide();
  var bar = $('.progress-bar');

  var file;
  var writer;

  var socket = io();

  var url = window.location.pathname.substring(1);

  socket.emit('info', url);

  socket.on('message', function(data) {
    error.html('Error: ' + data);
  });

  socket.on('file', function(data) {
    file = data;
    writer = new File(file);
    var date = new Date(file.date);
    info.html(escape(file.name) + ' '
      + (file.type || 'n/a') + ' '
      + ((~~(file.size * 100 / 1024 / 1024)) / 100) + 'Mb last modified: '
      + date.toLocaleDateString()
    );
    writer.remove(function() {
      console.log('File removed.');
    });
    download.show();
  });

  socket.on('upload', function(data) {
    console.log('upload');
    writer.write(data, function(count, total) {
      bar.css('width', 100 * count / total + '%');
      socket.emit('next', url);
    });
  });

  socket.on('end', function() {
    writer.save();
    progress.hide();
    info.html('File was downloaded successfully');
  });

  download.on('click', function() {
    $(this).hide();
    progress.show();
    writer.create(function() {
      socket.emit('download', url);
    });
  });

});
