# Troubleshooting Guide

## Worklets Version Mismatch Error

If you see this error:
```
ERROR [runtime not ready]: WorkletsError: [Worklets] Mismatch between JavaScript part and native part of Worklets (0.6.1 vs 0.5.1).
```

### Solution 1: Clear Cache and Restart (Recommended for Expo Go)

1. Stop the Expo server (Ctrl+C)
2. Clear all caches:
   ```bash
   npm start -- --clear
   ```
   Or manually:
   ```bash
   npx expo start --clear
   ```
3. In the Expo Go app, shake your device and select "Reload"
4. If that doesn't work, close and reopen the Expo Go app

### Solution 2: Use Development Build (Best for Production Features)

Expo Go has limitations with native modules. For full functionality, especially with:
- `react-native-reanimated` (animations)
- `expo-notifications` (push notifications)
- `expo-calendar` (calendar integration)

Create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for your platform
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

### Solution 3: Check Babel Configuration

Ensure `babel.config.js` includes the reanimated plugin:

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // Must be last
  };
};
```

## Expo Notifications Warning

The warning about `expo-notifications` in Expo Go is expected:
- **Local notifications** (reminders) work in Expo Go
- **Remote push notifications** require a development build

This is fine for development. Local reminders will work as expected.

## Quick Fixes

1. **Clear Metro bundler cache:**
   ```bash
   npx expo start --clear
   ```

2. **Clear watchman cache (if installed):**
   ```bash
   watchman watch-del-all
   ```

3. **Reset Expo Go app:**
   - Close the app completely
   - Clear app data (Android) or reinstall (iOS)
   - Reopen and scan QR code again

4. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```

