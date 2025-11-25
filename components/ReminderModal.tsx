import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { scheduleReminder, cancelReminder, hasReminder } from '../lib/notify';
import { GlassCard, GradientButton } from './ui';
import { Colors } from '../constants/colors';

interface ReminderModalProps {
  visible: boolean;
  onClose: () => void;
  launchId: string;
  launchName: string;
  launchDate: string;
}

const PRESETS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1 day', minutes: 24 * 60 },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  visible,
  onClose,
  launchId,
  launchName,
  launchDate,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingReminder, setHasExistingReminder] = useState(false);

  React.useEffect(() => {
    if (visible) {
      checkExistingReminder();
    }
  }, [visible, launchId]);

  const checkExistingReminder = async () => {
    const exists = await hasReminder(launchId);
    setHasExistingReminder(exists);
  };

  const handleSetReminder = async () => {
    if (loading) return;

    let minutes: number;
    if (isCustom) {
      const parsed = parseInt(customMinutes, 10);
      if (isNaN(parsed) || parsed <= 0) {
        Alert.alert('Invalid Time', 'Please enter a valid number of minutes.');
        return;
      }
      minutes = parsed;
    } else if (selectedPreset === null) {
      Alert.alert('Select Time', 'Please select a reminder time.');
      return;
    } else {
      minutes = PRESETS[selectedPreset].minutes;
    }

    try {
      setLoading(true);
      
      // Cancel existing reminder if any
      if (hasExistingReminder) {
        await cancelReminder(launchId);
      }

      await scheduleReminder(launchId, launchName, launchDate, minutes);
      Alert.alert('Reminder Set', `You'll be notified ${minutes} minute${minutes !== 1 ? 's' : ''} before the launch.`);
      onClose();
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReminder = async () => {
    try {
      setLoading(true);
      await cancelReminder(launchId);
      Alert.alert('Reminder Cancelled', 'Your reminder has been cancelled.');
      setHasExistingReminder(false);
      onClose();
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel reminder.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPreset(null);
    setCustomMinutes('');
    setIsCustom(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 27, 75, 0.95)']}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <GlassCard style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Set Reminder</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

          <View style={styles.content}>
            <Text style={styles.launchName}>{launchName}</Text>
            <Text style={styles.launchDate}>{new Date(launchDate).toLocaleString()}</Text>

            {hasExistingReminder && (
              <GlassCard style={styles.existingReminder}>
                <MaterialIcons name="info" size={20} color={Colors.primary} />
                <Text style={styles.existingReminderText}>
                  You already have a reminder set for this launch.
                </Text>
              </GlassCard>
            )}

            {!isCustom ? (
              <>
                <Text style={styles.label}>Select reminder time:</Text>
                <View style={styles.presetsContainer}>
                  {PRESETS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.presetButton,
                        selectedPreset === index && styles.presetButtonActive,
                      ]}
                      onPress={() => setSelectedPreset(index)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name={selectedPreset === index ? 'check-circle' : 'radio-button-unchecked'}
                        size={24}
                        color={selectedPreset === index ? Colors.primary : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.presetText,
                          selectedPreset === index && styles.presetTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.customButton}
                  onPress={() => setIsCustom(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customButtonText}>Custom time</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter minutes before launch:</Text>
                <GlassCard style={styles.inputCard}>
                  <TextInput
                    style={styles.input}
                    value={customMinutes}
                    onChangeText={setCustomMinutes}
                    placeholder="e.g., 120"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    autoFocus
                  />
                </GlassCard>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setIsCustom(false);
                    setCustomMinutes('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>Back to presets</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

            <View style={styles.footer}>
              {hasExistingReminder && (
                <TouchableOpacity
                  style={styles.cancelReminderButton}
                  onPress={handleCancelReminder}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelReminderButtonText}>Cancel Reminder</Text>
                </TouchableOpacity>
              )}
              <GradientButton
                title={loading ? 'Setting...' : hasExistingReminder ? 'Update Reminder' : 'Set Reminder'}
                onPress={handleSetReminder}
                disabled={loading}
                style={styles.setButton}
              />
            </View>
          </GlassCard>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    width: '100%',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 0,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  launchName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  launchDate: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 20,
  },
  existingReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  existingReminderText: {
    color: Colors.primary,
    fontSize: 14,
    flex: 1,
    fontWeight: '600',
  },
  label: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  presetButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  presetText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  presetTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  customButton: {
    padding: 12,
    alignItems: 'center',
  },
  customButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputCard: {
    padding: 0,
    marginBottom: 12,
  },
  input: {
    padding: 16,
    color: Colors.text,
    fontSize: 15,
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  cancelReminderButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelReminderButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  setButton: {
    flex: 1,
  },
});

