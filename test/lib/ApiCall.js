// Copyright 2012 Jonas Dohse. All Rights Reserved.

var childProcess = require('child_process');

var config = require('../../lib/config');

var startServer = exports.startServer = function(test, cb) {
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
  }, 1000);
};

var testExpectResponse = exports.testExpectResponse =
    function expectResponse(expected, cb) {
  var test = this;
  return function(err, res, body) {
    if (err) {
      return cb(err);
    }
    test.equal(res.statusCode, expected.statusCode);
    if (res.statusCode !== expected.statusCode) {
      console.error(body);
    }
    if (expected.json) {
      test.deepEqual(JSON.parse(body), expected.json);
    }
    cb(null);
  };
};

var url = exports.url = function() {
  var protocol = config.string('API_PROTOCOL');
  var host = config.string('API_HOST');
  var port = config.int('API_PORT');
  var url = protocol + '://' + host + ':' + port;
  return url;
};

exports.withApi = function(integrationTest) {
  var test;
  function start(test_) {
    test = test_;
    test.expectResponse = testExpectResponse;

    startServer(test, runTest);
  }

  var server;
  var oldDone;
  function runTest(err, server_) {
    if (err) {
      test.ifError(err);
      return test.done();
    }
    server = server_;

    oldDone = test.done;
    test.done = done;

    integrationTest(test, url());
  }

  function done(err) {
    test.ifError(err);
    test.done = oldDone;
    server.kill();
    test.done();
  }

  return start;
};
