import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { color, space, type } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { Launch } from '../types';
import { usePastLaunches, useUpcomingLaunches } from '../hooks/useLaunches';
import { useNow } from '../hooks/useNow';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { SearchField } from '../components/ui/SearchField';
import { Chip } from '../components/ui/Chip';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LaunchRow } from '../components/LaunchRow';
import { NextLaunchHero } from '../components/NextLaunchHero';
import { ReminderModal } from '../components/ReminderModal';
import { Sheet } from '../components/ui/Sheet';
import { Button } from '../components/ui/Button';
import { formatDayHeading, formatMonthHeading, formatUpdated, localDayKey } from '../utils/dateUtils';
import { isFinishedStatus, isUpcomingStatus } from '../utils/launchStatus';
import { hapticFavorite, hapticSelection } from '../utils/haptics';

type Segment = 'upcoming' | 'past';

export const LaunchesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const now = useNow(60000);
  const { isFavorite, addFavorite, removeFavorite } = useApp();
  const { showToast } = useToast();
  const [segment, setSegment] = useState<Segment>('upcoming');
  const [query, setQuery] = useState('');
  const [goOnly, setGoOnly] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [providerOpen, setProviderOpen] = useState(false);
  const [reminderLaunch, setReminderLaunch] = useState<Launch | null>(null);

  const upcoming = useUpcomingLaunches({}, segment === 'upcoming');
  const past = usePastLaunches({}, segment === 'past');
  const source = segment === 'upcoming' ? upcoming : past;

  const base = useMemo(() => {
    return source.data.filter((launch) =>
      segment === 'upcoming' ? isUpcomingStatus(launch.status?.id) : isFinishedStatus(launch.status?.id) || !isUpcomingStatus(launch.status?.id)
    );
  }, [segment, source.data]);

  const providers = useMemo(() => {
    const names = new Set<string>();
    base.forEach((launch) => {
      const name = launch.launch_service_provider?.name;
      if (name) names.add(name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [base]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return base.filter((launch) => {
      if (goOnly && launch.status?.id !== 1) return false;
      if (provider && launch.launch_service_provider?.name !== provider) return false;
      if (!needle) return true;
      const hay = `${launch.name} ${launch.launch_service_provider?.name || ''} ${launch.rocket?.configuration?.name || ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [base, goOnly, provider, query]);

  const hero = segment === 'upcoming' ? base.find((launch) => isUpcomingStatus(launch.status?.id)) : undefined;

  const sections = useMemo(() => {
    const groups = new Map<string, Launch[]>();
    filtered.forEach((launch) => {
      const key = segment === 'upcoming'
        ? localDayKey(launch.net)
        : launch.net.slice(0, 7);
      const list = groups.get(key) || [];
      list.push(launch);
      groups.set(key, list);
    });
    return Array.from(groups.entries()).map(([key, data]) => ({
      key,
      title: segment === 'upcoming'
        ? formatDayHeading(key, { now })
        : formatMonthHeading(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1),
      data,
    }));
  }, [filtered, now, segment]);

  const searching = query.trim().length > 0 || goOnly || !!provider;

  const toggleFavorite = async (launch: Launch) => {
    hapticFavorite();
    if (isFavorite(launch.id)) {
      await removeFavorite(launch.id);
      showToast('Removed from favorites', () => addFavorite(launch.id));
    } else {
      await addFavorite(launch.id);
      showToast('Saved to favorites', () => removeFavorite(launch.id));
    }
  };

  const header = (
    <View>
      <ScreenHeader title="Launches" />
      <View style={styles.pad}>
        <SegmentedControl
          options={[
            { value: 'upcoming' as const, label: 'Upcoming' },
            { value: 'past' as const, label: 'Past' },
          ]}
          value={segment}
          onChange={(value) => {
            hapticSelection();
            setSegment(value);
          }}
        />
      </View>
      {hero ? (
        <View style={styles.hero}>
          <NextLaunchHero
            launch={hero}
            now={now}
            onPress={() => navigation.navigate('LaunchDetails', { launchId: hero.id })}
            onRemind={() => setReminderLaunch(hero)}
          />
        </View>
      ) : null}
      <View style={styles.pad}>
        <SearchField value={query} onChangeText={setQuery} />
        <View style={styles.chips}>
          <Chip label="Go only" selected={goOnly} onPress={() => setGoOnly((value) => !value)} />
          <Chip
            label={provider || 'Provider'}
            selected={!!provider}
            onPress={() => setProviderOpen(true)}
          />
        </View>
        {source.updatedAt ? <Text style={styles.updated}>{formatUpdated(source.updatedAt, { now })}</Text> : null}
      </View>
    </View>
  );

  const showSkeleton = source.loading && source.data.length === 0;
  const showError = !!source.error && source.data.length === 0 && !source.loading;

  return (
    <View style={styles.screen}>
      <SectionList
        style={styles.list}
        sections={showSkeleton || showError ? [] : sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        renderItem={({ item }) => (
          <LaunchRow
            launch={item}
            now={now}
            favorite={isFavorite(item.id)}
            onPress={() => navigation.navigate('LaunchDetails', { launchId: item.id })}
            onToggleFavorite={() => toggleFavorite(item)}
          />
        )}
        ListEmptyComponent={
          showSkeleton ? (
            <Skeleton />
          ) : showError ? (
            <ErrorState message={source.error || undefined} onRetry={source.refetch} />
          ) : searching ? (
            <EmptyState
              icon="search-outline"
              title="No launches match that search"
              message="Try another name, or clear the filters."
              actionLabel="Clear search"
              onAction={() => {
                setQuery('');
                setGoOnly(false);
                setProvider(null);
              }}
            />
          ) : (
            <EmptyState
              icon="rocket-outline"
              title={segment === 'upcoming' ? 'No upcoming launches' : 'No past launches'}
              message="Pull to refresh."
              actionLabel="Refresh"
              onAction={source.refetch}
            />
          )
        }
        ListFooterComponent={
          source.loadingMore ? (
            <ActivityIndicator color={color.text} style={styles.footer} />
          ) : source.loadMoreError ? (
            <View style={styles.footer}>
              <Button label="Try again" onPress={source.loadMore} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={source.refreshing}
            onRefresh={source.refetch}
            tintColor={color.text}
            colors={[color.text]}
            progressBackgroundColor={color.bg}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (source.hasMore) source.loadMore();
        }}
        contentContainerStyle={styles.content}
      />
      <Sheet visible={providerOpen} title="Provider" onClose={() => setProviderOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !provider }}
          onPress={() => {
            setProvider(null);
            setProviderOpen(false);
          }}
          style={styles.providerRow}
        >
          <Text style={styles.providerText}>All providers</Text>
        </Pressable>
        {providers.map((name) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityState={{ selected: provider === name }}
            onPress={() => {
              setProvider(name);
              setProviderOpen(false);
            }}
            style={styles.providerRow}
          >
            <Text style={styles.providerText}>{name}</Text>
          </Pressable>
        ))}
      </Sheet>
      {reminderLaunch ? (
        <ReminderModal
          visible
          launchId={reminderLaunch.id}
          launchName={reminderLaunch.name}
          launchDate={reminderLaunch.net}
          precision={reminderLaunch.net_precision}
          onClose={() => setReminderLaunch(null)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  list: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: space.s24,
  },
  pad: {
    paddingHorizontal: space.s20,
    gap: space.s12,
    marginBottom: space.s12,
  },
  hero: {
    marginBottom: space.s16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.s8,
  },
  updated: {
    ...type.footnote,
    color: color.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    padding: space.s20,
  },
  providerRow: {
    minHeight: 44,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
  },
  providerText: {
    ...type.body,
    color: color.text,
  },
});
