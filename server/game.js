var Game = function(blackId, whiteId) {
  this.blackId = blackId;
  this.whiteId = whiteId;
  this.blackTurn = true;

  this.board = [];
  this.backupBoard = [];
  this.track = [];
  for (var i = 0; i < Game.BOARD_SIZE; i++) {
    this.board[i] = [];
    this.backupBoard[i] = [];
    this.track[i] = [];
    for (var j = 0; j < Game.BOARD_SIZE; j++) {
      this.board[i][j] = 0;
      this.backupBoard[i][j] = 0;
      this.track[i][j] = false;
    }
  }

  this.boardStates = {};
  this.passed = false;
  this.done = false;
  this.blackDone = false;
  this.whiteDone = false;
}

Game.BOARD_SIZE = 9;
Game.CARDINALS = [ [1, 0], [0, 1], [-1, 0], [0, -1] ];
Game.HASH_BASE = [];
for (var i = 0; i < Game.BOARD_SIZE; i++) {
  Game.HASH_BASE[i] = [];
  for (var j = 0; j < Game.BOARD_SIZE; j++)
    Game.HASH_BASE[i][j] = Math.random();
}

Game.prototype.doneMarking = function(playerId) {
  if (this.done) {
    if (playerId == this.blackId) {
      this.blackDone = true;
    } else if (playerId == this.whiteId) {
      this.whiteDone = true;
    }
  }
  return this.blackDone && this.whiteDone;
}

Game.prototype.pass = function(playerId) {
  if (!this.done) {
    if (playerId == this.blackId || playerId == this.whiteId) {
      var blackMove = playerId == this.blackId;
      if (blackMove == this.blackTurn) {
        this.blackTurn = !this.blackTurn;
        this.done = this.passed;
        this.passed = true;
        return true;
      }
    }
  }
  return false;
}

Game.prototype.move = function(playerId, square) {
  if (!this.done) {
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
                this.capture(nX, nY, this.board);
              }
            }
          }

          // Check hypothesized move
          if (!suicide) {
            var hash = this.hash();
            // Ko - restore
            if (this.boardStates[hash]) {
              for (var i = 0; i < 4; i++) {
                var nX = square[0] + Game.CARDINALS[i][0],
                    nY = square[1] + Game.CARDINALS[i][1];
                if (this.inBoard(nX, nY))
                  this.restore(nX, nY);
              }
              this.board[square[0]][square[1]] = 0;
              return false;
            }
          // Suicide - restore
          } else {
            this.board[square[0]][square[1]] = 0;
            return false;
          }

          // Validated - finalize
          this.finalize(square[0], square[1]);
          this.blackTurn = !this.blackTurn;
          this.boardStates[this.hash()] = this.board;
          this.passed = false;
          return true;
        } // Square check
      } // Turn check
    } // ID check
  } // Done check
  return false;
}

Game.prototype.hash = function() {
  var hash = 0;
  for (var i = 0; i < Game.BOARD_SIZE; i++)
    for (var j = 0; j < Game.BOARD_SIZE; j++)
      hash += Game.HASH_BASE[i][j] * this.board[i][j];
  return hash;
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
Game.prototype.capture = function(i, j, board) {
  if (board[i][j] != 0) {
    var p = board[i][j];
    board[i][j] = 0;
    for (var k = 0; k < 4; k++) {
      var nX = i + Game.CARDINALS[k][0],
          nY = j + Game.CARDINALS[k][1];
      if (this.inBoard(nX, nY) && board[nX][nY] == p)
        this.capture(nX, nY, board);
    }
  }
}

// Opposite of capture - restores captured group from backup
Game.prototype.restore = function(i, j) {
  if (this.board[i][j] != this.backupBoard[i][j]) {
    var p = this.backupBoard[i][j];
    this.board[i][j] = this.backupBoard[i][j];
    for (var k = 0; k < 4; k++) {
      var nX = i + Game.CARDINALS[k][0],
          nY = j + Game.CARDINALS[k][1];
      if (this.inBoard(nX, nY) && this.backupBoard[nX][nY] == p)
        this.restore(nX, nY);
    }
  }
}

Game.prototype.finalize = function(i, j) {
  this.backupBoard[i][j] = this.board[i][j];
  for (var k = 0; k < 4; k++) {
    var nX = i + Game.CARDINALS[k][0],
        nY = j + Game.CARDINALS[k][1];
    if (this.inBoard(nX, nY) && this.board[nX][nY] == 0 &&
        this.backupBoard[nX][nY] != 0)
      this.capture(nX, nY, this.backupBoard);
  }
}

// Flood fill
Game.prototype.influence = function(i, j, board) {
  if (this.inBoard(i, j) && this.board[i][j] == 0 && !board[i][j]) {
    board[i][j] = true;
    for (var k = 0; k < 4; k++) {
      var nX = i + Game.CARDINALS[k][0],
          nY = j + Game.CARDINALS[k][1];
      this.influence(nX, nY, board);
    }
  }
}

Game.prototype.score = function() {
  var black = 0,
      white = 5.5;

  var blackConnected = [],
      whiteConnected = [];
  for (var i = 0; i < Game.BOARD_SIZE; i++) {
    blackConnected[i] = [];
    whiteConnected[i] = [];
    for (var j = 0; j < Game.BOARD_SIZE; j++) {
      blackConnected[i][j] = false;
      whiteConnected[i][j] = false;
    }
  }

  for (var i = 0; i < Game.BOARD_SIZE; i++)
    for (var j = 0; j < Game.BOARD_SIZE; j++)
      for (var k = 0; k < 4; k++) {
        var nX = i + Game.CARDINALS[k][0],
            nY = j + Game.CARDINALS[k][1];
        if (this.board[i][j] == 1)
          this.influence(nX, nY, blackConnected);
        else if (this.board[i][j] == -1)
          this.influence(nX, nY, whiteConnected);
      }

  for (var i = 0; i < Game.BOARD_SIZE; i++)
    for (var j = 0; j < Game.BOARD_SIZE; j++)
      if (this.board[i][j] == 1)
        black++;
      else if (this.board[i][j] == -1)
        white++;
      else if (blackConnected[i][j] && !whiteConnected[i][j])
        black++;
      else if (whiteConnected[i][j] && !blackConnected[i][j])
        white++;

  return [ black, white ];
}

Game.prototype.mark = function(playerId, square) {
  if (this.done) {
    if (playerId == this.blackId || playerId == this.whiteId) {
      if (this.inBoard(square[0], square[1])) {
        if (this.board[square[0]][square[1]] != 0) {
          this.capture(square[0], square[1], this.board);
          return true;
        } else if (this.backupBoard[square[0]][square[1]] != 0) {
          this.restore(square[0], square[1]);
          return true;
        }
      }
    }
  }
  return false;
}

Game.prototype.clearTrack = function() {
  for (var i = 0; i < Game.BOARD_SIZE; i++)
    for (var j = 0; j < Game.BOARD_SIZE; j++)
      this.track[i][j] = false;
}

Game.prototype.inBoard = function(i, j) {
  return i >= 0 && i < Game.BOARD_SIZE && j >= 0 && j < Game.BOARD_SIZE;
}

Game.prototype.save = function() {
  var score = false;
  if (this.done && this.blackDone && this.whiteDone)
    score = this.score();
  return {
    board: JSON.stringify(this.board),
    blackTurn: this.blackTurn,
    passed: this.passed,
    done: this.done,
    score: score
  };
}

Game.prototype.exitSave = function(playerId) {
  var score = playerId == this.blackId ? [ -1, 0 ] : [ 0, -1 ];
  return {
    board: JSON.stringify(this.board),
    blackTurn: this.blackTurn,
    passed: true,
    done: true,
    score: score
  };
}

exports.Game = Game;
