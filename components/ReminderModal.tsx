import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { color, space, type } from '../constants/theme';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import {
  formatDateTime,
  formatDuration,
  isHourConfirmed,
  NetPrecision,
} from '../utils/dateUtils';
import { cancelReminder, hasReminder, scheduleReminder } from '../lib/notify';
import { hapticSuccess } from '../utils/haptics';
import { useToast } from './ui/Toast';

const PRESETS = [30, 60, 1440];

interface ReminderModalProps {
  visible: boolean;
  launchId: string;
  launchName: string;
  launchDate: string;
  precision?: NetPrecision | null;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  visible,
  launchId,
  launchName,
  launchDate,
  precision,
  onClose,
}) => {
  const { showToast } = useToast();
  const [selected, setSelected] = useState(60);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [existing, setExisting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setUseCustom(false);
    setCustom('');
    setSelected(60);
    hasReminder(launchId).then(setExisting).catch(() => setExisting(false));
  }, [visible, launchId]);

  const launchMs = new Date(launchDate).getTime();
  const minutes = useCustom ? Number(custom) : selected;
  const validCustom = !useCustom || (Number.isFinite(minutes) && minutes > 0 && Number.isInteger(minutes));
  const fireAt = launchMs - minutes * 60000;
  const tooLate = !validCustom || fireAt <= Date.now();
  const when = formatDateTime(launchDate, precision);
  const confirmed = isHourConfirmed(precision);

  const summary = useMemo(() => {
    if (!validCustom) return 'Enter a whole number of minutes.';
    if (tooLate) return 'That reminder time has already passed.';
    const line = `We'll remind you ${formatDuration(minutes)} before · ${when}`;
    return confirmed ? line : `${line}. The launch time isn't confirmed yet.`;
  }, [confirmed, minutes, tooLate, validCustom, when]);

  const save = async () => {
    if (tooLate || !validCustom) return;
    setBusy(true);
    try {
      await scheduleReminder(launchId, launchName, launchDate, minutes);
      hapticSuccess();
      showToast(`Reminder set for ${formatDuration(minutes)} before`);
      onClose();
    } catch (error: any) {
      const denied = String(error?.message || '').toLowerCase().includes('permission');
      Alert.alert(
        denied ? 'Notifications are off' : 'Could not set reminder',
        denied
          ? 'Turn on notifications for Rocket Launch Tracker in Settings to get a reminder.'
          : 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await cancelReminder(launchId);
      showToast('Reminder canceled');
      onClose();
    } catch {
      Alert.alert('Could not cancel reminder', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title="Remind me" onClose={onClose}>
      <Text style={styles.when}>{when}</Text>
      {!confirmed ? <Text style={styles.warn}>The launch time isn't confirmed yet.</Text> : null}
      {PRESETS.map((preset) => {
        const late = launchMs - preset * 60000 <= Date.now();
        const on = !useCustom && selected === preset;
        return (
          <Pressable
            key={preset}
            accessibilityRole="radio"
            accessibilityLabel={formatDuration(preset)}
            accessibilityState={{ selected: on, disabled: late }}
            disabled={late}
            onPress={() => {
              setUseCustom(false);
              setSelected(preset);
            }}
            style={({ pressed }) => [styles.preset, on && styles.presetOn, pressed && styles.pressed]}
          >
            <Text style={[styles.presetLabel, late && styles.disabled]}>{formatDuration(preset)}</Text>
            <Text style={[styles.presetMeta, late && styles.disabled]}>{late ? 'Too late' : on ? 'Selected' : ''}</Text>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel="Custom minutes"
        accessibilityState={{ selected: useCustom }}
        onPress={() => setUseCustom(true)}
        style={[styles.preset, useCustom && styles.presetOn]}
      >
        <Text style={styles.presetLabel}>Custom</Text>
        <TextInput
          value={custom}
          onChangeText={(value) => {
            setCustom(value.replace(/[^0-9]/g, ''));
            setUseCustom(true);
          }}
          keyboardType="number-pad"
          placeholder="Minutes"
          placeholderTextColor={color.textTertiary}
          accessibilityLabel="Custom minutes before launch"
          style={styles.input}
        />
      </Pressable>
      <Text style={styles.summary}>{summary}</Text>
      <Button label="Set reminder" onPress={save} disabled={tooLate || !validCustom} loading={busy} />
      {existing ? (
        <Button label="Cancel reminder" variant="secondary" onPress={remove} disabled={busy} style={styles.cancel} />
      ) : null}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  when: {
    ...type.subhead,
    color: color.textSecondary,
    fontVariant: ['tabular-nums'],
    marginBottom: space.s12,
  },
  warn: {
    ...type.footnote,
    color: color.textSecondary,
    marginBottom: space.s12,
  },
  preset: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
    paddingVertical: space.s8,
  },
  presetOn: {
    backgroundColor: color.bgMuted,
  },
  pressed: {
    backgroundColor: color.bgMuted,
  },
  presetLabel: {
    ...type.body,
    color: color.text,
  },
  presetMeta: {
    ...type.footnote,
    color: color.textTertiary,
  },
  disabled: {
    color: color.textDisabled,
  },
  input: {
    minWidth: 96,
    minHeight: 44,
    color: color.text,
    textAlign: 'right',
    ...type.body,
    fontVariant: ['tabular-nums'],
  },
  summary: {
    ...type.footnote,
    color: color.textSecondary,
    marginVertical: space.s16,
  },
  cancel: {
    marginTop: space.s8,
  },
});
