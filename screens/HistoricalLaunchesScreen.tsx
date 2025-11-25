import React, { useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Launch } from '../types';
import { TabScreenNavigationProp } from '../types/navigation';
import { usePastLaunches } from '../hooks';
import { LaunchCard } from '../components/LaunchCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PageHeader, StatCard } from '../components/ui';
import { Colors } from '../constants/colors';

type NavigationProp = TabScreenNavigationProp<'History'>;

export const HistoricalLaunchesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  
  const { data: launches, loading, refreshing, error, refetch } = usePastLaunches({
    limit: 50,
    ordering: '-net',
  });

  const handleLaunchPress = useCallback((launchId: string) => {
    navigation.navigate('LaunchDetails', { launchId });
  }, [navigation]);

  const getLaunchDate = useCallback((launch: Launch): Date | null => {
    return launch.net ? new Date(launch.net) : null;
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    const lastMonthCount = launches.filter(launch => {
      const launchDate = getLaunchDate(launch);
      return launchDate && launchDate >= lastMonthStart && launchDate <= lastMonthEnd;
    }).length;
    
    const thisYear = launches.filter(launch => {
      const launchDate = getLaunchDate(launch);
      return launchDate && launchDate >= startOfYear;
    }).length;
    
    return {
      lastMonth: lastMonthCount,
      thisYear,
      total: launches.length,
    };
  }, [launches, getLaunchDate]);

  const headerTitleHeight = 80;
  const statsHeight = 92;
  const topSectionHeight = Math.max(insets.top, 16) + headerTitleHeight + statsHeight;

  if (error && launches.length === 0 && !loading) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <LinearGradient
      colors={Colors.backgroundGradient as any}
      style={styles.container}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={20}
          tint="dark"
          style={[styles.blurBackground, { height: topSectionHeight }]}
        />
      ) : (
        <View style={[styles.blurBackground, { height: topSectionHeight, backgroundColor: 'rgba(0, 0, 0, 0.6)' }]} />
      )}

      <View style={[styles.topSectionWrapper, { paddingTop: Math.max(insets.top, 16), height: topSectionHeight }]}>
        <PageHeader
          title="Past Launches"
          subtitle="Historical launches"
        />
        <View style={styles.statsContainer}>
          <StatCard value={loading ? '-' : stats.lastMonth} label="Last Month" />
          <StatCard value={loading ? '-' : stats.thisYear} label="This Year" />
          <StatCard value={loading ? '-' : stats.total} label="Total" />
        </View>
      </View>
      {loading && launches.length === 0 ? (
        <View style={[styles.loadingContainer, { paddingTop: topSectionHeight + 24 }]}>
          <LoadingState message="Loading historical launches..." />
        </View>
      ) : launches.length === 0 ? (
        <ScrollView 
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: topSectionHeight + 24 }]}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={refetch} 
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.background}
              progressViewOffset={topSectionHeight}
            />
          }
        >
          <EmptyState
            title="No launches found"
            message="No historical launches available"
          />
        </ScrollView>
      ) : (
        <FlatList
          data={launches}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: topSectionHeight + 24 }]}
          renderItem={({ item }) => (
            <LaunchCard
              launch={item}
              onPress={() => handleLaunchPress(item.id)}
              showCountdown={false}
            />
          )}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={refetch} 
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.background}
              progressViewOffset={topSectionHeight}
            />
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
  },
});