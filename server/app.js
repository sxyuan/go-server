// App server

var io = require('socket.io');

var MAX_CAP = 1000;

function start() {
  var players = 0;
  var playerIds = {};
  var waitingId = null;

  io = io.listen(4444);

  io.sockets.on('connection', function(socket) {
    if (players >= MAX_CAP) {
      socket.emit('error', {
        msg: 'Over capacity'
      });
    }

    var playerId = Math.floor(2 * MAX_CAP * Math.random());
    while (playerIds[playerId])
      playerId = Math.floor(2 * MAX_CAP * Math.random());
    playerIds[playerId] = true;
    players++;

    socket.emit('login_success', {
      id: playerId
    });
    console.log('Client connected - assigned id ' + playerId);

    socket.on('start_game', function(data) {
      if (waitingId) {
        console.log('Starting game with players ' + waitingId + ' and ' +
          data.id);
        
      } else {
        console.log('Letting player ' + data.id + ' wait');
        waitingId = data.id;
      }
    });
  });
}

exports.start = start;
