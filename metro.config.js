const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Polyfill for punycode used by markdown-it
config.resolver.extraNodeModules = {
  punycode: require.resolve('punycode/'),
};

module.exports = config;
