/**
 * Global test setup
 * Suppress console logs during tests
 */

let consoleLog, consoleWarn, consoleError;

export const mochaHooks = {
  beforeAll() {
    consoleLog = console.log;
    consoleWarn = console.warn;
    consoleError = console.error;

    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
  },

  afterAll() {
    console.log = consoleLog;
    console.warn = consoleWarn;
    console.error = consoleError;
  }
};
