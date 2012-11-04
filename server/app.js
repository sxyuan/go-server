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
          var gameSave = games[whiteId].save();
          playerConnections[blackId].emit('game_start', {
            game: gameSave
          });
          playerConnections[whiteId].emit('game_start', {
            game: gameSave
          });
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
      
    });

    // Cleanup
    socket.on('disconnect', function(data) {
      console.log('Player ' + playerId + ' disconnected');
      delete playerConnections[playerId];
      if (waitingId == playerId)
        waitingId = null;
    });
  });
}

exports.start = start;
