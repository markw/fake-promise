
function isFunction(f) {
  return "function" === typeof f;
}

function isObject(o) {
  return "object" === typeof o;
}

const PENDING   = 0;
const FULFILLED = 1;
const REJECTED  = 2;

export class FakePromise {

  static resolve(value) {
    return new FakePromise( resolve => resolve(value));
  }

  static reject(error) {
    return new FakePromise( (resolve, reject) => reject(error));
  }

  static all(promises) {

    return new FakePromise( (resolve,reject) => {
      const results = [];
      const push = x => {
        results.push(x);
        if (results.length === promises.length) {
          resolve(results);
        }
      };
      promises.forEach(async p => {
        try { push(await p); }
        catch (error) {
          reject(error);
        }
      });
    });
  }

  constructor(executor) {
    this._value = undefined;
    this._state = PENDING;
    this._chainedPromises = [];

    if (isFunction(executor)) {

      const resolve = x => {
        if (this.isPending()) {
          FakePromise.__resolve_promise_aplus__(this, x);
        }
      };

      const reject = (x) => {
        if (this.isPending()) {
          this._private_reject(x);
        }
      };

      try {
        executor(resolve.bind(this), reject.bind(this));
      }
      catch (error) {
        reject(error);
      }
    }
  }

  isPending() {
    return this._state === PENDING;
  }

  isRejected() {
    return this._state === REJECTED;
  }

  isFulfilled() {
    return this._state === FULFILLED;
  }

  then(onResolve, onReject) {
    const p = new FakePromise();

    switch(this._state) {
      case PENDING:
        const record = {onResolve, onReject, promise: p};
        this._chainedPromises.push(record);
        break;

      case FULFILLED:
        if (isFunction(onResolve)) {
          try {
            const x = onResolve(this._value);
            FakePromise.__resolve_promise_aplus__(p, x);
          }
          catch (error) {
            p._private_reject(error);
          }
        }
        else {
          FakePromise.__resolve_promise_aplus__(p, this._value);
        }
        break;

      case REJECTED:
        if (isFunction(onReject)) {
          try {
            const x = onReject(this._value);
            FakePromise.__resolve_promise_aplus__(p, x);
          }
          catch (error) {
            p._private_reject(error);
          }
        }
        else {
          p._private_reject(this._value);
        }
        break;
    }
    return p;
  }

  catch(onReject) {
    return this.then(undefined, onReject);
  }

  // "private" methods, not part of the spec, not intended to be called from outside this class

  // implementation of method described at
  // https://promisesaplus.com/#the-promise-resolution-procedure
  static __resolve_promise_aplus__(promise, x) {

    if (promise === x) {
      throw new TypeError("cannot resolve a promise with itself");
    }

    var settled = false;

    const resolve = y => {
      if (!settled) {
        promise._private_resolve(y);
        settled = true;
      };
    };

    const reject = a => {
      if (!settled) {
        promise._private_reject(a);
        settled = true;
      }
    };

    if (x instanceof FakePromise) {
      if (x.isFulfilled()) {
        promise._private_resolve(x._value);
      }
      else if (x.isRejected()) {
        promise._private_reject(x._value);
      }
      else {
        x._chainedPromises.push({onResolve: resolve, onReject: reject, promise});
      }
    }
    else if (isObject(x) || isFunction(x)) {
      if (isFunction(x.then)) {
        try { x.then(resolve, reject); }
        catch (error) { reject(error); }
      }
      else {
        promise._private_resolve(x);
      }
    }
    else {
      promise._private_resolve(x);
    }
  }

  _private_resolve(value) {
    this._value = value;
    this._state = FULFILLED;
    this._chainedPromises.forEach(record => {
      const promise = record.promise;
      if (record.onResolve) {
        try {
          const newValue = record.onResolve(value);
          FakePromise.__resolve_promise_aplus__(promise, newValue);
        }
        catch (error) {
          promise._private_reject(error);
        }
      }
      else {
        FakePromise.__resolve_promise_aplus__(record.promise, value);
      }
    });
  }

  _private_reject(reason) {
    this._value = reason;
    this._state = REJECTED;
    this._chainedPromises.forEach(record => {
      const promise = record.promise;
      if (record.onReject) {
        try {
          const newReason =  record.onReject(reason);
          promise._private_reject(newReason);
        }
        catch (error) {
          promise._private_reject(error);
        }
      }
      else {
        promise._private_reject(reason);
      }
    });
  }
}
