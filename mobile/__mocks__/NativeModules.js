// CJS mock for react-native NativeModules (ESM in RN 0.83+)
// jest-expo accesses .default on this module
const NativeModules = {
  UIManager: {},
  NativeUnimoduleProxy: {
    viewManagersMetadata: {},
    modulesConstants: {},
    exportedMethods: {},
  },
  Linking: {},
  ImageLoader: {},
  ImageViewManager: {},
  PlatformConstants: {
    forceTouchAvailable: false,
    interfaceIdiom: 'phone',
    isTesting: true,
    osVersion: '14.0',
    reactNativeVersion: { major: 0, minor: 83, patch: 2 },
    systemName: 'iOS',
  },
  StatusBarManager: { HEIGHT: 44 },
  Networking: {},
  DevSettings: {},
  DevMenu: {},
  ExponentConstants: {},
}

module.exports = { default: NativeModules, ...NativeModules }

// Mock TurboModuleRegistry to prevent "module not found" errors
const TurboModuleRegistry = {
  get: jest.fn(() => null),
  getEnforcing: jest.fn((name) => {
    const mocks = {
      SourceCode: { scriptURL: 'http://localhost:8081/index.bundle' },
      PlatformConstants: NativeModules.PlatformConstants,
      StatusBarManager: NativeModules.StatusBarManager,
    }
    return mocks[name] ?? {}
  }),
}

global.__turboModuleProxy = (name) => TurboModuleRegistry.getEnforcing(name)
