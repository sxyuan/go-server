require(['scripts/socket.io.min.js',
         'scripts/renderer.js']);

var port = 4444;

function init() {
  var canvas = document.getElementById('canvas');
  var renderer = new Renderer(canvas);

  var socket = io.connect('http://localhost:' + port);
  
  socket.on('login_success', function(data) {
    renderer.update({
      id: Renderer.S_LOBBY,
      playerId: data.id
    });
  });

  function resizeCanvas() {
    canvas.height = window.innerHeight;
    canvas.width = canvas.height;
    renderer.draw();
  }
  window.onresize = resizeCanvas;
  resizeCanvas();
}
