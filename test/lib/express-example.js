// Copyright 2012 Jonas Dohse. All Rights Reserved.

var url = require('url');

var express = require('express');

var smoke = require('../integration/smoke');

var app = express.createServer();

app.use(express.bodyParser());

function reflect(req, res, next) {
  res.header('Content-Type', req.headers['content-type']);
  res.send(req.body, +req.params.code);
}

app.get('/:code', reflect);
app.post('/:code', reflect);

app.listen(url.parse(smoke.urlPrefix).port);
