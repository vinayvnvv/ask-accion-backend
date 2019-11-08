const express = require('express');
const api = express.Router();
const app = require('./index');
const env = require('./../env.json');
const {ZohoService} = require('./services');
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

api.get('/get-emp/:id', (req, res) => {
    ZohoService.getEmpDetailsByEmailId(req.params.id, (err, result) => {
        if(err) res.set(400).json(result);
        else res.json(result);
    })
})

module.exports = api;
