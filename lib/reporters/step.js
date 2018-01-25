'use strict';

/**
 * Module dependencies.
 */

var Base = require('./base');
var inherits = require('../utils').inherits;
var color = Base.color;
var utils = require('../utils');

/**
 * Expose `Step`.
 */

exports = module.exports = Step;

/**
 * Initialize a new `Step` test reporter.
 *
 * @api public
 * @param {Runner} runner
 */
function Step (runner) {
  Base.call(this, runner);
  Base.colors.skipped = 35;
  Base.colors.suite = 1;
  var indents = 0;

  function indent () {
    return new Array(indents).join('  ');
  }

  runner.on('start', function () {
    // console.log("------------------on start---------------------");
  });

  runner.on('suite', function (suite) {
    suite.startTime = new Date().getTime();
    var fmt = indent() + color('suite', '%s');
    console.log(fmt, suite.title);
    indents++;
  });

  runner.on('pending', function (test) {
    var fmt = indent() + color('skipped', '* skipped %s');
    console.log(fmt, test.title);
  });

  runner.on('hook', function (test) {
    // before: before, before each, after, after each
    // console.log("------------------hook---------------------");
  });

  runner.on('hook end', function (test) {
    // after: before, before each, after, after each
    // console.log("------------------hook end---------------------");
  });

  runner.on('test', function (test) {
    var fmt;
    // log the beginning of each test
    if (test.currentRetry() > 0) {
      fmt = indent() + Base.color('bright yellow', '- retry' + test._currentRetry + ' %s');
    } else {
      fmt = indent() + color('pending', '- start %s');
    }
    console.log(fmt, test.title);
  });

  runner.on('retryable fail', function (test, err) {
    // log error and warning
    var fmt = indent() + color('bright fail', Base.symbols.bang + ' failed %s') + color('fail', ' (%dms)');
    console.log(fmt, test.title, test.duration);
    console.log(errMsg(test, err), errStack(err));
  });

  runner.on('test end', function (test) {
    // console.log("------------------test end---------------------");
  });

  runner.on('pass', function (test) {
    var fmt = indent() + color('bright pass', Base.symbols.ok + ' passed %s') + color(test.speed, ' (%dms)');
    console.log(fmt, test.title, test.duration);
  });

  runner.on('fail', function (test, err) {
    var fmt = indent() + color('fail', Base.symbols.err + ' failed %s') + color('fail', ' (%dms)');
    console.log(fmt, test.title, test.duration);
    console.log(errMsg(test, test.err), errStack(err));
  });

  runner.on('suite end', function (suite) {
    indents--;
    suite.endTime = new Date().getTime();
    suite.totalDuration = suite.endTime - suite.startTime;
    var fmt;
    if (indents > 0) {
      fmt = indent() + color('suite', 'end ' + suite.title);
    }
    if (indents === 0) {
      fmt = indent() + color('suite', 'Total Duration (' + suite.totalDuration + 'ms)');
    }
    console.log(fmt);
  });

  runner.on('end', function () {
    // console.log("--------------end-------------");
  });

  function errMsg (test, err) {
    // msg
    var msg;
    if (!err) {
      err = test.err;
    }
    // get best message
    var message;
    if (err.message && typeof err.message.toString === 'function') {
      message = err.message + '';
    } else if (typeof err.inspect === 'function') {
      message = err.inspect() + '';
    } else {
      message = '';
    }
    var stack = err.stack || message;
    var index = message ? stack.indexOf(message) : -1;
    var actual = err.actual;
    var expected = err.expected;

    if (index === -1) {
      msg = message;
    } else {
      index += message.length;
      msg = stack.slice(0, index);
    }

    // uncaught
    if (err.uncaught) {
      msg = 'Uncaught ' + msg;
    }
    // explicitly show diff
    if (err.showDiff !== false && sameType(actual, expected) && expected !== undefined) {
      if (!(utils.isString(actual) && utils.isString(expected))) {
        err.actual = utils.stringify(actual);
        err.expected = utils.stringify(expected);
      }

      var match = message.match(/^([^:]+): expected/);
      indents++;
      msg = indent() + color('error message', match ? match[1] : msg);
      indents++;
      // legend
      msg += '\n' + indent() + color('diff removed', 'actual') + ' | ' + color('diff added', 'expected');
      // values
      msg += '\n' + indent() + color('diff removed', err.actual) + ' | ' + color('diff added', err.expected) + '\n\n';
      indents--;
      indents--;
    }
    return msg;
  }

  function errStack (err) {
    // Get message and remove it from stack trace
    var message;
    if (err.message && typeof err.message.toString === 'function') {
      message = err.message + '';
    } else if (typeof err.inspect === 'function') {
      message = err.inspect() + '';
    } else {
      message = '';
    }
    var stack = err.stack || message;
    var index = message ? stack.indexOf(message) : -1;

    if (index !== -1) {
      index += message.length;
      // remove msg from stack
      stack = stack.slice(index + 1);
    }

    return stack;
  }
}

/**
 * Object#toString reference.
 */
var objToString = Object.prototype.toString;

/**
 * Check that a / b have the same type.
 *
 * @api private
 * @param {Object} a
 * @param {Object} b
 * @return {boolean}
 */
function sameType (a, b) {
  return objToString.call(a) === objToString.call(b);
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(Step, Base);
