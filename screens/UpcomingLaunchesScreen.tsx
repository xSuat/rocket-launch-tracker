import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Launch } from '../types';
import { TabScreenNavigationProp } from '../types/navigation';
import { useUpcomingLaunches } from '../hooks';
import { LaunchCard } from '../components/LaunchCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { StatCard, SpaceTerminologyModal, PageHeader } from '../components';
import { isUpcomingStatus } from '../utils/launchStatus';
import { Colors } from '../constants/colors';

type NavigationProp = TabScreenNavigationProp<'Upcoming'>;

export const UpcomingLaunchesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [showTerminologyModal, setShowTerminologyModal] = useState(false);
  
  const { data, loading, refreshing, error, refetch } = useUpcomingLaunches({ 
    limit: 50, 
    ordering: 'net' 
  });

  const isValidLaunch = useCallback((launch: Launch): boolean => {
    return !!(launch?.id && launch?.name && launch?.net);
  }, []);

  const filteredLaunches = useMemo(() => {
    return data.filter((launch) => {
      if (!isValidLaunch(launch)) return false;
      return isUpcomingStatus(launch.status?.id);
    });
  }, [data, isValidLaunch]);

  const handleLaunchPress = useCallback((launchId: string) => {
      navigation.navigate('LaunchDetails', { launchId });
  }, [navigation]);

  const getLaunchDate = useCallback((launch: Launch): Date | null => {
    return launch.net ? new Date(launch.net) : null;
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const thisMonth = filteredLaunches.filter(launch => {
      const launchDate = getLaunchDate(launch);
      if (!launchDate) return false;
      return launchDate.getFullYear() === currentYear && launchDate.getMonth() === currentMonth;
    }).length;
    
    const thisYear = filteredLaunches.filter(launch => {
      const launchDate = getLaunchDate(launch);
      if (!launchDate) return false;
      return launchDate.getFullYear() === currentYear;
    }).length;
    
    const hasGoStatus = filteredLaunches.some((launch) => launch.status?.id === 1);
    
    return {
      thisMonth,
      thisYear,
      status: hasGoStatus ? 'GO' : 'TBD',
    };
  }, [filteredLaunches, getLaunchDate]);

  const headerTitleHeight = 80;
  const statsHeight = 92;
  const topSectionHeight = Math.max(insets.top, 16) + headerTitleHeight + statsHeight;

  if (error && filteredLaunches.length === 0 && !loading) {
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
          title="Space Hub"
          subtitle="Upcoming Launches"
          rightButtons={[
            { icon: 'info', onPress: () => setShowTerminologyModal(true) },
            { icon: 'settings', onPress: () => navigation.navigate('Settings') }
          ]}
        />
        <View style={styles.statsContainer}>
          <StatCard value={loading ? '-' : stats.thisMonth} label="This Month" />
          <StatCard value={loading ? '-' : stats.thisYear} label="This Year" />
          <StatCard 
            value={loading ? '-' : stats.status} 
            label="Status" 
            color={stats.status === 'GO' ? Colors.successLight : Colors.warningLight}
          />
        </View>
      </View>

      {loading && filteredLaunches.length === 0 ? (
        <View style={[styles.loadingContainer, { paddingTop: topSectionHeight + 24 }]}>
          <LoadingState message="Loading upcoming launches..." />
        </View>
      ) : filteredLaunches.length === 0 ? (
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
            message="No upcoming launches available"
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredLaunches}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: topSectionHeight + 24 }]}
          renderItem={({ item }) => (
            <LaunchCard
              launch={item}
              onPress={() => handleLaunchPress(item.id)}
              showCountdown
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
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      )}

      <SpaceTerminologyModal
        visible={showTerminologyModal}
        onClose={() => setShowTerminologyModal(false)}
      />
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
