// App server

var gamejs = require('./game.js');
var io = require('socket.io').listen(4444);

var MAX_CAP = 1000;

function start() {
  var players = 0;
  var playerConnections = {};
  var games = {};
  var waitingId = null;

  io.set('log level', 2);

  io.sockets.on('connection', function(socket) {
    if (players >= MAX_CAP) {
      socket.emit('error', {
        msg: 'Over capacity'
      });
    }

    // Player ID assignment (give random ID for every new connection)
    var playerId = Math.floor(2 * MAX_CAP * Math.random());
    while (playerConnections[playerId])
      playerId = Math.floor(2 * MAX_CAP * Math.random());
    playerConnections[playerId] = socket;
    players++;

    // Confirm to player with ID
    socket.emit('login_success', {
      id: playerId
    });
    console.log('Client connected - assigned id ' + playerId);

    // Client requests new game
    socket.on('start_game', function(data) {
      data.id = parseInt(data.id);
      if (playerConnections[data.id] && !games[data.id]) {

        // Another player waiting - start game
        if (waitingId && waitingId != data.id) {
          var blackId = Math.random() > 0.5 ? waitingId : data.id,
              whiteId = (waitingId ^ data.id) ^ blackId;
          console.log('Starting game with players ' + blackId + ' and ' +
            whiteId);
          games[blackId] = games[whiteId] = new gamejs.Game(blackId, whiteId);
          var save = games[whiteId].save();
          save.black = true;
          playerConnections[blackId].emit('game_start', save);
          save.black = false;
          playerConnections[whiteId].emit('game_start', save);
          waitingId = null;

        // None waiting
        } else {
          console.log('Letting player ' + data.id + ' wait');
          waitingId = data.id;
          socket.emit('game_wait');
        }
      }
    });

    // Client submits a move
    socket.on('move', function(data) {
      var game = games[data.id];
      if (game && game.move(data.id, data.square)) {
        var save = game.save();
        playerConnections[game.blackId].emit('game_update', save);
        playerConnections[game.whiteId].emit('game_update', save);
      }
    });

    // Client marks a group as dead/alive
    socket.on('mark', function(data) {
      var game = games[data.id];
      if (game && game.mark(data.id, data.square)) {
        var save = game.save();
        playerConnections[game.blackId].emit('game_update', save);
        playerConnections[game.whiteId].emit('game_update', save);
      }
    });

    // Client done marking groups
    socket.on('done', function(data) {
      var game = games[data.id];
      if (game && game.doneMarking(data.id)) {
        var save = game.save();
        playerConnections[game.blackId].emit('game_update', save);
        playerConnections[game.whiteId].emit('game_update', save);
        games[game.blackId] = null;
        games[game.whiteId] = null;
      }
    });

    // Client passes in the game
    socket.on('pass', function(data) {
      var game = games[data.id];
      if (game && game.pass(data.id)) {
        var save = game.save();
        playerConnections[game.blackId].emit('game_update', save);
        playerConnections[game.whiteId].emit('game_update', save);
      }
    });

    // Cleanup
    socket.on('disconnect', function(data) {
      console.log('Player ' + playerId + ' disconnected');
      var game = null;
      if (game = games[playerId]) {
        var save = game.exitSave(playerId);
        playerConnections[game.blackId].emit('game_update', save);
        playerConnections[game.whiteId].emit('game_update', save);
        games[game.blackId] = null;
        games[game.whiteId] = null;
      }
      delete playerConnections[playerId];
      if (waitingId == playerId)
        waitingId = null;
    });
  });
}

exports.start = start;
