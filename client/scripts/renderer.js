require(['scripts/states.js']);

var Renderer = function(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
};

Renderer.TEXT_STYLE = 'rgb(0, 0, 0)';
Renderer.BOARD_STYLE = 'rgb(221, 179, 92)';
Renderer.LINE_STYLE = 'rgb(0, 0, 0)';

Renderer.prototype.draw = function(state) {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  switch (state.id) {
    case States.CONNECTING:
      this.ctx.fillStyle = Renderer.TEXT_STYLE;
      this.ctx.fillText('Waiting to connect...', 10, 10);
      break;
    case States.LOBBY:
      this.ctx.fillStyle = Renderer.TEXT_STYLE;
      this.ctx.fillText('Welcome, player ' + state.playerId, 10, 10);
      this.ctx.fillText('Click anywhere to play', 10, 20);
      break;
    case States.WAITING:
      this.ctx.fillStyle = Renderer.TEXT_STYLE;
      this.ctx.fillText('Waiting for an opponent', 10, 10);
      break;
    case States.PLAYING:
      this.drawBoard(state.board);
      this.ctx.fillStyle = Renderer.TEXT_STYLE;
      if (state.blackTurn == state.black) {
        this.ctx.fillText('Your turn (press P to pass)', 10, 10);
      } else {
        this.ctx.fillText('Waiting...', 10, 10);
      }
      break;
    case States.GAMEOVER:
      this.drawBoard(state.board);
      this.ctx.fillStyle = Renderer.TEXT_STYLE;
      this.ctx.fillText('Game over!', 10, 10);
      break;
    default:
      this.ctx.fillStyle = Renderer.TEXT_STYLE;
      this.ctx.fillText('ERROR!', 10, 10);
      break;
  }
}

Renderer.prototype.drawBoard = function(board) {
  var squareDim = Math.min(this.canvas.width, this.canvas.height) / 20;

  this.ctx.fillStyle = Renderer.BOARD_STYLE;
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  this.ctx.fillStyle = Renderer.LINE_STYLE;
  for (var i = 0; i < 19; i++) {
    this.ctx.fillRect(squareDim, (i + 1) * squareDim, 18 * squareDim, 1);
    this.ctx.fillRect((i + 1) * squareDim, squareDim, 1, 18 * squareDim);
  }
  for (var i = 0; i < 3; i++)
    for (var j = 0; j < 3; j++) {
      this.ctx.beginPath();
      this.ctx.arc((4 + 6 * i) * squareDim, (4 + 6 * j) * squareDim,
          squareDim * 0.1, 0, 2 * Math.PI);
      this.ctx.fill();
    }

  for (var i = 0; i < 19; i++)
    for (var j = 0; j < 19; j++)
      if (board[i][j]) {
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.beginPath();
        this.ctx.arc((i + 1) * squareDim, (j + 1) * squareDim, squareDim * 0.45,
            0, 2 * Math.PI);
        this.ctx.fill();
        if (board[i][j] == -1) {
          this.ctx.fillStyle = 'rgb(255,255,255)';
          this.ctx.beginPath();
          this.ctx.arc((i + 1) * squareDim, (j + 1) * squareDim,
              squareDim * 0.45 - 1, 0, 2 * Math.PI);
          this.ctx.fill();
        }
      }
}

Renderer.prototype.getSquare = function(mouseX, mouseY) {
  var squareDim = Math.min(this.canvas.width, this.canvas.height) / 20;
  var squareX = mouseX / squareDim - 0.5,
      squareY = mouseY / squareDim - 0.5;
  if (squareX < 0 || squareX >= 19 || squareY < 0 || squareY >= 19)
    return null;
  else
    return [ Math.floor(squareX), Math.floor(squareY) ];
}
