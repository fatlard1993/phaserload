const express = require('express');

const { rootPath, app } = require('./phaserload');

app.use(express.static(rootPath('client/dist')));
