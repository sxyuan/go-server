require(['scripts/socket.io.min.js',
         'scripts/renderer.js',
         'scripts/states.js']);

var domain = '192.168.1.126',
    port = 4444;

function init() {
  var canvas = document.getElementById('canvas');
  var renderer = new Renderer(canvas);

  var socket = io.connect('http://' + domain + ':' + port);
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
    state.board = JSON.parse(data.board);
    state.blackTurn = data.blackTurn;
    state.black = data.black;
    renderer.draw(state);
  });

  socket.on('game_update', function(data) {
    state.board = JSON.parse(data.board);
    state.blackTurn = data.blackTurn;
    state.passed = data.passed;
    if (data.done) {
      if (data.score) {
        state.id = States.GAMEOVER;
        state.score = data.score;
      } else {
        if (state.id != States.SCORING) {
          state.id = States.SCORING;
          state.finalBoard = JSON.parse(data.board);
        }
        state.doneMarking = false;
      }
    }
    renderer.draw(state);
  });

  canvas.onclick = function(evt) {
    if (state.id == States.LOBBY) {
      socket.emit('start_game', {
        id: playerId
      });
    } else if (state.id == States.PLAYING && state.black == state.blackTurn) {
      var square = renderer.getSquare(evt.pageX, evt.pageY);
      if (square) {
        socket.emit('move', {
          id: playerId,
          square: square
        });
      }
    } else if (state.id == States.SCORING) {
      var square = renderer.getSquare(evt.pageX, evt.pageY);
      if (square) {
        socket.emit('mark', {
          id: playerId,
          square: square
        });
      }
    } else if (state.id == States.GAMEOVER) {
      state.id = States.LOBBY;
      renderer.draw(state);
    }
  }

  window.onkeypress = function(evt) {
    if (evt.keyCode) {
      var c = String.fromCharCode(evt.keyCode);
      if (c.toUpperCase() == "P" && state.id == States.PLAYING &&
          state.black == state.blackTurn) {
        socket.emit('pass', {
          id: playerId
        });
      } else if (evt.keyCode == 13 && state.id == States.SCORING) {
        state.doneMarking = true;
        socket.emit('done', {
          id: playerId
        });
        renderer.draw(state);
      }
      // TODO Allow reverting from scoring to playing
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
