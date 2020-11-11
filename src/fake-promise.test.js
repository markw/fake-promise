import { FakePromise } from './fake-promise';

describe('thenable', () => {

  it('can be anything with a then', async () => {
    const p = {
      then: (resolve,reject) => setTimeout( () => resolve(42), 100)
    };
    const q = await p;
    expect(q).toBe(42);
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

describe('Promises can only resolved once', () => {

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

describe('Promise can only rejected once', () => {

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
    var p = new FakePromise( (resolve, reject) => {
      resolve("two");
    });
    var q = await p;
    expect(q).toBe("two");
  });

  it('Promise', async () =>  {
    var p = new Promise( (resolve, reject) => {
      resolve("two");
    });
    var q = await p;
    expect(q).toBe("two");
  });
});

describe('Promise constructor, deferred resolution', () => {

  const delayedResolve = (resolve, reject) => {
    setTimeout(() => resolve("two"), 250);
  };

  it('FakePromise', async () =>  {
    var p = new FakePromise(delayedResolve);
    var q = await p;
    expect(q).toBe("two");
  });

  it('Promise', async () =>  {
    var p = new Promise(delayedResolve);
    var q = await p;
    expect(q).toBe("two");
  });
});

describe('Promise constructor, error in executor rejects promise', () => {

  const wtf = (resolve, reject) => { throw Error("wtf"); };

  it('FakePromise', async () =>  {
    expect.assertions(1);
    new FakePromise(wtf).catch(e => expect(e.message).toBe("wtf"));
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    new Promise(wtf).catch(e => expect(e.message).toBe("wtf"));
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
    FakePromise.reject(new Error("oops")).catch(expectOops);
  });

  it('Promise', async () =>  {
    expect.assertions(1);
    Promise.reject(new Error("oops")).catch(expectOops);
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
  const assertionFailed = e => fail("assertion failed: " + e.message);

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
  const assertionFailed = e => fail("assertion failed: " + e.message);

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
  const assertionFailed = e => fail("assertion failed: " + e.message);

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
  const assertionFailed = e => fail("assertion failed: " + e.message);

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

  const assertionFailed = e => fail("assertion failed: " + e.message);
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

  const assertionFailed = e => fail("assertion failed: " + e.message);

  it('FakePromise', () =>  {
    expect.assertions(1);

    let p0_reject;
    const p0 = new Promise( (resolve,reject) => p0_reject = reject);

    let p1_reject;
    const p1 = new Promise( (resolve,reject) => p1_reject = reject);
    
    let p2_reject;
    const p2 = new Promise( (resolve,reject) => p2_reject = reject);

    const all = FakePromise.all([p0, p1, p2]).catch(error => expect(error.message).toBe("two")).catch(assertionFailed);

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
