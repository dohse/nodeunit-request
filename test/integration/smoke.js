// Copyright 2012 Jonas Dohse. All Rights Reserved.

var childProcess = require('child_process');

var async = require('async');

var ApiCall = require('../lib/ApiCall');

exports['get /test'] = ApiCall.withApi(function(test, cb) {
  var requests = [
    test.request('get', '/test', null)([test.code(200)]),
    test.request('get', '/nonexistent', null)([test.code(404)])
  ];
  async.series(requests, cb);
});
