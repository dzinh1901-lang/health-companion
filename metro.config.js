const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

// Ensure the react-native-css-interop cache directory exists and is watched.
// When forceWriteFileSystem is true, NativeWind writes web.css there, but Metro
// excludes node_modules sub-directories from its file watcher by default which
// causes "Failed to get the SHA-1" errors during `expo export --platform web`.
const cssInteropCachePath = path.resolve(
  __dirname,
  "node_modules/react-native-css-interop/.cache"
);
try {
  fs.mkdirSync(cssInteropCachePath, { recursive: true });
} catch (e) {
  console.warn("metro.config.js: could not create css-interop cache dir:", e);
}
config.watchFolders = [...(config.watchFolders ?? []), cssInteropCachePath];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
