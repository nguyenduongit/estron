// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // true: Cho phép Metro bundle cho web (nếu bạn vẫn build PWA/web)
  // false: Chỉ bundle cho native (Android, iOS)
  // Mặc định là true nếu bạn có "web" trong "platforms" của app.json
  isCSSEnabled: true,
});

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  assert: require.resolve('assert'),
  crypto: require.resolve('react-native-get-random-values'),
  events: require.resolve('events'),
  path: require.resolve('path-browserify'),
  stream: require.resolve('readable-stream'),
  url: require.resolve('react-native-url-polyfill'),
  util: require.resolve('util'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  net: require.resolve('react-native-tcp-socket'),
  tls: require.resolve('react-native-tcp-socket'),
  zlib: require.resolve('browserify-zlib'),
};

module.exports = config;