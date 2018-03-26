#!/usr/bin/env node

'use strict';

const server = require('./');

const port = process.env.PORT || 3000;

server.listen(port, startUpLog(port));