# Rocket Launch Tracker

A mobile app for tracking rocket launches and sky events. Built with React Native, Expo, and TypeScript. The interface is dark.

Publishing to the App Store: [APP_STORE_RELEASE.md](./APP_STORE_RELEASE.md).

## Features

- **Upcoming and past launches** - Browse rocket launches with countdown timers on upcoming flights
- **Favorites** - Save launches on this device
- **Reminders** - Local notifications for a launch you choose (not remote push)
- **Space events calendar** - Launches, asteroid close approaches, meteor showers, moon phases, and NASA's Astronomy Picture of the Day
- **Calendar** - Add a launch or sky event to the device calendar when you tap Add to Calendar
- **Offline cache** - Previously loaded lists are kept on device and reused when the launch service is busy or unreachable

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your iOS/Android device (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xSuat/rocket-launch-tracker.git
   cd rocket-launch-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (Optional but recommended)
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_NASA_API_KEY=your_nasa_api_key_here
   EXPO_PUBLIC_LL2_ENV=dev
   ```
   
   See [Environment Variables](#environment-variables) section for details.

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go (iOS/Android)
   - Or press `i` for iOS simulator / `a` for Android emulator

## Environment Variables

### NASA API Key (Optional)

The app uses NASA's APIs for asteroid data and Astronomy Picture of the Day. While it works with a demo key, using your own API key provides:

- **Higher rate limits**: 1,000 requests/hour (vs 30 requests/hour for DEMO_KEY)
- **Better reliability**: Reduced chance of hitting rate limits
- **Production-ready**: Suitable for production deployments

**Getting your NASA API Key:**
1. Visit [NASA API Portal](https://api.nasa.gov/#signUp)
2. Fill out the form to get your free API key
3. Add it to your `.env` file:
   ```env
   EXPO_PUBLIC_NASA_API_KEY=your_api_key_here
   ```

### Launch Library 2 Environment

- `EXPO_PUBLIC_LL2_ENV=dev` - Development API (`lldev.thespacedevs.com`). Use this for local work so you do not spend the production quota.
- `EXPO_PUBLIC_LL2_ENV=prod` - Production API (`ll.thespacedevs.com`). The free tier is about 15 requests per hour per IP. Store and preview builds set this in `eas.json`.

If the variable is unset, debug builds use `dev` and release builds use `prod`. Empty or placeholder NASA keys are ignored and the app falls back to `DEMO_KEY`.

**Note**: The app works without any API keys. NASA's demo key and the Launch Library free tier are both rate-limited.

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed setup instructions.

## APIs Used

- **Launch Library 2** (The Space Devs) - Rocket launch data ([ll.thespacedevs.com](https://ll.thespacedevs.com))
- **NASA NeoWs** - Near Earth Object data ([api.nasa.gov](https://api.nasa.gov))
- **NASA APOD** - Astronomy Picture of the Day ([api.nasa.gov](https://api.nasa.gov))

## Project Structure

```
rocket-launch-tracker/
|-- App.tsx                 # Main app entry point
|-- app.json                # Expo configuration
|-- package.json            # Dependencies
|-- tsconfig.json           # TypeScript configuration
|-- components/             # Reusable UI components
|   |-- LaunchCard.tsx
|   |-- CountdownTimer.tsx
|   |-- MissionTimeline.tsx
|   |-- ...
|-- screens/                # Screen components
|   |-- UpcomingLaunchesScreen.tsx
|   |-- HistoricalLaunchesScreen.tsx
|   |-- SpaceEventsCalendarScreen.tsx
|   |-- ...
|-- services/               # API services
|   |-- api.ts              # Launch Library 2 API
|   |-- events.ts           # Space events aggregation
|   |-- config.ts           # API configuration
|-- navigation/             # Navigation setup
|-- context/                # React Context for state
|-- hooks/                  # Custom React hooks
|-- utils/                  # Utility functions
|-- types/                  # TypeScript type definitions
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## Features in Detail

### Launch Tracking
- Countdown timers for upcoming launches
- Launch details (rocket, mission, pad)
- Past launches
- Favorites stored on device

### Space Events Calendar
- Rocket launches
- Asteroid close approaches (with hazard indicators)
- Meteor shower information
- Moon phase events
- NASA Astronomy Picture of the Day

### Rocket Information
- Comprehensive rocket specifications
- Launch history and success rates
- Associated launches
- Rocket images and details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Launch Library 2](https://ll.thespacedevs.com) by The Space Devs - Launch data API
- [NASA APIs](https://api.nasa.gov) - Asteroid data and Astronomy Picture of the Day

This project is not affiliated with NASA or any launch provider.

## Support

For issues, questions, or contributions, please open an issue on GitHub. The public support page is [docs/support.html](./docs/support.html), and the privacy policy is [docs/privacy-policy.html](./docs/privacy-policy.html).

---

Made with love for space enthusiasts
