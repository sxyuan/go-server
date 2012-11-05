var Game = function(blackId, whiteId) {
  this.blackId = blackId;
  this.whiteId = whiteId;
  this.blackTurn = true;

  this.board = [];
  this.backupBoard = [];
  this.track = [];
  for (var i = 0; i < 19; i++) {
    this.board[i] = [];
    this.backupBoard[i] = [];
    this.track[i] = [];
    for (var j = 0; j < 19; j++) {
      this.board[i][j] = 0;
      this.backupBoard[i][j] = 0;
      this.track[i][j] = false;
    }
  }

  this.boardStates = {};
}

Game.CARDINALS = [ [1, 0], [0, 1], [-1, 0], [0, -1] ];
Game.HASH_BASE = [];
for (var i = 0; i < 19; i++) {
  Game.HASH_BASE[i] = [];
  for (var j = 0; j < 19; j++)
    Game.HASH_BASE[i][j] = Math.random();
}

Game.prototype.move = function(playerId, square) {
  // Check for valid ID
  if (playerId == this.blackId || playerId == this.whiteId) {
    // Check for turn
    var blackMove = playerId == this.blackId;
    if (blackMove == this.blackTurn) {
      var player = blackMove ? 1 : -1;

      // Check move itself
      if (this.inBoard(square[0], square[1]) &&
          this.board[square[0]][square[1]] == 0) {
        // Hypothesize move
        this.board[square[0]][square[1]] = player;
        var suicide = this.countLiberties(square[0], square[1], player) == 0;

        // Count neighbouring liberties and capture
        for (var i = 0; i < 4; i++) {
          var nX = square[0] + Game.CARDINALS[i][0],
              nY = square[1] + Game.CARDINALS[i][1];
          if (this.inBoard(nX, nY)) {
            var liberties = this.countLiberties(nX, nY, this.board[nX][nY]);
            if (this.board[nX][nY] != player && liberties == 0) {
              suicide = false;
              this.capture(nX, nY);
            }
          }
        }

        // Check hypothesized move
        if (!suicide) {
          var hash = this.hash();
          // Ko - restore
          if (this.boardStates[hash]) {
            this.copyBoard(this.backupBoard, this.board);
            return false;
          }
        // Suicide - restore
        } else {
          this.board[square[0]][square[1]] = 0;
          return false;
        }

        // Validated - finalize
        this.copyBoard(this.board, this.backupBoard); // Inefficient
        this.blackTurn = !this.blackTurn;
        this.boardStates[this.hash()] = this.board;
        return true;
      } // Square check
    } // Turn check
  } // ID check
  return false;
}

Game.prototype.hash = function() {
  var hash = 0;
  for (var i = 0; i < 19; i++)
    for (var j = 0; j < 19; j++)
      hash += Game.HASH_BASE[i][j] * this.board[i][j];
  return hash;
}

Game.prototype.copyBoard = function(fromBoard, toBoard) {
  for (var i = 0; i < 19; i++)
    for (var j = 0; j < 19; j++)
      toBoard[i][j] = fromBoard[i][j];
}

// Recursive flood-fill type liberty count, using track
Game.prototype.countLibertiesHelper = function(i, j, player) {
  if (this.inBoard(i, j) && !this.track[i][j]) {
    this.track[i][j] = true;
    if (this.board[i][j] == 0)
      return 1;
    else if (this.board[i][j] != player)
      return 0;
    else {
      var libs = 0;
      for (var k = 0; k < 4; k++)
        libs += this.countLibertiesHelper(i + Game.CARDINALS[k][0],
            j + Game.CARDINALS[k][1], player);
      return libs;
    }
  }
  return 0;
}

Game.prototype.countLiberties = function(i, j, player) {
  this.clearTrack();
  return this.countLibertiesHelper(i, j, player);
}

// Recursive flood-fill type capture, using board as backtrack
Game.prototype.capture = function(i, j) {
  if (this.board[i][j] != 0) {
    var p = this.board[i][j];
    this.board[i][j] = 0;
    for (var k = 0; k < 4; k++) {
      var nX = i + Game.CARDINALS[k][0],
          nY = j + Game.CARDINALS[k][1];
      if (this.inBoard(nX, nY) && this.board[nX][nY] == p)
        this.capture(nX, nY);
    }
  }
}

Game.prototype.clearTrack = function() {
  for (var i = 0; i < 19; i++)
    for (var j = 0; j < 19; j++)
      this.track[i][j] = false;
}

Game.prototype.inBoard = function(i, j) {
  return i >= 0 && i < 19 && j >= 0 && j < 19;
}

Game.prototype.save = function() {
  return {
    board: JSON.stringify(this.board),
    blackTurn: this.blackTurn
  };
}

exports.Game = Game;
