var Game = function(blackId, whiteId) {
  this.blackId = blackId;
  this.whiteId = whiteId;
  this.blackTurn = true;

  this.board = [];
  for (var i = 0; i < 19; i++) {
    this.board[i] = [];
    for (var j = 0; j < 19; j++)
      this.board[i][j] = 0;
  }
}

Game.prototype.move = function(playerId, square) {
  // Check for valid ID
  if (playerId == this.blackId || playerId == this.whiteId) {
    // Check for turn
    var blackMove = playerId == this.blackId;
    if (blackMove == this.blackTurn) {

      // Check square
      if (square[0] >= 0 && square[0] < 19 &&
          square[1] >= 0 && square[1] < 19 &&
          this.board[square[0]][square[1]] == 0) {
        this.board[square[0]][square[1]] = blackMove ? 1 : -1;
        blackMove = !blackMove;
      } // Square check
    } // Turn check
  } // ID check
  return false;
}

Game.prototype.save = function() {
  return {
    board: JSON.stringify(this.board),
    blackTurn: this.blackTurn
  };
}

exports.Game = Game;
