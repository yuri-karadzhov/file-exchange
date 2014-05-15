window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

function File(file) {

  this.file = file;

}

File.prototype.support = window.requestFileSystem != null;

// fakeClick was found in StackOverflow
// http://stackoverflow.com/questions/1421584/how-can-i-simulate-a-click-to-an-anchor-tag
var fakeClick = function(event, link) {
  if(link.click) {
    link.click();
  } else if(document.createEvent) {
    if(event.target !== link) {
      var evt = document.createEvent('MouseEvents');
      evt.initMouseEvent('click', true, true, window,
          0, 0, 0, 0, 0, false, false, false, false, 0, null);
      var allowDefault = link.dispatchEvent(evt);
    }
  }
};

var errorHandler = function(err) {
  var msg = '';

  switch(err.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      return;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  }

  $('#error').html('Error: ' + msg);
};

File.prototype.remove = function(cb) {
  var file = this.file;
  if(this.support) {
    window.requestFileSystem(window.TEMPORARY, file.size, function(fs) {
      fs.root.getFile(file.name, {create: false}, function(fileEntry) {

        fileEntry.remove(function() {
          cb();
        }, errorHandler);

      }, errorHandler);
    }, errorHandler);
  } else {
    this.blob = null;
    cb();
  }
};

File.prototype.create = function(cb) {
  var file = this.file;
  if(this.support) {
    window.requestFileSystem(window.TEMPORARY
    , file.size
    , function(fs) {
      fs.root.getFile(file.name, {
        create: true
      }, function(fileEntry) {
        cb();
      }, errorHandler);
    }, errorHandler);
  } else {
    this.blob = new Blob([], {type: file.type});
    cb();
  }
};

File.prototype.write = function(data, cb) {
  var file = this.file;
  if(this.support) {
    window.requestFileSystem(window.TEMPORARY
    , file.size
    , function(fs) {
      fs.root.getFile(file.name, {
        create: false
      }, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {

          fileWriter.addEventListener('writeend', function() {
            cb(fileWriter.length, file.size);
          }, false);

          fileWriter.seek(fileWriter.length);

          fileWriter.write(new Blob([data], {
            type: file.type
          }));
        });
      }, errorHandler);
    }, errorHandler);
  } else {
    this.blob = new Blob([this.blob, data], {type: file.type});
    cb(this.blob.size, file.size);
  }
};

File.prototype.save = function() {
  var file = this.file;
  if(this.support) {
    window.requestFileSystem(window.TEMPORARY
    , file.size
    , function(fs) {
      fs.root.getFile(file.name, {
        create: false
      }, function(fileEntry) {
        window.location.href = fileEntry.toURL(file.type);
      }, errorHandler);
    }, errorHandler);
  } else {
    var url = window.URL.createObjectURL(this.blob);
//     doesn't give right file name
//     window.location.href = url;
    var link = $('#blob-link');
    link.attr('href', url);
    link.attr('download', file.name);
    link.click();
    fakeClick({}, link[0]);
  }
};
