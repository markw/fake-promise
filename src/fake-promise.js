
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
      const values = [];
      let count = 0;
      const push = index => x => {
        values[index] = x;
        if (++count === promises.length) {
          resolve(values);
        }
      };
      promises.map((p,index) => p.then(push(index), reject));
    });
  }

  static any(promises) {
    return new FakePromise( (resolve,reject) => {
      const errors = [];
      let count = 0;
      const push = index => x => {
        errors[index] = x;
        if (++count === promises.length) {
          reject({errors});
        }
      };
      promises.map((p,index) => p.then(resolve, push(index)));
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
          this._reject(x);
        }
      };

      try { 
        executor(resolve, reject); 
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
        this._chain(p, onResolve, onReject);
        break;

      case FULFILLED:
        if (isFunction(onResolve)) {
          try {
            const x = onResolve(this._value);
            FakePromise.__resolve_promise_aplus__(p, x);
          }
          catch (error) {
            p._reject(error);
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
            p._reject(error);
          }
        }
        else {
          p._reject(this._value);
        }
        break;
    }
    return p;
  }

  catch(onReject) {
    return this.then(undefined, onReject);
  }

  finally(onFinally) {
    const p = new FakePromise();
    try {
      onFinally();
      FakePromise.__resolve_promise_aplus__(p, this);
    }
    catch (error) {
      p._reject(error);
    }
    return p;
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
        promise._resolve(y);
        settled = true;
      };
    };

    const reject = a => {
      if (!settled) {
        promise._reject(a);
        settled = true;
      }
    };

    if (x instanceof FakePromise) {
      if (x.isFulfilled()) {
        promise._resolve(x._value);
      }
      else if (x.isRejected()) {
        promise._reject(x._value);
      }
      else {
        x._chain(promise, resolve, reject);
      }
    }
    else if (isObject(x) || isFunction(x)) {
      if (isFunction(x.then)) {
        try { x.then(resolve, reject); }
        catch (error) { reject(error); }
      }
      else {
        promise._resolve(x);
      }
    }
    else {
      promise._resolve(x);
    }
  }

  _resolve(value) {
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
          promise._reject(error);
        }
      }
      else {
        FakePromise.__resolve_promise_aplus__(record.promise, value);
      }
    });
  }

  _reject(reason) {
    this._value = reason;
    this._state = REJECTED;
    this._chainedPromises.forEach(record => {
      const promise = record.promise;
      if (record.onReject) {
        try {
          const newReason =  record.onReject(reason);
          promise._reject(newReason);
        }
        catch (error) {
          promise._reject(error);
        }
      }
      else {
        promise._reject(reason);
      }
    });
  }

  _chain(promise, onResolve, onReject) {
    this._chainedPromises.push({promise, onResolve, onReject});
  }
}
