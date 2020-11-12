import { FakePromise } from './fake-promise';

const assertionFailed = e => fail("assertion failed: " + e.message);

describe('thenable', () => {

  it('can be anything with a then', async () => {
    const p = {
      then: (resolve,reject) => setTimeout( () => resolve(42), 100)
    };
    expect(await p).toBe(42);
  });
});

describe('Promise.resolve', () => {

  it('FakePromise', async () =>  {
    var p = await FakePromise.resolve("one");
    expect(p).toBe("one");
  });

  it('Promise', async () =>  {
    var p = await Promise.resolve("one");
    expect(p).toBe("one");
  });
});

describe('Promises can only be resolved once', () => {

  const tryResolvingTwice = (resolve, reject) => {
    resolve("one");
    resolve("two");
  };

  it('FakePromise', async () =>  {
    var p = await new FakePromise(tryResolvingTwice);
    expect(p).toBe("one");
  });

  it('Promise', async () =>  {
    var p = await new Promise(tryResolvingTwice);
    expect(p).toBe("one");
  });
});

describe('Promises can only be rejected once', () => {

  const tryRejectingTwice = (resolve, reject) => {
    reject(Error("no"));
    reject(Error("I said no"));
  };

  it('FakePromise', async () =>  {
    expect.assertions(1);
    new FakePromise(tryRejectingTwice)
      .catch(e => expect(e.message).toBe("no"))
      .catch(e => expect(e.message).toBe("no"));
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    new Promise(tryRejectingTwice)
      .catch(e => expect(e.message).toBe("no"))
      .catch(e => expect(e.message).toBe("no"));
  });
});

describe('Promise constructor, resolve immediately', () => {
  it('FakePromise', async () =>  {
    var p = await new FakePromise( (resolve, reject) => resolve("two"));
    expect(p).toBe("two");
  });

  it('Promise', async () =>  {
    var p = await new Promise((resolve, reject) => resolve("two"));
    expect(p).toBe("two");
  });
});

describe('Promise constructor, deferred resolution', () => {

  const delayedResolve = (resolve, reject) => {
    setTimeout(() => resolve("two"), 250);
  };

  it('FakePromise', async () =>  {
    var p = await new FakePromise(delayedResolve);
    expect(p).toBe("two");
  });

  it('Promise', async () =>  {
    var p = await new Promise(delayedResolve);
    expect(p).toBe("two");
  });
});

describe('Promise constructor, error in executor rejects promise', () => {

  const wtf = (resolve, reject) => { throw Error("wtf"); };
  const expectWtf = e => expect(e.message).toBe("wtf");

  it('FakePromise', async () =>  {
    expect.assertions(1);
    new FakePromise(wtf).catch(expectWtf).catch(assertionFailed);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    new Promise(wtf).catch(expectWtf).catch(assertionFailed);
  });

});

describe('Promise constructor, reject immediately', () => {

  const rejectWithError = (resolve, reject) => reject(Error("oh no"));

  it('FakePromise', async () =>  {
    expect.assertions(1);
    try { await new FakePromise(rejectWithError); }
    catch (error) { expect(error.message).toBe("oh no"); }
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    try { await new Promise(rejectWithError); }
    catch (error) { expect(error.message).toBe("oh no"); }
  });

});

describe('Promise constructor, deferred rejection', () => {

  const deferredRejectWithError = (resolve, reject) => {
    setTimeout(() => reject(Error("oh no")), 250);
  };

  it('FakePromise', async () =>  {
    expect.assertions(1);
    try { await new FakePromise(deferredRejectWithError); }
    catch (error) { expect(error.message).toBe("oh no"); }
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    try { await new Promise(deferredRejectWithError); }
    catch (error) { expect(error.message).toBe("oh no"); }
  });

});

describe('Promise.reject', () => {

  const expectOops = e => expect(e.message).toBe("oops");

  it('FakePromise', async () =>  {
    expect.assertions(1);
    FakePromise.reject(new Error("oops")).catch(expectOops).catch(assertionFailed);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    Promise.reject(new Error("oops")).catch(expectOops).catch(assertionFailed);
  });
});

describe('Promise.then', () => {

  const add2 = (x) => x + 2;

  it('FakePromise', async () =>  {
    expect.assertions(1);
    const p = await FakePromise.resolve(1).then(add2);
    expect(p).toBe(3);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    const p = await Promise.resolve(1).then(add2);
    expect(p).toBe(3);
  });
});

describe('Promise.then chained', () => {

  const add2 = (x) => x + 2;
  const times3 = (x) => x * 3;

  it('FakePromise', async () =>  {
    expect.assertions(1);
    const p = FakePromise.resolve(12).then(add2).then(times3);
    expect(await p).toBe(42);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    const p = Promise.resolve(12).then(add2).then(times3);
    expect(await p).toBe(42);
  });
});

describe('Promise.then if onResolve is not a function then resolve with the fulfilled value', () => {

  it('FakePromise', async () =>  {
    expect.assertions(1);
    const p = FakePromise.resolve(12).then(undefined);
    expect(await p).toBe(12);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    const p = Promise.resolve(12).then(undefined);
    expect(await p).toBe(12);
  });
});

describe('Promise.then can be called multiple times on the same promise', () => {

  it('FakePromise', async () =>  {
    expect.assertions(2);
    let resolve_p;
    const p = new FakePromise((resolve, reject) => resolve_p = resolve);
    const p0 = p.then(x => x + 1).then(x => expect(x).toBe(2)).catch(assertionFailed);
    const p1 = p.then(x => x + 2).then(x => expect(x).toBe(3)).catch(assertionFailed);
    resolve_p(1);
  });

  it('Promise', async () =>  {
    expect.assertions(2);
    let resolve_p;
    const p = new Promise((resolve, reject) => resolve_p = resolve);
    const p0 = p.then(x => x + 1).then(x => expect(x).toBe(2)).catch(assertionFailed);
    const p1 = p.then(x => x + 2).then(x => expect(x).toBe(3)).catch(assertionFailed);
    resolve_p(1);
  });
});

describe('Promise.catch is ignored if then succeeds', () => {

  const expect1 = () => expect(1).toBe(1);
  const add3 = (x) => x + 3;

  it('FakePromise', async () =>  {
    expect.assertions(0);
    FakePromise.resolve(2).then(add3).catch(expect1);
  });

  it('Promise', async () =>  {
    expect.assertions(0);
    Promise.resolve(2).then(add3).catch(expect1);
  });
});

describe('Promise.catch will catch an error from chained thens', () => {

  const add3 = x => x + 3;
  const times3 = x => x * 3;
  const blowUp = x => { throw Error("nope"); };
  const expectNope = e => expect(e.message).toBe("nope");

  it('FakePromise', async () =>  {
    expect.assertions(1);
    FakePromise.resolve(2).then(add3).then(blowUp).then(times3).catch(expectNope).catch(assertionFailed);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    Promise.resolve(2).then(add3).then(blowUp).then(times3).catch(expectNope).catch(assertionFailed);
  });
});

describe('Promise.catch can return a value that results in a resolved promise', () => {

  const add3 = x => x + 3;
  const times3 = x => x * 3;
  const blowUp = x => { throw Error(); };
  const return14 = e => 14;

  it('FakePromise', async () =>  {
    expect.assertions(1);
    const n = await FakePromise.resolve(1).then(add3).then(blowUp).then(times3).catch(return14).then(times3);
    expect(n).toBe(42);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    const n = await Promise.resolve(1).then(add3).then(blowUp).then(times3).catch(return14).then(times3);
    expect(n).toBe(42);
  });
});

describe('Exception in Promise.then results in rejection', () => {

  const blowup = (x) => { throw Error("ugh"); };
  const expectUgh = e => expect(e.message).toBe("ugh");

  it('FakePromise', async () =>  {
    expect.assertions(1);
    FakePromise.resolve(2).then(blowup).catch(expectUgh).catch(assertionFailed);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    Promise.resolve(2).then(blowup).catch(expectUgh).catch(assertionFailed);
  });
});

describe('Exception in Promise.then(null, onReject) results in rejection with onReject error', () => {

  const blowup = () => { throw Error("boom!"); };
  const expectError = e => expect(e.message).toBe("boom!");

  it('FakePromise', async () =>  {
    expect.assertions(2);
    FakePromise.reject("oops").then(null, blowup).catch(expectError).catch(assertionFailed);
    FakePromise.reject("oops").catch(blowup).catch(expectError).catch(assertionFailed);
  });

  it('Promise', async () =>  {
    expect.assertions(2);
    Promise.reject(2).then(null, blowup).catch(expectError).catch(assertionFailed);
    Promise.reject(2).catch(blowup).catch(expectError).catch(assertionFailed);
  });

});

describe('Promise.all returns resolved promises in order', () => {

  const expect123 = result => expect(result).toStrictEqual([1,2,3]);

  it('FakePromise', () =>  {
    expect.assertions(1);

    let p0_resolve;
    const p0 = new FakePromise( (resolve,reject) => p0_resolve = resolve);

    let p1_resolve;
    const p1 = new FakePromise( (resolve,reject) => p1_resolve = resolve);

    let p2_resolve;
    const p2 = new FakePromise( (resolve,reject) => p2_resolve = resolve);

    const all = FakePromise.all([p0, p1, p2]).then(expect123).catch(assertionFailed);

    p2_resolve(3);
    p0_resolve(1);
    p1_resolve(2);
  });

  it('Promise', () =>  {
    expect.assertions(1);

    let p0_resolve;
    const p0 = new Promise( (resolve,reject) => p0_resolve = resolve);

    let p1_resolve;
    const p1 = new Promise( (resolve,reject) => p1_resolve = resolve);

    let p2_resolve;
    const p2 = new Promise( (resolve,reject) => p2_resolve = resolve);

    const all = Promise.all([p0, p1, p2]).then(expect123).catch(assertionFailed);

    p2_resolve(3);
    p0_resolve(1);
    p1_resolve(2);
  });
});

describe('Promise.all returns reason of first rejected promise', () => {

  it('FakePromise', () =>  {
    expect.assertions(1);

    let p0_reject;
    const p0 = new Promise( (resolve,reject) => p0_reject = reject);

    let p1_reject;
    const p1 = new Promise( (resolve,reject) => p1_reject = reject);

    let p2_reject;
    const p2 = new Promise( (resolve,reject) => p2_reject = reject);

    const all = FakePromise.all([p0, p1, p2])
      .catch(error => expect(error.message).toBe("two"))
      .catch(assertionFailed);

    p2_reject(Error("two"));
    p1_reject(Error("one"));
    p0_reject(Error("zero"));
  });

  it('Promise', () =>  {
    expect.assertions(1);

    let p0_reject;
    const p0 = new Promise( (resolve,reject) => p0_reject = reject);

    let p1_reject;
    const p1 = new Promise( (resolve,reject) => p1_reject = reject);

    let p2_reject;
    const p2 = new Promise( (resolve,reject) => p2_reject = reject);

    const all = Promise.all([p0, p1, p2]).catch(error => expect(error.message).toBe("two")).catch(assertionFailed);

    p2_reject(Error("two"));
    p1_reject(Error("one"));
    p0_reject(Error("zero"));
  });
});

describe('Promises/A+ resolution', () => {
  it ('2.3.1 cannot resolve a promise with itself', () => {
    expect.assertions(1);
    const p = new FakePromise();
    try { FakePromise.__resolve_promise_aplus__(p,p); }
    catch (error) { expect(error.message).toBe("cannot resolve a promise with itself"); }
  });

  it ('2.3.2.1 wait until x is fulfilled or rejected', () => {
    const x = new FakePromise();
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isPending()).toBe(true);
  });

  it ('2.3.2.2 when x is fulfilled, resolve promise with its value', () => {
    const x = FakePromise.resolve(1);
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isFulfilled()).toBe(true);
    expect(promise._value).toBe(1);
  });

  it ('2.3.2.3 when x is rejected, resolve promise with its reason', () => {
    const x = FakePromise.reject(Error("oops"));
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isRejected()).toBe(true);
    expect(promise._value.message).toBe("oops");
  });

  it ('2.3.3.1 when resolve is called with value y, run [[Resolve]](promise, y)', () => {
    const x = { then: (resolve,reject) => resolve(3) };
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isFulfilled()).toBe(true);
    expect(promise._value).toBe(3);
  });

  it ('2.3.3.2 when reject is called with reason r, reject promise with r', () => {
    const x = { then: (resolve,reject) => reject(Error("no")) };
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isRejected()).toBe(true);
    expect(promise._value.message).toBe("no");
  });

  it ('2.3.3.3 (a) only the first call to resolve takes effect', () => {
    const x = { then: (resolve,reject) => {
      resolve(1);
      resolve(2);
    }};
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isFulfilled()).toBe(true);
    expect(promise._value).toBe(1);
  });

  it ('2.3.3.3 (b) only the first call to reject takes effect', () => {
    const x = { then: (resolve,reject) => {
      reject(Error("no"));
      reject(Error("yes"));
    }};
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isRejected()).toBe(true);
    expect(promise._value.message).toBe("no");
  });

  it ('2.3.3.3 (c) calling reject after resolve has no effect', () => {
    const x = { then: (resolve,reject) => {
      resolve(1);
      reject(Error("no"));
    }};
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isFulfilled()).toBe(true);
    expect(promise._value).toBe(1);
  });

  it ('2.3.3.3 (d) calling resolve after reject has no effect', () => {
    const x = { then: (resolve,reject) => {
      reject(Error("no"));
      resolve(1);
    }};
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isRejected()).toBe(true);
    expect(promise._value.message).toBe("no");
  });

  it ('2.3.3.4 when x.then is not a function, resolve promise with x', () => {
    const x = {then:1};
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isFulfilled()).toBe(true);
    expect(promise._value).toBe(x);
  });

  it ('2.3.4 when x is not a function or object, resolve promise with x', () => {
    const x = 1;
    const promise = new FakePromise();
    FakePromise.__resolve_promise_aplus__(promise, x);
    expect(promise.isFulfilled()).toBe(true);
    expect(promise._value).toBe(x);
  });

});
