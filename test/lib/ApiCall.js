// Copyright 2012 Jonas Dohse. All Rights Reserved.

var config = require('../../lib/config');

exports.testExpect = function expect(expected, cb) {
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
