# Environment Variables Setup

This document explains how to configure environment variables for the Rocket Launch Tracker app, specifically for NASA API integration.

## NASA API Key Setup

The app uses NASA's Near Earth Object Web Service (NeoWs) API to fetch asteroid close approach data. While the API works with a demo key (`DEMO_KEY`), using your own API key provides:

- **Higher rate limits**: 1,000 requests per hour (vs 30 requests per hour for DEMO_KEY)
- **Better reliability**: Reduced chance of hitting rate limits
- **Production-ready**: Suitable for production deployments

### Getting Your NASA API Key

1. **Visit NASA API Portal**
   - Go to [https://api.nasa.gov/](https://api.nasa.gov/)
   - Click on "Generate API Key" or visit [https://api.nasa.gov/#signUp](https://api.nasa.gov/#signUp)

2. **Fill out the form**
   - Enter your first name
   - Enter your last name
   - Enter your email address
   - Click "Sign Up"

3. **Receive your API key**
   - Check your email inbox
   - You'll receive an email with your API key
   - The key will look like: `YOUR_API_KEY_HERE`

### Setting Up Environment Variables

#### Option 1: Using Expo Constants (Recommended for Expo)

1. **Install expo-constants** (if not already installed):
   ```bash
   npm install expo-constants
   ```

2. **Create a `.env` file** in the root directory:
   ```env
   EXPO_PUBLIC_NASA_API_KEY=your_nasa_api_key_here
   ```
   
   **Note**: You can also use `NASA_API_KEY` (without EXPO_PUBLIC_ prefix), but `EXPO_PUBLIC_NASA_API_KEY` is recommended for Expo projects.

3. **Update `app.json`** to include extra config:
   ```json
   {
     "expo": {
       "extra": {
         "nasaApiKey": process.env.EXPO_PUBLIC_NASA_API_KEY || "DEMO_KEY"
       }
     }
   }
   ```

4. **Update `services/events.ts`** to use the environment variable:
   ```typescript
   import Constants from 'expo-constants';
   
   const NASA_API_KEY = Constants.expoConfig?.extra?.nasaApiKey || 'DEMO_KEY';
   
   // Then use it in the API call:
   api_key: NASA_API_KEY,
   ```

#### Option 2: Using React Native Config (Alternative)

1. **Install react-native-config**:
   ```bash
   npm install react-native-config
   ```

2. **Create a `.env` file**:
   ```env
   NASA_API_KEY=your_nasa_api_key_here
   ```

3. **Update code** to use:
   ```typescript
   import Config from 'react-native-config';
   const NASA_API_KEY = Config.NASA_API_KEY || 'DEMO_KEY';
   ```

### Current Implementation

The app is already configured to support NASA API keys! It uses a helper function `getNASAApiKey()` that:

1. **First tries** `Constants.expoConfig?.extra?.nasaApiKey` (from app.json)
2. **Then tries** `process.env.EXPO_PUBLIC_NASA_API_KEY` (from .env file)
3. **Falls back** to `DEMO_KEY` if neither is set

To use your own API key, you have two options:

**Option A: Using app.json (Recommended for production builds)**
1. Update `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "nasaApiKey": "your_api_key_here"
       }
     }
   }
   ```

**Option B: Using .env file (Recommended for development)**
1. Create `.env` file:
   ```env
   EXPO_PUBLIC_NASA_API_KEY=your_api_key_here
   ```
2. Restart Expo: `npm start --clear`

### Environment File Template

Create a `.env.example` file (commit this to git):

```env
# NASA API Configuration
# Get your free API key from: https://api.nasa.gov/#signUp
NASA_API_KEY=DEMO_KEY

# Or for Expo:
EXPO_PUBLIC_NASA_API_KEY=DEMO_KEY
```

Create a `.env` file (do NOT commit this to git):

```env
NASA_API_KEY=your_actual_api_key_here
```

### Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` files** to version control
2. Add `.env` to `.gitignore`:
   ```
   .env
   .env.local
   .env.*.local
   ```

3. **Use different keys for development and production**
4. **Rotate keys periodically** if compromised

### Rate Limits

- **DEMO_KEY**: 30 requests per hour
- **Personal API Key**: 1,000 requests per hour

The app handles rate limiting gracefully by:
- Using cached data when rate limited
- Retrying with exponential backoff
- Showing user-friendly error messages

### Testing Your API Key

You can test your API key using curl:

```bash
curl "https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-01-01&end_date=2024-01-07&api_key=YOUR_API_KEY"
```

If successful, you'll receive JSON data with asteroid information.

### Troubleshooting

**Issue**: Rate limit errors
- **Solution**: Use your own API key instead of DEMO_KEY

**Issue**: API key not working
- **Solution**: Verify the key is correct and hasn't expired
- Check email for the correct key format

**Issue**: Environment variable not loading
- **Solution**: 
  - Restart the Expo development server
  - Clear cache: `expo start --clear`
  - Verify `.env` file is in the root directory

### Additional Resources

- [NASA API Documentation](https://api.nasa.gov/)
- [NeoWs API Documentation](https://api.nasa.gov/#NeoWS)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

