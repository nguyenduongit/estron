// metro.config.js
// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // true: Cho phép Metro bundle cho web (nếu bạn vẫn build PWA/web)
  // false: Chỉ bundle cho native (Android, iOS)
  // Mặc định là true nếu bạn có "web" trong "platforms" của app.json
  isCSSEnabled: true,
});



module.exports = config;