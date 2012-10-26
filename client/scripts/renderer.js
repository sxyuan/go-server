var Renderer = function(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.state = {
    id: 0
  };
}

Renderer.S_CONNECTING = 0;
Renderer.S_LOBBY = 1;

Renderer.prototype.update = function(data) {
  for (key in data) {
    this.state[key] = data[key];
  }
  this.draw();
}

Renderer.prototype.draw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  switch (this.state.id) {
    case Renderer.S_CONNECTING:
      this.ctx.fillText('Waiting to connect...', 10, 10);
      break;
    case Renderer.S_LOBBY:
      this.ctx.fillText('Welcome, player ' + this.state.playerId, 10, 10);
      break;
    default:
      break;
  }
}
