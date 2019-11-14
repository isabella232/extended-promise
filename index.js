'use strict';

function ExtendedPromise(options) {
  var self = this;

  this._promise = new ExtendedPromise.Promise(function (resolve, reject) {
    self._resolveFunction = resolve;
    self._rejectFunction = reject;
  });

  options = options || {};
  this._onResolve = options.onResolve || ExtendedPromise.defaultOnResolve;
  this._onReject = options.onReject || ExtendedPromise.defaultOnReject;

  this._resetState();

  this._promise.resolve = this.resolve.bind(this);
  this._promise.reject = this.reject.bind(this);

  return this._promise;
}

ExtendedPromise.setPromise = function (PromiseClass) {
  ExtendedPromise.Promise = PromiseClass;

  if (!ExtendedPromise.Promise) {
    // if no Promise object is available
    // skip method setup
  }

  Object.getOwnPropertyNames(ExtendedPromise.Promise).forEach(function (method) {
    if (typeof ExtendedPromise.Promise[method] === 'function') {
      ExtendedPromise[method] = function () {
        var args = Array.prototype.slice.call(arguments);

        return ExtendedPromise.Promise[method].apply(ExtendedPromise.Promise, args);
      };
    }
  });
};

// default to system level Promise, but allow it to be overwritten
ExtendedPromise.setPromise(global.Promise);

ExtendedPromise.defaultOnResolve = function (result) {
  return ExtendedPromise.Promise.resolve(result);
};

ExtendedPromise.defaultOnReject = function (err) {
  return ExtendedPromise.Promise.reject(err);
};

ExtendedPromise.prototype.resolve = function (arg) {
  var self = this;

  if (this._promise.isFulfilled) {
    return this._promise;
  }
  this._setResolved();

  ExtendedPromise.Promise.resolve().then(function () {
    return self._onResolve(arg);
  }).then(this._resolveFunction).catch(function (err) {
    self._resetState();

    self._promise.reject(err);
  });

  return this._promise;
};

ExtendedPromise.prototype.reject = function (arg) {
  var self = this;

  if (this._promise.isFulfilled) {
    return this._promise;
  }
  this._setRejected();

  ExtendedPromise.Promise.resolve().then(function () {
    return self._onReject(arg);
  }).then(function (result) {
    self._setResolved();

    self._resolveFunction(result);
  }).catch(this._rejectFunction);

  return this._promise;
};

ExtendedPromise.prototype._resetState = function () {
  this._promise.isFulfilled = false;
  this._promise.isResolved = false;
  this._promise.isRejected = false;
};

ExtendedPromise.prototype._setResolved = function () {
  this._promise.isFulfilled = true;
  this._promise.isResolved = true;
  this._promise.isRejected = false;
};

ExtendedPromise.prototype._setRejected = function () {
  this._promise.isFulfilled = true;
  this._promise.isResolved = false;
  this._promise.isRejected = true;
};

module.exports = ExtendedPromise;
