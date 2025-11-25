import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRockets } from '../hooks';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PageHeader, StatCard, GlassCard, StatusBadge } from '../components';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Rocket {
  id: number;
  name: string;
  family: string;
  full_name: string;
  variant?: string;
  description?: string;
  image_url?: string;
  active?: boolean;
  country_code?: string;
  manufacturer?: string;
  first_flight?: string;
  last_flight?: string;
}

type SortBy = 'name' | 'family' | 'first_flight' | 'provider';

const sortRockets = (rockets: any[], sortBy: SortBy): any[] => {
  return [...rockets].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'family') {
      return (a.family || '').localeCompare(b.family || '');
    }
    if (sortBy === 'first_flight') {
      const aDate = a.first_flight ? new Date(a.first_flight).getTime() : 0;
      const bDate = b.first_flight ? new Date(b.first_flight).getTime() : 0;
      return bDate - aDate;
    }
    if (sortBy === 'provider') {
      return (a.manufacturer || '').localeCompare(b.manufacturer || '');
    }
    return 0;
  });
};

export const RocketsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [sortBy, setSortBy] = useState<'name' | 'family' | 'first_flight' | 'provider'>('name');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'testing' | 'retired'>('all');

  const apiFilters = useMemo(() => {
      if (statusFilter === 'active') return { active: true };
      if (statusFilter === 'retired') return { active: false };
      return {};
  }, [statusFilter]);

  const { rockets, loading, refreshing, error, refetch, loadMore, hasMore } = useRockets(apiFilters);

  const filteredRockets = useMemo(() => {
    const filtered = rockets.filter(rocket => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return rocket.active === true;
      if (statusFilter === 'retired') return rocket.active === false;
      if (statusFilter === 'testing') {
        // Assuming testing rockets might be active=null or specific flag not in basic interface
        return rocket.active === undefined || rocket.active === null;
      }
      return true;
    });
    return sortRockets(filtered, sortBy);
  }, [rockets, statusFilter, sortBy]);

  const handleRocketPress = useCallback((rocketId: number) => {
    (navigation as any).navigate('RocketDetails', { rocketId });
  }, [navigation]);

  const stats = useMemo(() => {
    const active = rockets.filter(r => r.active === true).length;
    const retired = rockets.filter(r => r.active === false).length;
    const providers = new Set(
      rockets
        .map(r => r.manufacturer)
        .filter(Boolean)
    ).size;
    
    return {
      active,
      retired,
      providers,
    };
  }, [rockets]);

  const headerTitleHeight = 80;
  const statsHeight = 92;
  const statusFilterHeight = 48;
  const topSectionHeight = Math.max(insets.top, 16) + headerTitleHeight + statsHeight + statusFilterHeight;

  if (loading && rockets.length === 0) {
    return <LoadingState message="Loading rockets..." />;
  }

  if (error && rockets.length === 0) {
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
          title="Rockets"
          subtitle="Explore all rockets"
        />
        <View style={styles.statsContainer}>
          <StatCard value={stats.active} label="Active" />
          <StatCard value={stats.retired} label="Retired" />
          <StatCard value={stats.providers} label="Providers" />
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statusFiltersContainer}
          contentContainerStyle={styles.statusFiltersContent}
        >
          {(['all', 'active', 'testing', 'retired'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.statusFilterButton,
                statusFilter === filter && styles.statusFilterButtonActive,
              ]}
              onPress={() => setStatusFilter(filter)}
            >
              {statusFilter === filter ? (
                <LinearGradient
                  colors={[Colors.primary, Colors.pink]}
                  style={styles.statusFilterButtonGradient}
                >
                  <Text style={styles.statusFilterButtonTextActive}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.statusFilterButtonText}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredRockets.length === 0 ? (
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
            title="No rockets found"
            message={statusFilter !== 'all' ? "Try adjusting your filters" : "No rockets available"}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredRockets}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: topSectionHeight + 24 }]}
          renderItem={({ item }) => (
            <GlassCard 
              style={styles.rocketCard}
              onPress={() => handleRocketPress(item.id)}
            >
              <View style={styles.rocketCardContent}>
                <View style={styles.iconContainer}>
                  {item.image_url ? (
                    <Image 
                      source={{ uri: item.image_url }} 
                      style={styles.rocketIcon}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={[Colors.primary, Colors.pink]}
                      style={styles.rocketIconPlaceholder}
                    >
                      <MaterialIcons name="rocket-launch" size={32} color={Colors.text} />
                    </LinearGradient>
                  )}
                </View>
                <View style={styles.rocketInfo}>
                  <Text style={styles.rocketName} numberOfLines={1}>
                    {item.full_name || item.name}
                  </Text>
                  <Text style={styles.rocketProvider}>{item.manufacturer || 'Unknown'}</Text>
                  <View style={styles.rocketMeta}>
                    {item.active !== undefined && (
                      <StatusBadge 
                        status={item.active ? 'Active' : 'Retired'} 
                        size="small"
                      />
                    )}
                    {item.first_flight && (
                    <Text style={styles.flightCount}>
                        First flight: {new Date(item.first_flight).getFullYear()}
                    </Text>
                    )}
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textTertiary} />
              </View>
            </GlassCard>
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
             hasMore ? (
              <View style={styles.footerLoader}>
                <Text style={styles.footerLoaderText}>Loading more rockets...</Text>
              </View>
            ) : null
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
  statusFiltersContainer: {
    marginBottom: 0,
  },
  statusFiltersContent: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 16,
  },
  statusFilterButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusFilterButtonActive: {},
  statusFilterButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusFilterButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusFilterButtonTextActive: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    zIndex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  rocketCard: {
    marginHorizontal: 24,
    marginVertical: 12,
    padding: 0,
  },
  rocketCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  iconContainer: {
    flexShrink: 0,
  },
  rocketIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.cardSolid,
  },
  rocketIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rocketInfo: {
    flex: 1,
    minWidth: 0,
  },
  rocketName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  rocketProvider: {
    color: Colors.textTertiary,
    fontSize: 14,
    marginBottom: 8,
  },
  rocketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flightCount: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  footerLoaderText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});

