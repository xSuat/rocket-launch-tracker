import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Launch } from '../types';
import { color, space, type } from '../constants/theme';
import { formatDateTime, formatRelative, precisionKind } from '../utils/dateUtils';
import { isUpcomingStatus, statusLabel } from '../utils/launchStatus';
import { thumbnailUrl } from '../utils/launchMedia';
import { StatusBadge } from './ui/StatusBadge';
import { IconButton } from './ui/IconButton';

interface LaunchRowProps {
  launch: Launch;
  now: Date;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export const LaunchRow: React.FC<LaunchRowProps> = ({ launch, now, favorite, onPress, onToggleFavorite }) => {
  const when = formatDateTime(launch.net, launch.net_precision, { now });
  const kind = precisionKind(launch.net_precision);
  const relative = kind === 'time'
    ? formatRelative(launch.net, { now })
    : kind === 'day'
      ? 'Time TBD'
      : '';
  const provider = launch.launch_service_provider?.name || 'Unknown provider';
  const vehicle = launch.rocket?.configuration?.name;
  const status = statusLabel(launch.status?.id, launch.status?.name);
  const thumb = thumbnailUrl(launch);
  const past = !isUpcomingStatus(launch.status?.id);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${launch.name}, ${provider}, ${status}, ${when}`}
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} accessible={false} />
        ) : (
          <View style={styles.placeholder} accessible={false}>
            <Ionicons name="rocket-outline" size={22} color={color.textTertiary} />
          </View>
        )}
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{launch.name}</Text>
            <StatusBadge statusId={launch.status?.id} status={launch.status?.name} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {vehicle ? `${provider} · ${vehicle}` : provider}
          </Text>
          <Text style={styles.when}>{past && kind !== 'time' ? when : when}</Text>
          {relative ? <Text style={styles.relative}>{relative}</Text> : null}
        </View>
      </Pressable>
      <IconButton
        name={favorite ? 'heart' : 'heart-outline'}
        accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
        selected={favorite}
        onPress={onToggleFavorite}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.s20,
    paddingRight: space.s8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
    marginLeft: 0,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    gap: space.s12,
    paddingVertical: space.s12,
    minHeight: 64,
  },
  pressed: {
    backgroundColor: color.bgMuted,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: color.bgMuted,
  },
  placeholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: color.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s8,
  },
  name: {
    ...type.headline,
    color: color.text,
    flex: 1,
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
    fontVariant: ['tabular-nums'],
  },
});
