// Unite HTML and app servers
var server = require('./server'),
    app = require('./app');
server.start(8888);
app.start();
