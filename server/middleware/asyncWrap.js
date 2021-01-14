const asyncWrap = (fn) => (...args) =>
  Promise.resolve(fn(...args)).catch(args[2]);

export default asyncWrap;
