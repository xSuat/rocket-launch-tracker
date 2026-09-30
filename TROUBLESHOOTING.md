# Troubleshooting Guide

## Expo Go vs. Development Builds

Expo Go has limitations with native modules. For full functionality, especially with:
- `expo-notifications` (launch reminders)
- `expo-calendar` (calendar integration)

Create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for your platform
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## Expo Notifications Warning

The app schedules local reminders only. It does not register for remote push. Prebuild would otherwise add the iOS push entitlement because `expo-notifications` is installed; `plugins/withLocalNotificationsOnly.js` removes `aps-environment`.

A warning about `expo-notifications` inside Expo Go is expected. Local reminders still work in Expo Go. A development build is only needed when you want to test the same native binary EAS produces.

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

5. **Check dependency versions against the installed Expo SDK:**
   ```bash
   npx expo install --check
   npx expo-doctor
   ```
