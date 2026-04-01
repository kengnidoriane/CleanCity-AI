// CJS-compatible replacement for react-native/jest/setup.js (RN 0.83+ uses ESM)

global.IS_REACT_ACT_ENVIRONMENT = true
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true
global.__DEV__ = true

// Required by NativeModules.js
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
}

global.cancelAnimationFrame = global.clearTimeout
global.requestAnimationFrame = (callback) => setTimeout(callback, 0)

// Silence act() warnings in tests
global.IS_REACT_ACT_ENVIRONMENT = true
