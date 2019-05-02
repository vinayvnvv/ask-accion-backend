const express = require('express');
const api = express.Router();
const app = require('./index');
const env = require('./../env.json');
const connectionTypes = env.connectionTypes;

api.get('/connect', (req, res) => {
    app.doConnect(res, connectionTypes.api);
});

api.post('/init', (req, res) => {
    app.doInit(req.body, res, connectionTypes.api);
});

api.post('/query', (req, res) => {
    app.doQuery(req.body, res, connectionTypes.api);
});

module.exports = api;
