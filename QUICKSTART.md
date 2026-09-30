# Quick Start Guide

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Run on your device:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator / `a` for Android emulator

## Project Structure

```
rocket-launch-tracker/
├── App.tsx                 # Main app entry point
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── components/             # Reusable UI components
│   ├── CountdownTimer.tsx
│   ├── LaunchCard.tsx
│   ├── LoadingState.tsx
│   ├── EmptyState.tsx
│   └── ErrorState.tsx
├── screens/                # Screen components
│   ├── UpcomingLaunchesScreen.tsx
│   ├── HistoricalLaunchesScreen.tsx
│   ├── FavoritesScreen.tsx
│   └── LaunchDetailsScreen.tsx
├── navigation/             # Navigation setup
│   └── AppNavigator.tsx
├── services/               # API services
│   └── api.ts
├── context/                # React Context for state
│   └── AppContext.tsx
├── types/                  # TypeScript types
│   ├── index.ts
│   └── navigation.ts
├── utils/                  # Utility functions
│   └── dateUtils.ts
└── constants/             # Constants
    └── colors.ts
```

## Features

✅ Upcoming launches with live countdown timers
✅ Historical launches archive
✅ Detailed launch information
✅ Favorites functionality
✅ Search and filter capabilities
✅ Offline support with caching
✅ Pull-to-refresh
✅ Share functionality
✅ Modern, minimalist UI

## API

The app uses Launch Library 2:

- Development: `https://lldev.thespacedevs.com/2.3.0` (`EXPO_PUBLIC_LL2_ENV=dev`)
- Production: `https://ll.thespacedevs.com/2.3.0` (`EXPO_PUBLIC_LL2_ENV=prod`)

See [ENV_SETUP.md](./ENV_SETUP.md).

## Notes

- Launch responses are cached for 10 minutes and can be shown for up to 24 hours when the service is rate-limited or unreachable
- Favorites and reminders are stored on the device with AsyncStorage
- The interface is dark
- Store builds and the release checklist are in [APP_STORE_RELEASE.md](./APP_STORE_RELEASE.md)

