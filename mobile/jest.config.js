const path = require('path')

const jestExpoPreset = require('jest-expo/jest-preset')

// Replace react-native/jest/setup.js (ESM in RN 0.83+) with our CJS stub
const patchedSetupFiles = (jestExpoPreset.setupFiles || []).map((f) =>
  f.replace(/\\/g, '/').includes('react-native/jest/setup')
    ? path.resolve(__dirname, 'jest-setup-rn.js')
    : f
)

const TRANSFORM_PACKAGES = [
  'react-native',
  '@react-native',
  'expo',
  '@expo',
  'react-navigation',
  '@react-navigation',
  'zustand',
  'zod',
  '@hookform',
  'nativewind',
  'react-native-css-interop',
].join('|')

module.exports = {
  ...jestExpoPreset,
  setupFiles: patchedSetupFiles,
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './src/tests/setup.ts'],
  transformIgnorePatterns: [
    `node_modules/(?!(.pnpm/)?(${TRANSFORM_PACKAGES}))`,
  ],
  // Provide CJS-compatible mocks for modules that use ESM in RN 0.83+
  moduleNameMapper: {
    ...jestExpoPreset.moduleNameMapper,
    '^react-native$': path.resolve(__dirname, '__mocks__/react-native.js'),
    '^react-native/Libraries/BatchedBridge/NativeModules$': path.resolve(
      __dirname,
      '__mocks__/NativeModules.js'
    ),
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
}
