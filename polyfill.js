// Polyfill for 'self' in Node.js environment
// Create a minimal self object instead of pointing to global
if (typeof self === 'undefined') {
  global.self = {};
}
