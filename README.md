# Rocket Launch Tracker

A modern, minimalist mobile app for tracking rocket launches, space events, and astronomical phenomena globally. Built with React Native, Expo, and TypeScript.

## Features

- **Upcoming Launches** - Browse upcoming rocket launches with live countdown timers
- **Space Events Calendar** - View launches, asteroid close approaches, ISS passes, meteor showers, moon phases, and NASA's Astronomy Picture of the Day
- **Search & Filter** - Search launches and filter by rocket, agency, location, orbit, and more
- **Favorites** - Save your favorite launches for quick access
- **Offline Support** - Cached data works offline with automatic refresh
- **ISS Tracking** - Get ISS pass predictions for your location
- **Modern UI** - Beautiful, minimalist interface with dark mode support
- **Detailed Information** - Comprehensive launch details, rocket specifications, mission timelines, and more

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

- `EXPO_PUBLIC_LL2_ENV=dev` - Uses development API (no key required, lower rate limits)
- `EXPO_PUBLIC_LL2_ENV=prod` - Uses production API (may require API key for higher limits)

**Note**: The app works without any API keys using demo keys, but rate limits are lower.

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed setup instructions.

## APIs Used

- **Launch Library 2** - Rocket launch data ([ll.thespacedevs.com](https://ll.thespacedevs.com))
- **NASA NeoWs** - Near Earth Object data ([api.nasa.gov](https://api.nasa.gov))
- **NASA APOD** - Astronomy Picture of the Day ([api.nasa.gov](https://api.nasa.gov))
- **ISS API** - International Space Station pass predictions ([open-notify.org](https://open-notify.org))
- **SpaceX API** - Additional SpaceX rocket data ([api.spacexdata.com](https://api.spacexdata.com))

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
- Real-time countdown timers
- Detailed launch information (rocket, mission, location, timeline)
- Historical launch archive
- Search and advanced filtering
- Share functionality

### Space Events Calendar
- Rocket launches
- Asteroid close approaches (with hazard indicators)
- ISS pass predictions (location-based)
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

- [Launch Library 2](https://ll.thespacedevs.com) - Launch data API
- [NASA APIs](https://api.nasa.gov) - Space data and imagery
- [Open Notify](https://open-notify.org) - ISS tracking API
- [SpaceX API](https://api.spacexdata.com) - SpaceX rocket data

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Made with love for space enthusiasts
