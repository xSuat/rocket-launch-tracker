import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { getCalendars } from 'expo-localization';
import { color, space, type } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { useEvents } from '../hooks/useEvents';
import { SpaceEvent } from '../services/events';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { IconButton } from '../components/ui/IconButton';
import { Sheet } from '../components/ui/Sheet';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime, formatMonthHeading, localDayKey } from '../utils/dateUtils';
import { useToast } from '../components/ui/Toast';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const TYPES = [
  { id: 'launch', label: 'Launch', icon: 'rocket-outline' },
  { id: 'asteroid', label: 'Asteroid', icon: 'planet-outline' },
  { id: 'meteor', label: 'Meteor', icon: 'sparkles-outline' },
  { id: 'moon', label: 'Moon', icon: 'moon-outline' },
  { id: 'apod', label: 'Picture of the day', icon: 'image-outline' },
] as const;

type EventType = (typeof TYPES)[number]['id'];

const ICONS: Record<EventType, keyof typeof Ionicons.glyphMap> = {
  launch: 'rocket-outline',
  asteroid: 'planet-outline',
  meteor: 'sparkles-outline',
  moon: 'moon-outline',
  apod: 'image-outline',
};

function eventDay(event: SpaceEvent): string {
  return event.allDay ? event.date.slice(0, 10) : localDayKey(event.date);
}

function eventTime(event: SpaceEvent): string {
  if (event.allDay) return 'All day';
  return formatDateTime(event.date);
}

export const SpaceEventsCalendarScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showToast } = useToast();
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(localDayKey(today.toISOString()));
  const [enabled, setEnabled] = useState<Record<EventType, boolean>>({
    launch: true,
    asteroid: true,
    meteor: true,
    moon: true,
    apod: true,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [active, setActive] = useState<SpaceEvent | null>(null);

  const start = new Date(cursor.year, cursor.month, 1);
  const end = new Date(cursor.year, cursor.month + 1, 0, 23, 59, 59);
  const { events, loading, refreshing, error, refetch } = useEvents(start.toISOString(), end.toISOString());

  const visible = useMemo(
    () => events.filter((event) => enabled[event.type as EventType] !== false && TYPES.some((type) => type.id === event.type)),
    [enabled, events]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, SpaceEvent[]>();
    visible.forEach((event) => {
      const key = eventDay(event);
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [visible]);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1).getDay();
    const count = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const slots: Array<number | null> = Array.from({ length: first }, () => null);
    for (let day = 1; day <= count; day += 1) slots.push(day);
    return slots;
  }, [cursor]);

  const selectedEvents = byDay.get(selected) || [];
  const offCount = TYPES.filter((type) => !enabled[type.id]).length;
  const todayKey = localDayKey(today.toISOString());

  const shift = (delta: number) => {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
    setSelected(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const addToCalendar = async (event: SpaceEvent) => {
    if (Platform.OS === 'web') return;
    const allDay = !!event.allDay;
    const startDate = allDay ? new Date(`${event.date.slice(0, 10)}T00:00:00`) : new Date(event.date);
    try {
      await Calendar.createEventInCalendarAsync({
        title: event.title,
        startDate,
        endDate: new Date(startDate.getTime() + (allDay ? 0 : 60 * 60 * 1000)),
        allDay,
        location: event.locationName,
        notes: event.description,
        timeZone: getCalendars()[0]?.timeZone || undefined,
      });
    } catch {
      showToast('Could not open the calendar');
    }
  };

  const openEvent = (event: SpaceEvent) => {
    if (event.type === 'launch') {
      const launchId = event.id.replace(/^launch-/, '');
      navigation.navigate('LaunchDetails', { launchId });
      return;
    }
    setActive(event);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.list}
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
        <ScreenHeader title="Events" />
        <View style={styles.monthRow}>
          <IconButton name="chevron-back" accessibilityLabel="Previous month" onPress={() => shift(-1)} />
          <Text accessibilityRole="header" style={styles.month}>
            {formatMonthHeading(cursor.year, cursor.month)}
          </Text>
          <IconButton name="chevron-forward" accessibilityLabel="Next month" onPress={() => shift(1)} />
          <IconButton
            name="options-outline"
            accessibilityLabel={offCount ? `Filter, ${offCount} hidden` : 'Filter'}
            selected={offCount > 0}
            onPress={() => setFiltersOpen(true)}
          />
        </View>
        <Text style={styles.stats}>{visible.length === 1 ? '1 event this month' : `${visible.length} events this month`}</Text>
        <View style={styles.weekdays}>
          {WEEKDAYS.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((day, index) => {
            if (!day) return <View key={`e-${index}`} style={styles.cell} />;
            const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const count = byDay.get(key)?.length || 0;
            const isSelected = key === selected;
            const isToday = key === todayKey;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`${formatMonthHeading(cursor.year, cursor.month).replace(/ \d+$/, '')} ${day}, ${count} ${count === 1 ? 'event' : 'events'}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelected(key)}
                style={[styles.cell, isSelected && styles.cellSelected, isToday && !isSelected && styles.cellToday]}
              >
                <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{day}</Text>
                {count > 0 ? <View style={[styles.mark, isSelected && styles.markSelected]} /> : <View style={styles.markSpacer} />}
              </Pressable>
            );
          })}
        </View>
        {loading && events.length === 0 ? <Skeleton /> : null}
        {error && events.length === 0 ? <ErrorState title="Couldn't load events" message={error} onRetry={refetch} /> : null}
        {!loading && selectedEvents.length === 0 && !error ? (
          <EmptyState icon="calendar-outline" title="Nothing scheduled" message="Pick another day." />
        ) : (
          selectedEvents.map((event) => (
            <Pressable
              key={event.id}
              accessibilityRole="button"
              accessibilityLabel={`${event.title}, ${eventTime(event)}`}
              onPress={() => openEvent(event)}
              style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
            >
              <Ionicons name={ICONS[event.type as EventType] || 'ellipse-outline'} size={18} color={color.text} />
              <View style={styles.eventText}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>{eventTime(event)}</Text>
                {event.type === 'asteroid' && event.asteroidData?.isHazardous ? (
                  <View style={styles.hazard}>
                    <Ionicons name="alert-circle-outline" size={16} color={color.text} />
                    <Text style={styles.eventMeta}>Hazardous</Text>
                  </View>
                ) : null}
              </View>
              {event.type === 'launch' ? <Ionicons name="chevron-forward" size={18} color={color.textTertiary} /> : null}
            </Pressable>
          ))
        )}
      </ScrollView>

      <Sheet visible={filtersOpen} title="Filter" onClose={() => setFiltersOpen(false)}>
        {TYPES.map((type) => {
          const on = enabled[type.id];
          return (
            <Pressable
              key={type.id}
              accessibilityRole="checkbox"
              accessibilityLabel={type.label}
              accessibilityState={{ checked: on }}
              onPress={() => setEnabled((current) => ({ ...current, [type.id]: !current[type.id] }))}
              style={styles.filterRow}
            >
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={color.text} />
              <Text style={styles.eventTitle}>{type.label}</Text>
            </Pressable>
          );
        })}
        <Button label="Done" onPress={() => setFiltersOpen(false)} style={styles.done} />
      </Sheet>

      <Sheet visible={!!active} title={active?.title || 'Event'} onClose={() => setActive(null)}>
        {active ? (
          <View style={styles.sheetBody}>
            <Text style={styles.eventMeta}>{eventTime(active)}</Text>
            {active.locationName ? <Text style={styles.eventMeta}>{active.locationName}</Text> : null}
            {active.description ? <Text style={styles.body}>{active.description}</Text> : null}
            {active.type === 'asteroid' && active.asteroidData?.isHazardous ? (
              <View style={styles.hazard}>
                <Ionicons name="alert-circle-outline" size={16} color={color.text} />
                <Text style={styles.eventTitle}>Hazardous</Text>
              </View>
            ) : null}
            {Platform.OS !== 'web' ? (
              <Button label="Add to calendar" onPress={() => addToCalendar(active)} />
            ) : null}
            {active.url ? (
              <Button label="Open link" variant="secondary" onPress={() => Linking.openURL(active.url!)} />
            ) : null}
            <Button label="Done" variant="secondary" onPress={() => setActive(null)} />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: space.s24 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.s8,
  },
  month: {
    ...type.title,
    color: color.text,
    flex: 1,
    textAlign: 'center',
  },
  stats: {
    ...type.footnote,
    color: color.textTertiary,
    paddingHorizontal: space.s20,
    marginBottom: space.s8,
    fontVariant: ['tabular-nums'],
  },
  weekdays: {
    flexDirection: 'row',
    paddingHorizontal: space.s12,
  },
  weekday: {
    ...type.caption,
    color: color.textTertiary,
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: space.s12,
    marginBottom: space.s8,
  },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  cellSelected: { backgroundColor: color.fill },
  cellToday: { borderWidth: 1, borderColor: color.fill },
  dayNum: { ...type.subhead, color: color.text, fontVariant: ['tabular-nums'] },
  dayNumSelected: { color: color.textOnFill, fontWeight: '600' },
  mark: { width: 3, height: 3, backgroundColor: color.fill, marginTop: 2 },
  markSelected: { backgroundColor: color.textOnFill },
  markSpacer: { height: 5 },
  eventRow: {
    minHeight: 64,
    paddingHorizontal: space.s20,
    paddingVertical: space.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
  },
  pressed: { backgroundColor: color.bgMuted },
  eventText: { flex: 1, gap: 2 },
  eventTitle: { ...type.headline, color: color.text },
  eventMeta: { ...type.footnote, color: color.textTertiary },
  hazard: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  filterRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
  },
  done: { marginTop: space.s16 },
  sheetBody: { gap: space.s12 },
  body: { ...type.body, color: color.text },
});
