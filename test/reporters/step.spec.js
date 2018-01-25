'use strict';

var reporters = require('../../').reporters;
var Step = reporters.Step;
var Base = reporters.Base;
var Test = require('../../').test;
var Suite = require('../../').suite;

describe('Step reporter', function () {
  var stdout;
  var stdoutWrite;
  var runner;

  beforeEach(function () {
    stdout = [];
    runner = {};
    stdoutWrite = process.stdout.write;
    process.stdout.write = function (string) {
      stdout.push(string);
    };
  });

  describe('on suite', function () {
    it('should return title', function () {
      var expectedTitle = 'expectedTitle';
      var suite = new Suite(expectedTitle, function () {});
      runner.on = function (event, callback) {
        if (event === 'suite') {
          callback(suite);
        }
      };
      Step.call({
        epilogue: function () {
        }
      }, runner);
      process.stdout.write = stdoutWrite;
      var expectedArray = [
        expectedTitle + '\n'
      ];
      stdout.should.deepEqual(expectedArray);
    });
  });
  describe('on pending', function () {
    it('should return title', function () {
      var expectedTitle = 'expectedTitle';
      var suite = new Suite(expectedTitle, function () {});
      runner.on = function (event, callback) {
        if (event === 'pending') {
          callback(suite);
        }
      };
      Step.call({epilogue: function () {}}, runner);
      process.stdout.write = stdoutWrite;
      var expectedArray = [
        '* skipped ' + expectedTitle + '\n'
      ];
      stdout.should.deepEqual(expectedArray);
    });
  });
  describe('on test', function () {
    describe('first time starting test', function () {
      it('should return start title', function () {
        var expectedTitle = 'expectedTitle';
        var test = new Test(expectedTitle, function () {});
        test.currentRetry(0);
        runner.on = function (event, callback) {
          if (event === 'test') {
            callback(test);
          }
        };
        Step.call({
          epilogue: function () {
          }
        }, runner);
        process.stdout.write = stdoutWrite;
        var message = '- start ' + expectedTitle + '\n';
        stdout[0].should.deepEqual(message);
      });
    });
    describe('retry starting test', function () {
      it('should return retry title', function () {
        var expectedTitle = 'expectedTitle';
        var test = new Test(expectedTitle, function () {
        });
        test.currentRetry(1);
        runner.on = function (event, callback) {
          if (event === 'test') {
            callback(test);
          }
        };
        Step.call({
          epilogue: function () {
          }
        }, runner);
        process.stdout.write = stdoutWrite;
        var message = '- retry1 ' + expectedTitle + '\n';
        stdout[0].should.deepEqual(message);
      });
    });
  });
  describe('on pass', function () {
    describe('if test speed is slow', function () {
      it('should return expected tick, title and duration', function () {
        var expectedTitle = 'expectedTitle';
        var expectedDuration = 2;
        var test = new Test(expectedTitle);
        test.duration = expectedDuration;
        test.slow = function () { return 1; };

        runner.on = function (event, callback) {
          if (event === 'pass') {
            callback(test);
          }
        };
        Step.call({epilogue: function () {}}, runner);
        process.stdout.write = stdoutWrite;
        var expectedString = Base.symbols.ok + ' passed ' + expectedTitle + ' (' + expectedDuration + 'ms)' + '\n';
        stdout[0].should.equal(expectedString);
      });
    });
    describe('if test speed is fast', function () {
      it('should return expected tick, title and without a duration', function () {
        var expectedTitle = 'expectedTitle';
        var expectedDuration = 1;
        var test = new Test(expectedTitle);
        test.duration = expectedDuration;
        test.slow = function () { return 2; };

        runner.on = function (event, callback) {
          if (event === 'pass') {
            callback(test);
          }
        };
        Step.call({epilogue: function () {}}, runner);
        process.stdout.write = stdoutWrite;
        var expectedString = Base.symbols.ok + ' passed ' + expectedTitle + ' (' + expectedDuration + 'ms)' + '\n';
        stdout[0].should.equal(expectedString);
      });
    });
  });
  describe('on fail', function () {
    it('should return title and stack trace', function () {
      var expectedTitle = 'expectedTitle';
      var expectedDuration = 1;
      var err = new Error('test');
      err.actual = 'a\ninline\ndiff\nwith\nmultiple lines';
      err.expected = 'a\ninline\ndiff\nwith\nmultiple lines';
      err.showDiff = false;
      var test = new Test(expectedTitle);
      test.duration = expectedDuration;
      test.retries(1);
      runner.on = function (event, callback) {
        if (event === 'fail') {
          callback(test, err);
        }
      };
      Step.call({epilogue: function () {}}, runner);
      process.stdout.write = stdoutWrite;
      var message = Base.symbols.err + ' failed ' + expectedTitle + ' (' + expectedDuration + 'ms)' + '\n';
      var stackTrace = 'Error: test';
      stdout[0].should.deepEqual(message);
      expect(stdout[1]).to.contain(stackTrace);
    });
  });
  describe('on retryable fail', function () {
    it('should log stack trace should return retry title', function () {
      var expectedTitle = 'expectedTitle';
      var expectedDuration = 1;
      var err = new Error('test');
      err.actual = 'a\ninline\ndiff\nwith\nmultiple lines';
      err.expected = 'a\ninline\ndiff\nwith\nmultiple lines';
      err.showDiff = false;
      var test = new Test(expectedTitle);
      test.duration = expectedDuration;
      runner.on = function (event, callback) {
        if (event === 'retryable fail') {
          callback(test, err);
        }
      };
      Step.call({epilogue: function () {}}, runner);
      process.stdout.write = stdoutWrite;
      var message = '! failed ' + expectedTitle + ' (' + expectedDuration + 'ms)' + '\n';
      var stackTrace = 'Error: test';
      stdout[0].should.deepEqual(message);
      expect(stdout[1]).to.contain(stackTrace);
    });
  });
  describe('on suite end', function () {
    it('should log total duration', function () {
      var suiteTitle = 'Suite title';
      var parentSuite = new Suite('', function () {});
      var suite = new Suite(suiteTitle, parentSuite);
      runner.on = function (event, callback) {
        if (event === 'suite') {
          callback(parentSuite);
          callback(suite);
        }
        if (event === 'suite end') {
          callback(suite);
          callback(parentSuite);
        }
      };
      Step.call({epilogue: function () {}}, runner);
      process.stdout.write = stdoutWrite;
      var message = 'Total Duration';
      expect(stdout[2]).to.contain('end ' + suiteTitle);
      expect(stdout[3]).to.contain(message);
    });
  });
});
