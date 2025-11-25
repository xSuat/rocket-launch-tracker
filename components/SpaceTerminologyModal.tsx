import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface SpaceTerminologyModalProps {
  visible: boolean;
  onClose: () => void;
}


interface Term {
  term: string;
  definition: string;
  category: string;
}

const TERMINOLOGY: Term[] = [
  // Status Terms
  { term: 'TBD', definition: 'To Be Determined - Launch details are still being finalized.', category: 'Status' },
  { term: 'TBC', definition: 'To Be Confirmed - Launch details are pending confirmation.', category: 'Status' },
  { term: 'GO', definition: 'All systems are ready and the launch is proceeding as planned.', category: 'Status' },
  { term: 'Success', definition: 'The launch completed successfully and achieved its objectives.', category: 'Status' },
  { term: 'Failure', definition: 'The launch did not achieve its intended objectives.', category: 'Status' },
  { term: 'Partial Failure', definition: 'The launch had issues but achieved some objectives.', category: 'Status' },
  
  // Orbit Terms
  { term: 'Orbit', definition: 'The curved path of an object around a planet or other celestial body.', category: 'Orbit' },
  { term: 'LEO', definition: 'Low Earth Orbit - An orbit between 160-2000 km above Earth.', category: 'Orbit' },
  { term: 'GTO', definition: 'Geostationary Transfer Orbit - An elliptical orbit used to reach geostationary orbit.', category: 'Orbit' },
  { term: 'GEO', definition: 'Geostationary Orbit - An orbit at 35,786 km where satellites match Earth\'s rotation.', category: 'Orbit' },
  { term: 'Apogee', definition: 'The point in an orbit farthest from Earth.', category: 'Orbit' },
  { term: 'Perigee', definition: 'The point in an orbit closest to Earth.', category: 'Orbit' },
  
  // Launch Terms
  { term: 'NET', definition: 'No Earlier Than - The earliest possible launch time, subject to change.', category: 'Launch' },
  { term: 'T-0', definition: 'Launch time - The exact moment when the rocket lifts off.', category: 'Launch' },
  { term: 'Hold', definition: 'A temporary delay or stop in the countdown.', category: 'Launch' },
  { term: 'Scrub', definition: 'Cancellation of a launch attempt, which can be rescheduled.', category: 'Launch' },
  
  // Rocket Terms
  { term: 'Booster', definition: 'The first stage of a rocket that provides initial thrust.', category: 'Rocket' },
  { term: 'Payload', definition: 'The cargo carried by a rocket, such as satellites or spacecraft.', category: 'Rocket' },
  { term: 'Fairing', definition: 'The protective nose cone that covers the payload during launch.', category: 'Rocket' },
  { term: 'Stage', definition: 'A section of a rocket with its own engines and fuel.', category: 'Rocket' },
  { term: 'Thrust', definition: 'The force produced by rocket engines to propel the vehicle.', category: 'Rocket' },
  
  // Mission Terms
  { term: 'ISS', definition: 'International Space Station - A habitable space station in low Earth orbit.', category: 'Mission' },
];

const CATEGORIES = ['All', 'Status', 'Orbit', 'Launch', 'Rocket', 'Mission'];

export const SpaceTerminologyModal: React.FC<SpaceTerminologyModalProps> = ({
  visible,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const filteredTerms = selectedCategory === 'All'
    ? TERMINOLOGY
    : TERMINOLOGY.filter(term => term.category === selectedCategory);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={Colors.backgroundGradient as any}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Space Terminology</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                <MaterialIcons name="close" size={32} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
              contentContainerStyle={styles.categoryContent}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              style={styles.termsContainer}
              contentContainerStyle={styles.termsContent}
              showsVerticalScrollIndicator={true}
            >
              {filteredTerms.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <Text style={styles.termName}>{term.term}</Text>
                  <Text style={styles.termDefinition}>{term.definition}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    width: '100%',
  },
  modalContent: {
    flex: 1,
    padding: 32,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 12,
  },
  categoryContainer: {
    marginBottom: 16,
    maxHeight: 25,
  },
  categoryContent: {
    paddingRight: 32,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  categoryTextActive: {
    color: Colors.text,
  },
  termsContainer: {
    flex: 1,
  },
  termsContent: {
    paddingBottom: 40,
  },
  termItem: {
    marginBottom: 32,
  },
  termName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  termDefinition: {
    fontSize: 20,
    color: Colors.text,
    lineHeight: 30,
  },
});

