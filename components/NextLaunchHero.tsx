import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Launch } from '../types';
import { color, space, type } from '../constants/theme';
import { formatDateTime, formatRelative, isHourConfirmed, precisionKind } from '../utils/dateUtils';
import { statusLabel } from '../utils/launchStatus';
import { heroImageUrl } from '../utils/launchMedia';
import { Surface } from './ui/Surface';
import { StatusBadge } from './ui/StatusBadge';
import { Button } from './ui/Button';
import { CountdownTimer } from './CountdownTimer';

interface NextLaunchHeroProps {
  launch: Launch;
  now: Date;
  onPress: () => void;
  onRemind: () => void;
}

export const NextLaunchHero: React.FC<NextLaunchHeroProps> = ({ launch, now, onPress, onRemind }) => {
  const image = heroImageUrl(launch);
  const provider = launch.launch_service_provider?.name || 'Unknown provider';
  const vehicle = launch.rocket?.configuration?.name;
  const when = formatDateTime(launch.net, launch.net_precision, { now });
  const kind = precisionKind(launch.net_precision);
  const relative = kind === 'time' ? formatRelative(launch.net, { now }) : kind === 'day' ? 'Time TBD' : '';
  const passed = new Date(launch.net).getTime() <= now.getTime();
  const remindLabel = passed ? 'Window passed' : 'Remind me';

  return (
    <Surface padded={false} style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${launch.name}, ${provider}, ${statusLabel(launch.status?.id, launch.status?.name)}, ${when}`}
        onPress={onPress}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} accessible={false} />
        ) : (
          <View style={styles.image} accessible={false}>
            <Ionicons name="rocket-outline" size={32} color={color.textTertiary} />
          </View>
        )}
        <View style={styles.body}>
          <StatusBadge statusId={launch.status?.id} status={launch.status?.name} size="medium" />
          <Text style={styles.name}>{launch.name}</Text>
          <Text style={styles.meta}>{vehicle ? `${provider} · ${vehicle}` : provider}</Text>
          <Text style={styles.when}>{when}</Text>
          {relative ? <Text style={styles.relative}>{relative}</Text> : null}
          {kind === 'time' ? <CountdownTimer date={launch.net} /> : null}
          {!isHourConfirmed(launch.net_precision) && kind !== 'time' ? null : null}
        </View>
      </Pressable>
      <View style={styles.action}>
        <Button label={remindLabel} onPress={onRemind} disabled={passed} />
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: space.s20,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: color.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: space.s16,
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
  action: {
    paddingHorizontal: space.s16,
    paddingBottom: space.s16,
  },
});
