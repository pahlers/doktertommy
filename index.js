require('colors');
const express = require('express');
const server = express();
const bodyParser = require('body-parser');
const cors = require('cors');

// Enable cors
server.use(cors());

server.use(bodyParser.json()); // for parsing application/json
server.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

server.all('*', logRequests);
server.use('/', express.static('app'));

module.exports = server;

/**
 * Add logging
 * @param req
 * @param res
 * @param next
 */
function logRequests(req, res, next) {
    console.log(req.method.toUpperCase().yellow, req.path);

    next();
}