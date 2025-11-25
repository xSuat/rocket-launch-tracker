import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = 'user_location_cache';
const LOCATION_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedLocation {
  latitude: number;
  longitude: number;
  locationName: string;
  timestamp: number;
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    if (__DEV__) console.error('Error requesting location permissions:', error);
    return false;
  }
}

/**
 * Check if location permissions are granted
 */
export async function hasLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    if (__DEV__) console.error('Error checking location permissions:', error);
    return false;
  }
}

/**
 * Get cached location if available and not expired
 */
async function getCachedLocation(): Promise<CachedLocation | null> {
  try {
    const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const location: CachedLocation = JSON.parse(cached);
      const age = Date.now() - location.timestamp;
      if (age < LOCATION_CACHE_EXPIRY) {
        return location;
      }
    }
  } catch (error) {
    if (__DEV__) console.error('Error reading cached location:', error);
  }
  return null;
}

/**
 * Cache location data
 */
async function cacheLocation(location: CachedLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
  } catch (error) {
    if (__DEV__) console.error('Error caching location:', error);
  }
}

/**
 * Reverse geocode coordinates to get readable location name
 */
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      const parts: string[] = [];

      if (address.city) parts.push(address.city);
      if (address.region) parts.push(address.region);
      if (address.country) parts.push(address.country);

      if (parts.length > 0) {
        return parts.join(', ');
      }

      // Fallback to coordinates if no readable address
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  } catch (error) {
    if (__DEV__) console.error('Error reverse geocoding:', error);
  }

  // Fallback to coordinates
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/**
 * Get user's current location with caching
 * Returns null if permissions are not granted or location cannot be determined
 */
export async function getUserLocation(): Promise<{
  latitude: number;
  longitude: number;
  locationName: string;
} | null> {
  try {
    // Check cached location first
    const cached = await getCachedLocation();
    if (cached) {
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        locationName: cached.locationName,
      };
    }

    // Check permissions
    const hasPermission = await hasLocationPermissions();
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        return null;
      }
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // Reverse geocode to get readable location name
    const locationName = await reverseGeocode(latitude, longitude);

    // Cache the location
    const locationData: CachedLocation = {
      latitude,
      longitude,
      locationName,
      timestamp: Date.now(),
    };
    await cacheLocation(locationData);

    return {
      latitude,
      longitude,
      locationName,
    };
  } catch (error) {
    if (__DEV__) console.error('Error getting user location:', error);
    return null;
  }
}

/**
 * Get user's location name (cached or fresh)
 * Returns a friendly fallback if location cannot be determined
 */
export async function getUserLocationName(): Promise<string> {
  const location = await getUserLocation();
  return location?.locationName || 'Your Location';
}

/**
 * Location tracking subscription type
 */
export type LocationSubscription = {
  remove: () => void;
};

/**
 * Throttle reverse geocoding to avoid rate limits
 */
let lastGeocodeTime = 0;
let lastGeocodeLocation: { lat: number; lng: number } | null = null;
let lastGeocodeName: string | null = null;
const GEOCODE_THROTTLE_MS = 30 * 1000; // 30 seconds
const GEOCODE_DISTANCE_THRESHOLD = 100; // meters

/**
 * Check if geocoding should be performed based on throttle and distance
 */
function shouldGeocode(latitude: number, longitude: number): boolean {
  const now = Date.now();
  const timeSinceLastGeocode = now - lastGeocodeTime;
  
  // Always geocode if enough time has passed
  if (timeSinceLastGeocode >= GEOCODE_THROTTLE_MS) {
    return true;
  }
  
  // Geocode if location changed significantly
  if (lastGeocodeLocation) {
    const distance = calculateDistance(
      lastGeocodeLocation.lat,
      lastGeocodeLocation.lng,
      latitude,
      longitude
    );
    if (distance > GEOCODE_DISTANCE_THRESHOLD) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Start real-time location tracking
 * Updates location every second and calls callback with location updates
 */
export async function startLocationTracking(
  onLocationUpdate: (location: {
    latitude: number;
    longitude: number;
    locationName: string;
  }) => void
): Promise<LocationSubscription | null> {
  try {
    // Check permissions
    const hasPermission = await hasLocationPermissions();
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        if (__DEV__) console.warn('Location permissions not granted for tracking');
        return null;
      }
    }

    // Start watching position
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 1000, // Update every second
        distanceInterval: 1, // Update every meter (minimal)
      },
      async (location) => {
        const { latitude, longitude } = location.coords;
        
        // Update location name with throttling
        let locationName: string;
        if (shouldGeocode(latitude, longitude)) {
          locationName = await reverseGeocode(latitude, longitude);
          lastGeocodeTime = Date.now();
          lastGeocodeLocation = { lat: latitude, lng: longitude };
          lastGeocodeName = locationName;
        } else {
          // Use last known location name or coordinates
          locationName = lastGeocodeName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
        
        onLocationUpdate({
          latitude,
          longitude,
          locationName,
        });
      }
    );

    return subscription;
  } catch (error) {
    if (__DEV__) console.error('Error starting location tracking:', error);
    return null;
  }
}

/**
 * Stop location tracking
 */
export function stopLocationTracking(subscription: LocationSubscription | null): void {
  if (subscription) {
    try {
      subscription.remove();
    } catch (error) {
      if (__DEV__) console.error('Error stopping location tracking:', error);
    }
  }
}

