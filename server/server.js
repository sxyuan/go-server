// HTML server

var http = require('http'),
    url = require('url'),
    fs = require('fs');

function start(port) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    //console.log('Request for ' + pathname + ' received');

    fs.readFile('./../client' + pathname, function(err, data) {
      if (err) {
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.write(err + '\n');
        response.end();

      } else {
        var contentType;
        if (/.*html$/.test(pathname)) {
          contentType = 'text/html';
        } else if (/.*js$/.test(pathname)) {
          contentType = 'text/javascript';
        } else if (/.*png$/.test(pathname)) {
          contentType = 'image/png';
        } else {
          contentType = 'text/plain';
        }

        response.writeHead(200, {'Content-Type': contentType});
        response.write(data);
        response.end();
      }
    });
  }

  http.createServer(onRequest).listen(port);
}

exports.start = start;
