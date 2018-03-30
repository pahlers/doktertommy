#!/usr/bin/env node

'use strict';

const server = require('./');

const port = process.env.PORT || 3001;

server.listen(port, console.log(`Server listens on port ${port}`));