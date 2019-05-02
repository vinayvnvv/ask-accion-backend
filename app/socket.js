var app = require('./index');
const env = require('./../env.json');
const msgChannel = env.socket.msgchannel;
const initChannel = env.socket.initChannel;
const connectionTypes = env.connectionTypes;
class Socket {

    constructor(io) {
        this.io = io;
    }

    init() {
        this.io.on('connection', (socket) => {
            console.log('connection from user')
            app.doConnect(socket, connectionTypes.socket);


            socket.on(initChannel, (body) => {
                console.log('init called', body);
                app.doInit(body, socket, connectionTypes.socket);
            })

            socket.on(msgChannel, (body) => {
                console.log('msg from user', body);
                app.doQuery(body, socket, connectionTypes.socket);
            });
        });
    }

}

module.exports = Socket;