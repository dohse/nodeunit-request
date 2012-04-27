// Copyright 2012 Jonas Dohse. All Rights Reserved.

var fs = require('fs');

var express = require('express');
var getenv = require('getenv');

var log = require('log');

function jsonError(message, type, code) {
  return {
    error: {
      message: message,
      type: type,
      code: code
   }
 };
}

function setupRoutes(cassandra) {
  var app = express.createServer();

  var loggerFormat = getenv.string('EXPRESS_LOGGER_FORMAT');
  if (loggerFormat) {
    app.use(express.logger(loggerFormat));
  }

  app.get('/test', function(req, res) {
    res.send('test success');
  });

  app.error(function(err, req, res, next) {
    log.error('setupRoutes.appError: %s', err);

    res.send(jsonError(err.message), 500);
  });

  app.listen(getenv.int('HTTP_PORT'));

  return app;
}
module.exports = setupRoutes;
