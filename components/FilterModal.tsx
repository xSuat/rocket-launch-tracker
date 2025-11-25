import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { LaunchFilters } from '../types';
import {
  filterOptionsService,
  LocationOption,
  RocketOption,
  AgencyOption,
  OrbitOption,
  ProgramOption,
} from '../services/filterOptions';
import { GlassCard, GradientButton } from './ui';
import { Colors } from '../constants/colors';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: LaunchFilters;
  onApplyFilters: (filters: LaunchFilters) => void;
}

type FilterTab = 'Country' | 'Location' | 'Rocket Family' | 'Rocket Variant' | 'Rocket' | 'Agency' | 'Mission Type' | 'Orbit' | 'Program';

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<LaunchFilters>(filters);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('Country');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options
  const [countries, setCountries] = useState<string[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [rocketFamilies, setRocketFamilies] = useState<string[]>([]);
  const [rocketVariants, setRocketVariants] = useState<string[]>([]);
  const [rockets, setRockets] = useState<RocketOption[]>([]);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [orbits, setOrbits] = useState<OrbitOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [missionTypes, setMissionTypes] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      setSearchQuery('');
      setActiveTab('Country');
      loadFilterOptions();
    }
  }, [visible, filters]);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      const [
        countriesData,
        locationsData,
        familiesData,
        variantsData,
        rocketsData,
        agenciesData,
        orbitsData,
        programsData,
        typesData,
      ] = await Promise.all([
        filterOptionsService.getCountries(),
        filterOptionsService.getLocations(),
        filterOptionsService.getRocketFamilies(),
        filterOptionsService.getRocketVariants(),
        filterOptionsService.getRockets(),
        filterOptionsService.getAgencies(),
        filterOptionsService.getOrbits(),
        filterOptionsService.getPrograms(),
        filterOptionsService.getMissionTypes(),
      ]);
      setCountries(countriesData);
      setLocations(locationsData);
      setRocketFamilies(familiesData);
      setRocketVariants(variantsData);
      setRockets(rocketsData);
      setAgencies(agenciesData);
      setOrbits(orbitsData);
      setPrograms(programsData);
      setMissionTypes(typesData);
    } catch (error) {
      if (__DEV__) console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeToArray = (value: any): any[] => {
    if (value === undefined || value === null) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  };

  const clearFilter = (key: keyof LaunchFilters) => {
    setLocalFilters((prev) => {
      const updated: LaunchFilters = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const toggleFilterValue = (key: keyof LaunchFilters, selectedValue: any) => {
    setLocalFilters((prev) => {
      const current = normalizeToArray(prev[key]);
      const exists = current.some((value) => value === selectedValue);
      const updatedValues = exists
        ? current.filter((value) => value !== selectedValue)
        : [...current, selectedValue];

      const nextState: LaunchFilters = { ...prev };
      if (updatedValues.length === 0) {
        delete nextState[key];
      } else {
        nextState[key] = updatedValues as any;
      }
      return nextState;
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: LaunchFilters = {};
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    Object.values(localFilters).forEach((value) => {
      const normalized = normalizeToArray(value);
      if (normalized.length > 0) {
        count += normalized.length;
      }
    });
    return count;
  };

  const getSelectedFilters = (): Array<{ key: keyof LaunchFilters; label: string; value: string; rawValue: any }> => {
    const selected: Array<{ key: keyof LaunchFilters; label: string; value: string; rawValue: any }> = [];
    
    const filterLabels: Partial<Record<keyof LaunchFilters, string>> = {
      location__country_code: 'Country',
      location__id: 'Location',
      rocket__configuration__family: 'Rocket Family',
      rocket__configuration__variant: 'Rocket Variant',
      rocket__configuration__id: 'Rocket',
      lsp__id: 'Agency',
      mission__type: 'Mission Type',
      mission__orbit__id: 'Orbit',
      program__id: 'Program',
    };

    Object.entries(localFilters).forEach(([key, value]) => {
      const filterKey = key as keyof LaunchFilters;
      const values = normalizeToArray(value);
      if (values.length === 0) {
        return;
      }
      values.forEach((singleValue) => {
        let displayValue = String(singleValue);
        
        if (filterKey === 'location__id') {
          const location = locations.find(l => l.id === singleValue);
          displayValue = location ? location.name : displayValue;
        } else if (filterKey === 'rocket__configuration__id') {
          const rocket = rockets.find(r => r.id === singleValue);
          displayValue = rocket ? rocket.name : displayValue;
        } else if (filterKey === 'lsp__id') {
          const agency = agencies.find(a => a.id === singleValue);
          displayValue = agency ? agency.name : displayValue;
        } else if (filterKey === 'mission__orbit__id') {
          const orbit = orbits.find(o => o.id === singleValue);
          displayValue = orbit ? orbit.name : displayValue;
        } else if (filterKey === 'program__id') {
          const program = programs.find(p => p.id === singleValue);
          displayValue = program ? program.name : displayValue;
        }

        selected.push({
          key: filterKey,
          label: filterLabels[filterKey] || key,
          value: displayValue,
          rawValue: singleValue,
        });
      });
    });
    
    return selected;
  };

  const removeFilter = (key: keyof LaunchFilters, valueToRemove?: any) => {
    setLocalFilters((prev) => {
      if (valueToRemove === undefined) {
        const updated: LaunchFilters = { ...prev };
        delete updated[key];
        return updated;
      }

      const current = normalizeToArray(prev[key]);
      const nextValues = current.filter((value) => value !== valueToRemove);
      const updated: LaunchFilters = { ...prev };
      if (nextValues.length === 0) {
        delete updated[key];
      } else {
        updated[key] = nextValues as any;
      }
      return updated;
    });
  };

  const filterTabs: FilterTab[] = ['Country', 'Location', 'Rocket Family', 'Rocket Variant', 'Rocket', 'Agency', 'Mission Type', 'Orbit', 'Program'];

  const getFilteredOptions = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null;

    switch (activeTab) {
      case 'Country':
        return countries.filter(c => c.toLowerCase().includes(query));
      case 'Location':
        return locations.filter(l => l.name.toLowerCase().includes(query));
      case 'Rocket Family':
        return rocketFamilies.filter(f => f.toLowerCase().includes(query));
      case 'Rocket Variant':
        return rocketVariants.filter(v => v.toLowerCase().includes(query));
      case 'Rocket':
        return rockets.filter(r => r.name.toLowerCase().includes(query));
      case 'Agency':
        return agencies.filter(a => a.name.toLowerCase().includes(query));
      case 'Mission Type':
        return missionTypes.filter(t => t.toLowerCase().includes(query));
      case 'Orbit':
        return orbits.filter(o => o.name.toLowerCase().includes(query));
      case 'Program':
        return programs.filter(p => p.name.toLowerCase().includes(query));
      default:
        return null;
    }
  };

  const renderPicker = (
    key: keyof LaunchFilters,
    options: Array<{ id?: number; name: string; [property: string]: any }>,
    displayKey: string = 'name'
  ) => {
    const selectedValues = normalizeToArray(localFilters[key]);
    const filteredOptions = getFilteredOptions();
    const displayOptions = filteredOptions
      ? filteredOptions as Array<{ id?: number; name: string; [property: string]: any }>
      : options;
    const hasSelection = selectedValues.length > 0;

    return (
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkboxOption}
          onPress={() => clearFilter(key)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={!hasSelection ? "check-box" : "check-box-outline-blank"}
            size={24}
            color={!hasSelection ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.checkboxText, !hasSelection && styles.checkboxTextActive]}>All</Text>
        </TouchableOpacity>
        {displayOptions.map((option) => {
          const optionValue = option.id !== undefined ? option.id : option[displayKey];
          const isSelected = selectedValues.some((selected) => selected === optionValue);
          return (
            <TouchableOpacity
              key={optionValue}
              style={styles.checkboxOption}
              onPress={() => toggleFilterValue(key, optionValue)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={isSelected ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={isSelected ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.checkboxText, isSelected && styles.checkboxTextActive]}>
                {option[displayKey]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStringPicker = (
    key: keyof LaunchFilters,
    options: string[],
  ) => {
    const selectedValues = normalizeToArray(localFilters[key]);
    const filteredOptions = getFilteredOptions();
    const displayOptions = filteredOptions ? filteredOptions as string[] : options;
    const hasSelection = selectedValues.length > 0;

    return (
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkboxOption}
          onPress={() => clearFilter(key)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={!hasSelection ? "check-box" : "check-box-outline-blank"}
            size={24}
            color={!hasSelection ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.checkboxText, !hasSelection && styles.checkboxTextActive]}>All</Text>
        </TouchableOpacity>
        {displayOptions.map((option) => {
          const isSelected = selectedValues.some((selected) => selected === option);
          return (
            <TouchableOpacity
              key={option}
              style={styles.checkboxOption}
              onPress={() => toggleFilterValue(key, option)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={isSelected ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={isSelected ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.checkboxText, isSelected && styles.checkboxTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Country':
        return renderStringPicker('location__country_code', countries);
      case 'Location':
        return renderPicker('location__id', locations);
      case 'Rocket Family':
        return renderStringPicker('rocket__configuration__family', rocketFamilies);
      case 'Rocket Variant':
        return renderStringPicker('rocket__configuration__variant', rocketVariants);
      case 'Rocket':
        return renderPicker('rocket__configuration__id', rockets);
      case 'Agency':
        return renderPicker('lsp__id', agencies);
      case 'Mission Type':
        return renderStringPicker('mission__type', missionTypes);
      case 'Orbit':
        return renderPicker('mission__orbit__id', orbits);
      case 'Program':
        return renderPicker('program__id', programs);
      default:
        return null;
    }
  };

  const selectedFilters = getSelectedFilters();

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
              <Text style={styles.title}>
                Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tabsContainer}
              contentContainerStyle={styles.tabsContent}
            >
              {filterTabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.tab}
                  onPress={() => {
                    setActiveTab(tab);
                    setSearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  {activeTab === tab ? (
                    <LinearGradient
                      colors={[Colors.primary, Colors.pink]}
                      style={styles.tabGradient}
                    >
                      <Text style={styles.tabTextActive}>
                        {tab}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.tabText}>
                      {tab}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selected Filters Chips */}
            {selectedFilters.length > 0 && (
              <View style={styles.chipsContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsContent}
                >
                  {selectedFilters.map((filter) => (
                    <LinearGradient
                      key={`${filter.key}-${filter.rawValue}`}
                      colors={[Colors.primary, Colors.pink]}
                      style={styles.chip}
                    >
                      <Text style={styles.chipText}>
                        {filter.label}: {filter.value}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeFilter(filter.key, filter.rawValue)}
                        style={styles.chipClose}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="close" size={16} color={Colors.text} />
                      </TouchableOpacity>
                    </LinearGradient>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Search Box */}
            <View style={styles.searchWrapper}>
              <GlassCard style={styles.searchCard}>
                <View style={styles.searchContainer}>
                  <MaterialIcons name="search" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      style={styles.searchClear}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="close" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading filter options...</Text>
              </View>
            ) : (
              <View style={styles.contentWrapper}>
                <ScrollView 
                  style={styles.content} 
                  contentContainerStyle={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {renderActiveTabContent()}
                </ScrollView>
              </View>
            )}

            {/* Fixed Bottom Bar */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <GradientButton
                title="Apply"
                onPress={handleApply}
                style={styles.applyButton}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  tabGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabTextActive: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chipsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    maxHeight: 60,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  chipClose: {
    padding: 2,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchCard: {
    padding: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: 0,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
  searchClear: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  contentWrapper: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  checkboxContainer: {
    gap: 8,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  checkboxText: {
    color: Colors.textMuted,
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  checkboxTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
  },
});


