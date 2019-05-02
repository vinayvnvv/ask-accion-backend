const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const env = require('./env.json');
const port = process.env.PORT || env.port;
const socket = new (require('./app/socket'))(io);
const path = require('path');
const api = require('./app/api');
var bodyParser = require('body-parser');
var cors = require('cors');

app.use(express.static(path.join(__dirname, '/html')));
app.use(bodyParser.json());
app.use(cors())

app.use('/api', api);

app.get(/^\/$/, function(req, res){
  res.sendFile(__dirname + '/html/index.html');
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

socket.init();

