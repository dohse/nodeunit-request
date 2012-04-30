// Copyright 2012 Jonas Dohse. All Rights Reserved.

var async = require('async');

var nodeunitRequest = require('../../lib/nodeunit-request');

var urlPrefix = exports.urlPrefix = 'http://localhost:19585';

var command = ['node', 'test/lib/express-example.js'];
exports['Test trivial server case'] = nodeunitRequest(command,
                                                      urlPrefix,
                                                      function(test, cb) {
  var json = {
    a: 1,
    b: true,
    c: 'c',
    d: []
  };
  var requests = [
    test.request('get', '/403')([test.code(403)]),
    test.request('get', '/200')([test.code(200)]),
    test.request('post', '/200', json)([
        test.code(200), test.json(json)])
  ];
  async.series(requests, cb);
  console.log('smoke.js');
});
