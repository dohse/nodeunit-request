// Copyright 2012 Jonas Dohse. All Rights Reserved.

var childProcess = require('child_process');

var config = require('../../lib/config');

exports.startServer = function(test, cb) {
  var command = 'node';
  var server = childProcess.spawn(command, ['lib/main.js']);
  server.on('exit', function(code, signal) {
    var err = code > 0 ? new Error(command + ': ' + code) : null;
    test.ifError(err);
  });
  server.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
  });
  server.stderr.on('data', function(data) {
    console.error('stderr: ' + data);
  });

  setTimeout(function() {
    cb(null, server);
  }, 500);
};

exports.testExpectResponse = function expectResponse(expected, cb) {
  var test = this;
  return function(err, res, body) {
    if (err) {
      return cb(err);
    }
    test.equal(res.statusCode, expected.statusCode);
    if (expected.body) {
      test.deepEqual(body, expected.body);
    }
    cb(null);
  };
};

exports.url = function() {
  var protocol = config.string('API_PROTOCOL');
  var host = config.string('API_HOST');
  var port = config.int('API_PORT');
  var url = protocol + '://' + host + ':' + port;
  return url;
};
