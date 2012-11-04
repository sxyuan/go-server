require(['scripts/socket.io.min.js',
         'scripts/renderer.js',
         'scripts/states.js']);

var port = 4444;

function init() {
  var canvas = document.getElementById('canvas');
  var renderer = new Renderer(canvas);

  var socket = io.connect('http://localhost:' + port);
  var state = {
    id: States.CONNECTING
  }
  
  socket.on('login_success', function(data) {
    playerId = parseInt(data.id);
    state.id = States.LOBBY;
    state.playerId = playerId;
    renderer.draw(state);
  });

  socket.on('game_wait', function(data) {
    state.id = States.WAITING;
    renderer.draw(state);
  });

  socket.on('game_start', function(data) {
    state.id = States.PLAYING;
    state.board = JSON.parse(data.game);
    renderer.draw(state);
  });

  canvas.onclick = function(evt) {
    if (state.id == States.LOBBY) {
      socket.emit('start_game', {
        id: playerId
      });
    }
  }

  function resizeCanvas() {
    canvas.height = window.innerHeight;
    canvas.width = canvas.height;
    renderer.draw(state);
  }
  window.onresize = resizeCanvas;
  resizeCanvas();
}
