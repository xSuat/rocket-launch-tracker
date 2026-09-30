import React, { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { color, space, type } from '../constants/theme';
import { ApodPicture, getAPODRange } from '../services/events';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Surface } from '../components/ui/Surface';
import { Sheet } from '../components/ui/Sheet';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../utils/dateUtils';

function range() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 13);
  const ymd = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };
  return { start: ymd(start), end: ymd(end) };
}

function still(item: ApodPicture): string | undefined {
  if (item.media_type === 'video') return item.thumbnail_url;
  return item.url || item.thumbnail_url;
}

export const GalleryScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<ApodPicture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApodPicture | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else if (items.length === 0) setLoading(true);
    setError(null);
    try {
      const { start, end } = range();
      setItems(await getAPODRange(start, end));
    } catch (err: any) {
      setError(err.message || 'Could not load pictures');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [items.length]);

  useEffect(() => {
    load(false);
  }, []);

  const featured = items[0];
  const rest = items.slice(1);
  const gap = 8;
  const cell = (width - space.s20 * 2 - gap) / 2;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={color.text}
            colors={[color.text]}
            progressBackgroundColor={color.bg}
          />
        }
      >
        <ScreenHeader title="Gallery" />
        {loading && items.length === 0 ? (
          <View>
            <View style={styles.featuredSkeleton} />
            <Skeleton rows={2} />
          </View>
        ) : null}
        {error && items.length === 0 ? (
          <ErrorState title="Couldn't load pictures" message={error} onRetry={() => load(true)} />
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState icon="images-outline" title="No pictures" message="Pull to refresh." actionLabel="Refresh" onAction={() => load(true)} />
        ) : null}
        {featured ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={featured.title}
            onPress={() => setSelected(featured)}
            style={styles.featuredWrap}
          >
            <Surface padded={false}>
              {still(featured) ? (
                <Image source={{ uri: still(featured) }} style={styles.featuredImage} accessible={false} />
              ) : (
                <View style={styles.featuredImage} />
              )}
              <Svg style={styles.scrim} pointerEvents="none">
                <Defs>
                  <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                    <Stop offset="1" stopColor="#000000" stopOpacity="0.72" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#scrim)" />
              </Svg>
              <View style={styles.caption}>
                {featured.media_type === 'video' ? (
                  <View style={styles.video}>
                    <Ionicons name="play-outline" size={16} color={color.text} />
                    <Text style={styles.videoLabel}>Video</Text>
                  </View>
                ) : null}
                <Text style={styles.captionTitle} numberOfLines={2}>{featured.title}</Text>
                <Text style={styles.captionDate}>{formatDateTime(featured.date, { id: 3, name: 'Day' })}</Text>
              </View>
            </Surface>
          </Pressable>
        ) : null}
        <View style={styles.grid}>
          {rest.map((item) => (
            <Pressable
              key={item.date}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => setSelected(item)}
              style={{ width: cell, height: cell }}
            >
              {still(item) ? (
                <Image source={{ uri: still(item) }} style={styles.cellImage} accessible={false} />
              ) : (
                <View style={styles.cellImage} />
              )}
              {item.media_type === 'video' ? (
                <View style={styles.playBadge}>
                  <Ionicons name="play-outline" size={16} color={color.text} />
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Sheet visible={!!selected} title={selected?.title || 'Picture'} onClose={() => setSelected(null)}>
        {selected ? (
          <ScrollView contentContainerStyle={styles.detail}>
            {selected.media_type === 'video' && selected.url ? (
              <Button label="Play video" onPress={() => Linking.openURL(selected.url!)} />
            ) : selected.hdurl || selected.url ? (
              <Image source={{ uri: selected.hdurl || selected.url }} style={styles.detailImage} accessibilityLabel={selected.title} />
            ) : null}
            <Text style={styles.captionDate}>{formatDateTime(selected.date, { id: 3, name: 'Day' })}</Text>
            {selected.explanation ? <Text style={styles.explanation}>{selected.explanation}</Text> : null}
            {selected.hdurl ? (
              <Button label="View full image" variant="secondary" onPress={() => Linking.openURL(selected.hdurl!)} />
            ) : null}
          </ScrollView>
        ) : null}
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: space.s24 },
  featuredWrap: { paddingHorizontal: space.s20, marginBottom: space.s16 },
  featuredImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: color.bgMuted },
  featuredSkeleton: {
    marginHorizontal: space.s20,
    aspectRatio: 16 / 9,
    backgroundColor: color.bgMuted,
    borderRadius: 16,
  },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  caption: { position: 'absolute', left: space.s16, right: space.s16, bottom: space.s16, gap: 4 },
  captionTitle: { ...type.headline, color: color.text },
  captionDate: { ...type.footnote, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  video: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  videoLabel: { ...type.caption, color: color.text },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: space.s20,
  },
  cellImage: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: color.bgMuted },
  playBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: { gap: space.s12, paddingBottom: space.s16 },
  detailImage: { width: '100%', aspectRatio: 1, backgroundColor: color.bgMuted, borderRadius: 8 },
  explanation: { ...type.body, color: color.text },
});
