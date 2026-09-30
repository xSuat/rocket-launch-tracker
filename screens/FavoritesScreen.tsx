import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Launch } from '../types';
import { TabScreenNavigationProp } from '../types/navigation';
import { launchAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { LaunchCard } from '../components/LaunchCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PageHeader, StatCard } from '../components/ui';
import { isUpcomingStatus } from '../utils/launchStatus';
import { Colors } from '../constants/colors';

type NavigationProp = TabScreenNavigationProp<'Favorites'>;

export const FavoritesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { favorites, favoriteLaunches, setFavoriteLaunches } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavoriteLaunches = useCallback(async (showLoading = false) => {
    if (favorites.length === 0) {
      setFavoriteLaunches([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const launches = (
        await Promise.all(
          favorites.map(async (id) => {
            try {
              return await launchAPI.getLaunchById(id);
            } catch (loadError) {
              if (__DEV__) console.error(`Error loading launch ${id}:`, loadError);
              return null;
            }
          })
        )
      ).filter((launch): launch is Launch => launch !== null);
      setFavoriteLaunches(launches);
      if (launches.length === 0) {
        setError('Saved launches could not be loaded. Check your connection and try again.');
      }
    } catch (loadError) {
      if (__DEV__) console.error('Error loading favorites:', loadError);
      setError('Saved launches could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites, setFavoriteLaunches]);

  // Only load on mount, not on every focus
  useEffect(() => {
    loadFavoriteLaunches(true);
  }, [loadFavoriteLaunches]);

  // Refresh on focus only if favorites list changed
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have data already (silent refresh)
      if (favoriteLaunches.length > 0 || favorites.length === 0) {
        loadFavoriteLaunches(false);
      }
    }, [favorites.length, favoriteLaunches.length, loadFavoriteLaunches])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFavoriteLaunches();
  }, [loadFavoriteLaunches]);

  const handleLaunchPress = (launchId: string) => {
    navigation.navigate('LaunchDetails', { launchId });
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = favoriteLaunches.length;
    const upcoming = favoriteLaunches.filter((l) => isUpcomingStatus(l.status?.id)).length;
    const providers = new Set(
      favoriteLaunches
        .map(l => l.launch_service_provider?.name)
        .filter(Boolean)
    ).size;
    
    return {
      total,
      upcoming,
      providers,
    };
  }, [favoriteLaunches]);

  // Calculate heights
  const headerTitleHeight = 80; // Title + subtitle height
  const statsHeight = 92; // Stats container height
  const topSectionHeight = Math.max(insets.top, 16) + headerTitleHeight + statsHeight;

  return (
    <LinearGradient
      colors={Colors.backgroundGradient as any}
      style={styles.container}
    >
      {/* Fixed Blur Background for Top Section */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={20}
          tint="dark"
          style={[styles.blurBackground, { height: topSectionHeight }]}
        />
      ) : (
        <View style={[styles.blurBackground, { height: topSectionHeight, backgroundColor: 'rgba(0, 0, 0, 0.6)' }]} />
      )}

      {/* Fixed Top Section - Title + Stats */}
      <View style={[styles.topSectionWrapper, { paddingTop: Math.max(insets.top, 16), height: topSectionHeight }]}>
        <PageHeader
          title="Favorites"
          subtitle="Your saved launches"
        />
        <View style={styles.statsContainer}>
          <StatCard value={loading ? '-' : stats.total} label="Total" />
          <StatCard value={loading ? '-' : stats.upcoming} label="Upcoming" />
          <StatCard value={loading ? '-' : stats.providers} label="Providers" />
        </View>
      </View>

      {loading ? (
        <View style={[styles.loadingContainer, { paddingTop: topSectionHeight + 24 }]}>
          <LoadingState message="Loading favorites..." />
        </View>
      ) : error && favoriteLaunches.length === 0 ? (
        <ErrorState message={error} onRetry={() => loadFavoriteLaunches(true)} />
      ) : favoriteLaunches.length === 0 ? (
        <ScrollView 
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: topSectionHeight + 24 }]}
          contentInsetAdjustmentBehavior="automatic"
        >
          <EmptyState
            title="No favorites yet"
            message="Tap the heart icon on any launch to add it to your favorites"
          />
        </ScrollView>
      ) : (
        <FlatList
          data={favoriteLaunches}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: topSectionHeight + 24 }]}
          renderItem={({ item }) => (
            <LaunchCard
              launch={item}
              onPress={() => handleLaunchPress(item.id)}
              showCountdown={isUpcomingStatus(item.status?.id)}
            />
          )}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.background}
              progressViewOffset={topSectionHeight}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topSectionWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  list: {
    flex: 1,
    zIndex: 1,
  },
  listContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  loadingContainer: {
    flex: 1,
  },
});

