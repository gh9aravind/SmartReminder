module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native(?!/jest-preset)|@react-navigation|@notifee|@supabase)/)',
  ],
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/env.js',
  },
};
