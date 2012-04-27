// Copyright 2012 Jonas Dohse. All Rights Reserved.

var childProcess = require('child_process');

var request = require('request');

var startServer = exports.startServer = function(config, test, cb) {
  var command = 'node';
  var server = childProcess.spawn(command, [config.main]);
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

function testRequest(method, path, json) {
  var test = this;

  var predicates;
  function takePredicates(predicates_) {
    predicates = predicates_;
    return doRequest;
  }

  var cb;
  function doRequest(cb_) {
    cb = cb_;
    request[method](test.config.url + path, {
      headers: {
        'content-type': json ? 'application/json' : undefined
      },
      json: json
    }, check);
  }

  function check(err, res, body) {
    if (err) {
      return cb(err);
    }

    predicates.forEach(function(predicate, index) {
      predicate(err, res, body);
    });

    cb(null);
  }

  return takePredicates;
}

function testJson(expectedJson, order) {
  var test = this;
  return function(err, res, body) {
    var json = JSON.parse(body);
    if (order && Array.isArray(json)) {
      json.sort(order);
    }
    test.deepEqual(json, expectedJson);
  };
}

function testCode(expectedCode) {
  var test = this;
  return function(err, res, body) {
    test.equals(res.statusCode, expectedCode);
  };
}

module.exports = function(config, integrationTest) {
  var test;
  function start(test_) {
    test = test_;
    test.request = testRequest;
    test.json = testJson;
    test.code = testCode;
    test.config = config;

    startServer(config, test, runTest);
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

    integrationTest(test, done);
  }

  function done(err) {
    test.ifError(err);
    test.done = oldDone;
    server.kill();
    test.done();
  }

  return start;
};
