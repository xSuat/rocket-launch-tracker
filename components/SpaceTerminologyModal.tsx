import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { color, space, type } from '../constants/theme';
import { Sheet } from './ui/Sheet';
import { Chip } from './ui/Chip';

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
  { term: 'TBD', definition: 'To Be Determined. Launch details are still being finalized.', category: 'Status' },
  { term: 'TBC', definition: 'To Be Confirmed. Launch details are pending confirmation.', category: 'Status' },
  { term: 'Go', definition: 'The launch is proceeding as planned.', category: 'Status' },
  { term: 'Hold', definition: 'A temporary delay in the countdown.', category: 'Status' },
  { term: 'Success', definition: 'The launch completed and achieved its objectives.', category: 'Status' },
  { term: 'Failure', definition: 'The launch did not achieve its intended objectives.', category: 'Status' },
  { term: 'Partial failure', definition: 'The launch had issues but achieved some objectives.', category: 'Status' },
  { term: 'Orbit', definition: 'The curved path of an object around a planet or other body.', category: 'Orbit' },
  { term: 'LEO', definition: 'Low Earth Orbit. An orbit between 160 and 2,000 km above Earth.', category: 'Orbit' },
  { term: 'GTO', definition: 'Geostationary Transfer Orbit. An elliptical orbit used to reach geostationary orbit.', category: 'Orbit' },
  { term: 'GEO', definition: 'Geostationary Orbit. An orbit at 35,786 km where satellites match Earth\'s rotation.', category: 'Orbit' },
  { term: 'Apogee', definition: 'The point in an orbit farthest from Earth.', category: 'Orbit' },
  { term: 'Perigee', definition: 'The point in an orbit closest to Earth.', category: 'Orbit' },
  { term: 'NET', definition: 'No Earlier Than. The earliest possible launch time, subject to change.', category: 'Launch' },
  { term: 'T-0', definition: 'The moment the rocket lifts off.', category: 'Launch' },
  { term: 'Scrub', definition: 'Cancellation of a launch attempt, which can be rescheduled.', category: 'Launch' },
  { term: 'Booster', definition: 'The first stage of a rocket that provides the initial thrust.', category: 'Rocket' },
  { term: 'Payload', definition: 'The cargo carried by a rocket, such as a satellite or spacecraft.', category: 'Rocket' },
  { term: 'Fairing', definition: 'The protective nose cone that covers the payload during launch.', category: 'Rocket' },
  { term: 'Stage', definition: 'A section of a rocket with its own engines and fuel.', category: 'Rocket' },
];

const CATEGORIES = ['All', 'Status', 'Orbit', 'Launch', 'Rocket'];

export const SpaceTerminologyModal: React.FC<SpaceTerminologyModalProps> = ({ visible, onClose }) => {
  const [category, setCategory] = useState('All');
  const terms = category === 'All' ? TERMINOLOGY : TERMINOLOGY.filter((term) => term.category === category);

  return (
    <Sheet visible={visible} title="Glossary" onClose={onClose}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((item) => (
          <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
        ))}
      </ScrollView>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {terms.map((term) => (
          <View key={term.term} style={styles.term}>
            <Text style={styles.termName}>{term.term}</Text>
            <Text style={styles.definition}>{term.definition}</Text>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  chips: {
    gap: space.s8,
    paddingBottom: space.s12,
  },
  list: { maxHeight: 420 },
  listContent: { paddingBottom: space.s16 },
  term: {
    paddingVertical: space.s12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
    gap: 4,
  },
  termName: { ...type.headline, color: color.text },
  definition: { ...type.subhead, color: color.textSecondary },
});
