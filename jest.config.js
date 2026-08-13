module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@notifee|@supabase)/)',
  ],
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/env.js',
  },
};
