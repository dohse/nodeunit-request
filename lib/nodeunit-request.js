// Copyright 2012 Jonas Dohse. All Rights Reserved.

var assert = require('assert');
var childProcess = require('child_process');
var util = require('util');

var request = require('request');

var withServer;
var wrap;

function nodeunitRequest(command, url, testJob) {
  var test;
  function cb(err) {
    test.ifError(err);
    test.done();
  }

  function spawn(test_) {
    test = test_;
    try {
      withServer(command, job, cb);
    } catch (e) {
      cb(e);
    }
  }

  var jobCb;
  function job(jobCb_) {
    jobCb = jobCb_;
    try {
      wrap(test);
      test.url = url;
      testJob(test, unwrap);
    } catch (e) {
      cb(e);
    }
  }

  function unwrap(err) {
    test.unwrap();
    jobCb(err);
  }

  return spawn;
}
module.exports = nodeunitRequest;

function output(prefix) {
  return function(data) {
    console.log(prefix + data);
  };
}

function withServer(command, job, cb) {
  var state;
  var server;
  var timeout = null;
  function spawn() {
    state = spawn;

    server = childProcess.spawn(command[0], command.slice(1));
    server.on('exit', handleExit);
    server.stdout.on('data', output('stdout: '));
    server.stderr.on('data', output('stderr: '));

    timeout = setTimeout(run, 1000);
  }

  function run() {
    state = run;

    job(kill);
  }

  var error = null;
  function kill(err) {
    state = kill;

    if (error) {
      return cb(error);
    }
    error = err;

    server.kill();
  }

  function handleExit(code, signal) {
    if (state === kill) {
      return cb(error);
    }

    var message = util.format('Server exited prematurely ' +
                              'command: %s code: %d signal: %s',
                              command.join(' '), code, signal);
    var err = new Error(message);
    if (state === spawn) {
      clearTimeout(timeout);
      return cb(err);
    }

    if (state === run) {
      error = err;
      return;
    }

    assert.ok(false);
  }

  spawn();
}
nodeunitRequest.withServer = withServer;

var helper = {};

helper.request = function(method, path, json) {
  var test = this;

  var predicates;
  function takePredicates(predicates_) {
    predicates = predicates_;
    return doRequest;
  }

  var cb;
  function doRequest(cb_) {
    cb = cb_;
    request[method](test.url + path, {
      json: json || true
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
};

helper.json = function(expectedJson, order) {
  var test = this;
  return function(err, res, json) {
    if (order && Array.isArray(json)) {
      json.sort(order);
    }
    test.deepEqual(json, expectedJson);
  };
};

helper.code = function(expectedCode) {
  var test = this;
  return function(err, res, body) {
    test.equals(res.statusCode, expectedCode);
  };
};

helper.contentType = function(expectedContentType) {
  var test = this;
  return function(err, res, body) {
    test.equals(res.headers['content-type'], expectedContentType);
  };
};

var storeKey = '_nodeunit_request_store';

helper.unwrap = function() {
  var test = this;

  var store = test[storeKey];
  delete test[storeKey];
  Object.keys(store).forEach(function(key) {
    test[key] = store[key];
  });
};

function wrap(test) {
  var store = test[storeKey] = {};

  Object.keys(helper).forEach(function(key) {
    store[key] = test[key];
    test[key] = helper[key];
  });
}
nodeunitRequest.wrap = wrap;
