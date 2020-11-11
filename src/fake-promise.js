
function isFunction(f) {
  return "function" === typeof f;
}

export class FakePromise {

  // implementation of method described at
  // https://promisesaplus.com/#the-promise-resolution-procedure
  static __resolve_promise_aplus__(promise, x) {
  }

  static resolve(value) {
    return new FakePromise( resolve => resolve(value));
  }

  static reject(error) {
    return new FakePromise( (undefined, reject) => reject(error));
  }

  constructor(executor) {
    this._result = undefined;
    this._state = "pending";
    this._chainedResolves = [];
    this._chainedRejects = [];

    if (isFunction(executor)) {

      const resolve = x => {
        if (this.isPending()) {
          this._state = "fulfilled";
          this._result = x;
          this._chainedResolves.forEach(f => f(x));
        }
      };

      const reject = (x) => {
        if (this.isPending()) {
          this._state = "rejected";
          this._result = x;
          this._chainedRejects.forEach(f => f(x));
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
    return this._state === "pending";
  }

  then(onResolve, onReject) {
    const p = new FakePromise();

    switch(this._state) {
      case "pending":
        this._chainedResolves.push(onResolve);
        this._chainedRejects.push(onReject);
        break;

      case "fulfilled":
        p._state = "fulfilled";
        p._result = this._result;

        if (isFunction(onResolve)) {
          try {
            p._result = onResolve(this._result);
          }
          catch (error) {
            p._state = "rejected";
            p._result = isFunction(onReject) ? onReject(error) : error;
          }
        }
        break;

      case "rejected":
        if (isFunction(onReject)) {
          try {
            p._result = onReject(this._result);
            p._state = "fulfilled";
          }
          catch (error) {
            p._state = "rejected";
            p._result = error;
          }
        }
        else {
          p._state = "rejected";
          p._result = this._result;
        }
        break;
    }
    return p;
  }

  catch(onReject) {
    return this.then(undefined, onReject);
  }
}
