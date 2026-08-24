module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@notifee|@supabase|@testing-library)/)',
  ],
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/env.js',
  },
};
