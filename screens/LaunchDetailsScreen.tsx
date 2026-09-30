import React, { useLayoutEffect, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { getCalendars } from 'expo-localization';
import { color, space, type } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { useLaunch } from '../hooks/useLaunch';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { CountdownTimer } from '../components/CountdownTimer';
import { ReminderModal } from '../components/ReminderModal';
import { DataSourceLabel } from '../components/DataSourceLabel';
import {
  formatDateTime,
  formatRelative,
  formatUpdated,
  isHourConfirmed,
  precisionKind,
} from '../utils/dateUtils';
import { isUpcomingStatus, statusLabel } from '../utils/launchStatus';
import { firstWatchUrl, heroImageUrl, imageCredit, shareText } from '../utils/launchMedia';
import { hapticFavorite } from '../utils/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LaunchDetails'>;
type Route = RouteProp<RootStackParamList, 'LaunchDetails'>;

export const LaunchDetailsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { launchId } = useRoute<Route>().params;
  const { launch, loading, refreshing, error, refetch } = useLaunch(launchId);
  const { isFavorite, addFavorite, removeFavorite } = useApp();
  const { showToast } = useToast();
  const [reminderOpen, setReminderOpen] = useState(false);

  const favorite = launch ? isFavorite(launch.id) : false;

  const share = async () => {
    if (!launch) return;
    const when = formatDateTime(launch.net, launch.net_precision);
    await Share.share({ message: shareText(launch, when) });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <IconButton
            name={favorite ? 'heart' : 'heart-outline'}
            accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
            selected={favorite}
            onPress={async () => {
              if (!launch) return;
              hapticFavorite();
              if (favorite) {
                await removeFavorite(launch.id);
                showToast('Removed from favorites', () => addFavorite(launch.id));
              } else {
                await addFavorite(launch.id);
                showToast('Saved to favorites', () => removeFavorite(launch.id));
              }
            }}
          />
          <IconButton name="share-outline" accessibilityLabel="Share launch" onPress={share} />
        </View>
      ),
    });
  }, [navigation, favorite, launch, addFavorite, removeFavorite, showToast]);

  if (loading && !launch) {
    return (
      <View style={styles.screen}>
        <Skeleton rows={4} />
      </View>
    );
  }

  if (error && !launch) {
    return (
      <View style={styles.screen}>
        <ErrorState message={error} onRetry={refetch} />
      </View>
    );
  }

  if (!launch) return null;

  const image = heroImageUrl(launch);
  const credit = imageCredit(launch);
  const provider = launch.launch_service_provider?.name || 'Unknown provider';
  const vehicle = launch.rocket?.configuration?.name;
  const when = formatDateTime(launch.net, launch.net_precision);
  const kind = precisionKind(launch.net_precision);
  const relative = kind === 'time' ? formatRelative(launch.net) : kind === 'day' ? 'Time TBD' : '';
  const upcoming = isUpcomingStatus(launch.status?.id);
  const passed = new Date(launch.net).getTime() <= Date.now();
  const watch = firstWatchUrl(launch);
  const links = [...(launch.vid_urls || []), ...(launch.info_urls || [])].filter((item) => item?.url);
  const timeline = (launch.timeline || []).filter((item) => item?.type?.description || item?.relative_time);

  const addToCalendar = async () => {
    if (Platform.OS === 'web') return;
    const start = new Date(launch.net);
    const allDay = kind !== 'time';
    try {
      await Calendar.createEventInCalendarAsync({
        title: launch.name,
        startDate: start,
        endDate: new Date(start.getTime() + 60 * 60 * 1000),
        allDay,
        location: launch.pad?.name,
        notes: [provider, when].filter(Boolean).join('\n'),
        timeZone: getCalendars()[0]?.timeZone || undefined,
      });
    } catch {
      showToast('Could not open the calendar');
    }
  };

  const openMaps = () => {
    const lat = launch.pad?.latitude;
    const lng = launch.pad?.longitude;
    if (!lat || !lng) return;
    const url = `http://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(launch.pad?.name || launch.name)}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refetch}
          tintColor={color.text}
          colors={[color.text]}
          progressBackgroundColor={color.bg}
        />
      }
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.hero}
          accessible={!!credit}
          accessibilityLabel={credit || undefined}
        />
      ) : (
        <View style={styles.hero} accessible={false}>
          <Ionicons name="rocket-outline" size={32} color={color.textTertiary} />
        </View>
      )}
      <View style={styles.summary}>
        <StatusBadge statusId={launch.status?.id} status={launch.status?.name} size="medium" />
        <Text style={styles.name}>{launch.name}</Text>
        <Text style={styles.meta}>{vehicle ? `${provider} · ${vehicle}` : provider}</Text>
        <Text style={styles.when}>{when}</Text>
        {relative ? <Text style={styles.relative}>{relative}</Text> : null}
        {launch.pad?.name ? <Text style={styles.pad}>{launch.pad.name}</Text> : null}
        {upcoming && kind === 'time' ? <CountdownTimer date={launch.net} /> : null}
        <DataSourceLabel source={launch.source} />
      </View>
      <View style={styles.actions}>
        {upcoming ? (
          <Button
            label={passed ? 'Window passed' : 'Remind me'}
            onPress={() => setReminderOpen(true)}
            disabled={passed}
            style={styles.action}
          />
        ) : null}
        {Platform.OS !== 'web' ? (
          <Button label="Add to calendar" variant="secondary" onPress={addToCalendar} style={styles.action} />
        ) : null}
        {watch ? (
          <Button
            label={launch.webcast_live ? 'Watch live' : 'Watch'}
            variant="secondary"
            onPress={() => Linking.openURL(watch.url)}
            style={styles.action}
          />
        ) : null}
      </View>

      {links.length > 0 ? (
        <View>
          <SectionHeader title="Watch" />
          {links.map((link) => (
            <Pressable
              key={link.url}
              accessibilityRole="link"
              accessibilityLabel={link.title || link.url}
              onPress={() => Linking.openURL(link.url)}
              style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            >
              <Ionicons name={link === watch ? 'play-outline' : 'open-outline'} size={18} color={color.text} />
              <View style={styles.linkText}>
                <Text style={styles.linkTitle}>{link.title || link.publisher || 'Link'}</Text>
                {link.publisher ? <Text style={styles.linkMeta}>{link.publisher}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={color.textTertiary} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <SectionHeader title="Status" />
      <View style={styles.block}>
        <Text style={styles.body}>{launch.status?.description || statusLabel(launch.status?.id, launch.status?.name)}</Text>
        {typeof launch.probability === 'number' ? (
          <Fact label="Probability" value={`${launch.probability}%`} />
        ) : null}
        {launch.weather_concerns ? <Fact label="Weather" value={launch.weather_concerns} /> : null}
        {launch.failreason ? <Fact label="Failure" value={launch.failreason} /> : null}
        {launch.last_updated ? <Text style={styles.relative}>{formatUpdated(launch.last_updated)}</Text> : null}
        {!isHourConfirmed(launch.net_precision) ? (
          <Text style={styles.relative}>The launch time isn't confirmed yet.</Text>
        ) : null}
      </View>

      {timeline.length > 0 ? (
        <View>
          <SectionHeader title="Timeline" />
          {timeline.map((item, index) => (
            <View key={`${item.relative_time}-${index}`} style={styles.linkRow}>
              <Text style={styles.timeCol}>{item.relative_time || '—'}</Text>
              <Text style={styles.body}>{item.type?.description || item.type?.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SectionHeader title="Mission" />
      <View style={styles.block}>
        {launch.mission?.description ? <Text style={styles.body}>{launch.mission.description}</Text> : null}
        {launch.mission?.orbit?.name ? <Fact label="Orbit" value={launch.mission.orbit.name} /> : null}
        {launch.pad?.location?.name ? <Fact label="Location" value={launch.pad.location.name} /> : null}
        {launch.window_start ? <Fact label="Window opens" value={formatDateTime(launch.window_start, launch.net_precision)} /> : null}
        {launch.window_end ? <Fact label="Window closes" value={formatDateTime(launch.window_end, launch.net_precision)} /> : null}
        {launch.pad?.latitude && launch.pad?.longitude ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open in Maps"
            onPress={openMaps}
            style={styles.maps}
          >
            <Ionicons name="map-outline" size={18} color={color.text} />
            <Text style={styles.linkTitle}>Open in Maps</Text>
          </Pressable>
        ) : null}
      </View>

      <ReminderModal
        visible={reminderOpen}
        launchId={launch.id}
        launchName={launch.name}
        launchDate={launch.net}
        precision={launch.net_precision}
        onClose={() => setReminderOpen(false)}
      />
    </ScrollView>
  );
};

const Fact = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fact}>
    <Text style={styles.factLabel}>{label}</Text>
    <Text style={styles.factValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: space.s32,
  },
  headerActions: {
    flexDirection: 'row',
  },
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: color.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    paddingHorizontal: space.s20,
    paddingTop: space.s16,
    gap: space.s8,
  },
  name: {
    ...type.title,
    color: color.text,
  },
  meta: {
    ...type.subhead,
    color: color.textSecondary,
  },
  when: {
    ...type.subhead,
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  relative: {
    ...type.footnote,
    color: color.textTertiary,
  },
  pad: {
    ...type.subhead,
    color: color.textSecondary,
  },
  actions: {
    paddingHorizontal: space.s20,
    paddingTop: space.s16,
    gap: space.s8,
  },
  action: {
    alignSelf: 'stretch',
  },
  block: {
    paddingHorizontal: space.s20,
    gap: space.s12,
  },
  body: {
    ...type.body,
    color: color.text,
    flex: 1,
  },
  fact: {
    gap: 2,
  },
  factLabel: {
    ...type.caption,
    color: color.textTertiary,
    textTransform: 'uppercase',
  },
  factValue: {
    ...type.body,
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  linkRow: {
    minHeight: 64,
    paddingHorizontal: space.s20,
    paddingVertical: space.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
  },
  pressed: {
    backgroundColor: color.bgMuted,
  },
  linkText: {
    flex: 1,
  },
  linkTitle: {
    ...type.headline,
    color: color.text,
  },
  linkMeta: {
    ...type.footnote,
    color: color.textTertiary,
  },
  timeCol: {
    ...type.subhead,
    color: color.textSecondary,
    fontVariant: ['tabular-nums'],
    minWidth: 72,
  },
  maps: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s8,
  },
});
