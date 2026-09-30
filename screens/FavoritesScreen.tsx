import React, { useCallback, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { color, space } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { Launch } from '../types';
import { launchAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { useNow } from '../hooks/useNow';
import { useToast } from '../components/ui/Toast';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { LaunchRow } from '../components/LaunchRow';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { isUpcomingStatus } from '../utils/launchStatus';
import { hapticFavorite } from '../utils/haptics';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { favorites, removeFavorite, addFavorite } = useApp();
  const { showToast } = useToast();
  const now = useNow(60000);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (favorites.length === 0) {
      setLaunches([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (refresh) setRefreshing(true);
    else if (launches.length === 0) setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        favorites.map((id) => launchAPI.getLaunchById(id, !refresh).catch(() => null))
      );
      setLaunches(results.filter((item): item is Launch => !!item));
    } catch (err: any) {
      setError(err.message || 'Could not load favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites, launches.length]);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [favorites.join('|')])
  );

  const upcoming = launches.filter((launch) => isUpcomingStatus(launch.status?.id));
  const past = launches.filter((launch) => !isUpcomingStatus(launch.status?.id));
  const sections = [
    upcoming.length ? { title: 'Upcoming', data: upcoming } : null,
    past.length ? { title: 'Past', data: past } : null,
  ].filter(Boolean) as { title: string; data: Launch[] }[];

  return (
    <View style={styles.screen}>
      <SectionList
        sections={loading && launches.length === 0 ? [] : sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={<ScreenHeader title="Favorites" />}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        renderItem={({ item }) => (
          <LaunchRow
            launch={item}
            now={now}
            favorite
            onPress={() => navigation.navigate('LaunchDetails', { launchId: item.id })}
            onToggleFavorite={async () => {
              hapticFavorite();
              await removeFavorite(item.id);
              setLaunches((current) => current.filter((launch) => launch.id !== item.id));
              showToast('Removed from favorites', async () => {
                await addFavorite(item.id);
                setLaunches((current) => current.some((launch) => launch.id === item.id) ? current : [item, ...current]);
              });
            }}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Skeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => load(true)} />
          ) : (
            <EmptyState
              icon="heart-outline"
              title="No favorites yet"
              message="On a launch, tap the heart."
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={color.text}
            colors={[color.text]}
            progressBackgroundColor={color.bg}
          />
        }
        contentContainerStyle={styles.content}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: space.s24 },
});
