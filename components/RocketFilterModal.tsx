import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { filterOptionsService, AgencyOption } from '../services/filterOptions';
import { launchAPI } from '../services/api';
import { GlassCard, GradientButton } from './ui';
import { Colors } from '../constants/colors';

interface RocketFilters {
  active?: boolean | null;
  country_code?: string | null;
  family?: string | null;
  manufacturer?: string | null;
}

interface RocketFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: RocketFilters;
  onApplyFilters: (filters: RocketFilters) => void;
}

export const RocketFilterModal: React.FC<RocketFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<RocketFilters>(filters);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      loadFilterOptions();
    }
  }, [visible, filters]);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      // Load all rockets to extract unique manufacturers and families
      const rocketsResponse = await launchAPI.getRocketConfigurations({ limit: 500 }, true);
      const rockets = rocketsResponse.results || [];
      
      // Extract unique manufacturers
      const uniqueManufacturers = Array.from(
        new Set(rockets.map((r: any) => r.manufacturer).filter(Boolean))
      ).sort() as string[];
      
      // Extract unique families
      const uniqueFamilies = Array.from(
        new Set(rockets.map((r: any) => r.family).filter(Boolean))
      ).sort() as string[];

      const [countriesData, agenciesData] = await Promise.all([
        filterOptionsService.getCountries(),
        filterOptionsService.getAgencies(),
      ]);

      setCountries(countriesData);
      setFamilies(uniqueFamilies);
      setManufacturers(uniqueManufacturers);
      setAgencies(agenciesData);
    } catch (error) {
      if (__DEV__) console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (key: keyof RocketFilters, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const clearFilter = (key: keyof RocketFilters) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: RocketFilters = {
      active: null,
      country_code: null,
      family: null,
      manufacturer: null,
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  const getActiveFilterCount = (): number => {
    return Object.values(localFilters).filter((v) => v !== null && v !== undefined).length;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 27, 75, 0.95)']}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <GlassCard style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Filter Rockets</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Active/Inactive Filter */}
                <GlassCard style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        localFilters.active === true && styles.optionButtonActive,
                      ]}
                      onPress={() => toggleFilter('active', true)}
                    >
                      <MaterialIcons
                        name={localFilters.active === true ? 'check-circle' : 'radio-button-unchecked'}
                        size={20}
                        color={localFilters.active === true ? Colors.primary : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          localFilters.active === true && styles.optionTextActive,
                        ]}
                      >
                        Active
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        localFilters.active === false && styles.optionButtonActive,
                      ]}
                      onPress={() => toggleFilter('active', false)}
                    >
                      <MaterialIcons
                        name={localFilters.active === false ? 'check-circle' : 'radio-button-unchecked'}
                        size={20}
                        color={localFilters.active === false ? Colors.primary : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          localFilters.active === false && styles.optionTextActive,
                        ]}
                      >
                        Retired
                      </Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>

                {/* Country Filter */}
                <GlassCard style={styles.filterSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Country</Text>
                    {localFilters.country_code && (
                      <TouchableOpacity onPress={() => clearFilter('country_code')}>
                        <Text style={styles.clearLink}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView style={styles.optionsList} nestedScrollEnabled>
                    {countries.map((country) => (
                      <TouchableOpacity
                        key={country}
                        style={[
                          styles.optionButton,
                          localFilters.country_code === country && styles.optionButtonActive,
                        ]}
                        onPress={() => toggleFilter('country_code', country)}
                      >
                        <MaterialIcons
                          name={localFilters.country_code === country ? 'check-box' : 'check-box-outline-blank'}
                          size={20}
                          color={localFilters.country_code === country ? Colors.primary : Colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.optionText,
                            localFilters.country_code === country && styles.optionTextActive,
                          ]}
                        >
                          {country}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </GlassCard>

                {/* Family Filter */}
                <GlassCard style={styles.filterSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Family</Text>
                    {localFilters.family && (
                      <TouchableOpacity onPress={() => clearFilter('family')}>
                        <Text style={styles.clearLink}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView style={styles.optionsList} nestedScrollEnabled>
                    {families.map((family) => (
                      <TouchableOpacity
                        key={family}
                        style={[
                          styles.optionButton,
                          localFilters.family === family && styles.optionButtonActive,
                        ]}
                        onPress={() => toggleFilter('family', family)}
                      >
                        <MaterialIcons
                          name={localFilters.family === family ? 'check-box' : 'check-box-outline-blank'}
                          size={20}
                          color={localFilters.family === family ? Colors.primary : Colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.optionText,
                            localFilters.family === family && styles.optionTextActive,
                          ]}
                        >
                          {family}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </GlassCard>

                {/* Manufacturer/Provider Filter */}
                <GlassCard style={styles.filterSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Manufacturer</Text>
                    {localFilters.manufacturer && (
                      <TouchableOpacity onPress={() => clearFilter('manufacturer')}>
                        <Text style={styles.clearLink}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView style={styles.optionsList} nestedScrollEnabled>
                    {manufacturers.map((manufacturer) => (
                      <TouchableOpacity
                        key={manufacturer}
                        style={[
                          styles.optionButton,
                          localFilters.manufacturer === manufacturer && styles.optionButtonActive,
                        ]}
                        onPress={() => toggleFilter('manufacturer', manufacturer)}
                      >
                        <MaterialIcons
                          name={localFilters.manufacturer === manufacturer ? 'check-box' : 'check-box-outline-blank'}
                          size={20}
                          color={localFilters.manufacturer === manufacturer ? Colors.primary : Colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.optionText,
                            localFilters.manufacturer === manufacturer && styles.optionTextActive,
                          ]}
                        >
                          {manufacturer}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </GlassCard>
              </ScrollView>
            )}

            <View style={styles.footer}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <GradientButton
                title={`Apply${getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}`}
                onPress={handleApply}
                style={styles.applyButton}
                disabled={getActiveFilterCount() === 0}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  content: {
    maxHeight: 500,
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  clearLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionsList: {
    maxHeight: 200,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
    borderRadius: 8,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  optionText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  optionTextActive: {
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
    flex: 2,
  },
});






