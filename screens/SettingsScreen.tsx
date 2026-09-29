import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { RootStackParamList } from '../types/navigation';
import { useApp } from '../context/AppContext';
import { getAvailableMapApps, MAP_APPS } from '../utils/mapUtils';
import { PageHeader, GlassCard } from '../components';
import { Colors } from '../constants/colors';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const APP_VERSION = '1.0.0';

interface SettingSectionProps {
  title: string;
  description?: string;
  icon: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, icon, children }) => (
  <View style={styles.sectionWrapper}>
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionIconWrapper}>
        <MaterialCommunityIcons name={icon as any} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {description && (
      <Text style={styles.sectionDescription}>{description}</Text>
    )}
    {children}
  </View>
);

interface SettingOptionProps {
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  selected?: boolean;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showCheckmark?: boolean;
}

const SettingOption: React.FC<SettingOptionProps> = ({
  title,
  subtitle,
  icon,
  iconColor = Colors.primary,
  selected = false,
  onPress,
  rightComponent,
  showCheckmark = true,
}) => (
  <GlassCard
    style={[styles.optionCard, selected && styles.optionCardSelected]}
    onPress={onPress}
    intensity={selected ? 30 : 20}
  >
    <View style={styles.optionContent}>
      <View style={[styles.optionIcon, selected && styles.optionIconSelected, iconColor && { backgroundColor: `${iconColor}20` }]}>
        <MaterialCommunityIcons 
          name={icon as any} 
          size={20} 
          color={selected ? iconColor : Colors.textMuted} 
        />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightComponent || (selected && showCheckmark && (
        <View style={styles.checkmark}>
          <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
        </View>
      ))}
    </View>
  </GlassCard>
);

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const {
    defaultMapApp,
    setDefaultMapApp,
    apiEnvironment,
    setApiEnvironment,
    showDataSourceLabels,
    setShowDataSourceLabels,
  } = useApp();
  const [availableApps, setAvailableApps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableApps();
  }, []);

  const loadAvailableApps = async () => {
    setLoading(true);
    try {
      const apps = await getAvailableMapApps();
      setAvailableApps(apps.map((app) => app.id));
    } catch (error) {
      if (__DEV__) console.error('Error loading map apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapAppSelect = async (appId: string) => {
    if (defaultMapApp === appId) {
      await setDefaultMapApp(null);
    } else {
      await setDefaultMapApp(appId);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. The app will need to reload data from the internet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Clear AsyncStorage cache keys
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => 
                key.startsWith('launch_cache_') || 
                key.startsWith('events_cache_') || 
                key.startsWith('filter_options_')
              );
              await AsyncStorage.multiRemove(cacheKeys);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const headerHeight = Math.max(insets.top, 16) + 90;

  return (
    <LinearGradient
      colors={Colors.backgroundGradient as any}
      style={styles.container}
    >
      {/* Fixed Blur Header Background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={40}
          tint="dark"
          style={[styles.blurHeader, { height: headerHeight }]}
        />
      ) : (
        <View style={[styles.blurHeader, { height: headerHeight, backgroundColor: 'rgba(0, 0, 0, 0.8)' }]} />
      )}

      {/* Header Section */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={25} tint="dark" style={styles.backButtonBlur}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
            </BlurView>
          ) : (
            <View style={styles.backButtonAndroid}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your preferences</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        style={{ marginTop: headerHeight }}
        showsVerticalScrollIndicator={false}
      >
        {/* General Category */}
        <GlassCard style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>General</Text>
          
          <SettingSection
            title="Map Application"
            description="Choose your default map application for opening launch locations"
            icon="map"
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <View style={styles.optionsContainer}>
                <SettingOption
                  title="Ask each time"
                  subtitle="Choose when opening maps"
                  icon="help-circle"
                  selected={!defaultMapApp}
                  onPress={() => setDefaultMapApp(null)}
                />
                {MAP_APPS.map((app) => {
                  const isAvailable = availableApps.includes(app.id);
                  const isSelected = defaultMapApp === app.id;
                  if (!isAvailable) return null;

                  const iconMap: Record<string, string> = {
                    'google-maps': 'google-maps',
                    'apple-maps': 'map-marker',
                    'waze': 'map',
                  };

                  return (
                    <SettingOption
                      key={app.id}
                      title={app.name}
                      subtitle={isSelected ? 'Default map app' : 'Tap to set as default'}
                      icon={iconMap[app.id] || 'map-marker'}
                      selected={isSelected}
                      onPress={() => handleMapAppSelect(app.id)}
                    />
                  );
                })}
              </View>
            )}
          </SettingSection>

          <SettingSection
            title="Data Source Labels"
            description="Show which API each item comes from"
            icon="label"
          >
            <SettingOption
              title={showDataSourceLabels ? 'Enabled' : 'Disabled'}
              subtitle={showDataSourceLabels
                ? 'Data source labels are visible'
                : 'Data source labels are hidden'}
              icon={showDataSourceLabels ? 'label' : 'label-outline'}
              selected={showDataSourceLabels}
              rightComponent={
                <Switch
                  value={showDataSourceLabels}
                  onValueChange={setShowDataSourceLabels}
                  trackColor={{ false: Colors.borderSolid, true: Colors.primary }}
                  thumbColor={showDataSourceLabels ? Colors.text : Colors.textMuted}
                />
              }
              showCheckmark={false}
            />
          </SettingSection>
        </GlassCard>

        {/* Advanced Category */}
        <GlassCard style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Advanced</Text>
          
          <SettingSection
            title="API Environment"
            description={`Currently using ${apiEnvironment === 'dev' ? 'development' : 'production'} API`}
            icon="cog"
          >
            <View style={styles.optionsContainer}>
              <SettingOption
                title="Development"
                subtitle="lldev.thespacedevs.com"
                icon="wrench"
                selected={apiEnvironment === 'dev'}
                onPress={() => setApiEnvironment('dev')}
              />
              <SettingOption
                title="Production"
                subtitle="ll.thespacedevs.com"
                icon="rocket-launch"
                selected={apiEnvironment === 'prod'}
                onPress={() => setApiEnvironment('prod')}
              />
            </View>
          </SettingSection>

          <SettingSection
            title="Data Management"
            description="Manage cached data and storage"
            icon="database"
          >
            <SettingOption
              title="Clear Cache"
              subtitle="Remove all cached data"
              icon="delete-outline"
              iconColor={Colors.warning}
              onPress={handleClearCache}
              showCheckmark={false}
            />
          </SettingSection>
        </GlassCard>

        {/* About Category */}
        <GlassCard style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>About</Text>
          
          <SettingSection
            title="App Information"
            description="Version and build details"
            icon="information"
          >
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>{APP_VERSION}</Text>
              </View>
              {Constants.expoConfig?.version && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Build</Text>
                  <Text style={styles.infoValue}>{Constants.expoConfig.version}</Text>
                </View>
              )}
            </View>
          </SettingSection>

          <SettingSection
            title="Data Sources"
            description="APIs and services used by this app"
            icon="api"
          >
            <View style={styles.apiListContainer}>
              {[
                { name: 'Launch Library 2', url: 'll.thespacedevs.com', icon: 'rocket-launch', description: 'Rocket launch data, schedules, and mission details' },
                { name: 'NASA NeoWs', url: 'api.nasa.gov', icon: 'star', description: 'Near Earth Object data and asteroid close approaches' },
                { name: 'SpaceX API', url: 'api.spacexdata.com', icon: 'rocket', description: 'SpaceX rocket specifications and mission data' },
              ].map((api, index) => (
                <View key={index} style={styles.apiCard}>
                  <View style={styles.apiCardHeader}>
                    <MaterialCommunityIcons name={api.icon as any} size={18} color={Colors.primary} />
                    <Text style={styles.apiCardTitle}>{api.name}</Text>
                  </View>
                  <Text style={styles.apiCardUrl}>{api.url}</Text>
                  <Text style={styles.apiCardDescription}>{api.description}</Text>
                </View>
              ))}
            </View>
          </SettingSection>
        </GlassCard>

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 11,
    gap: 16,
  },
  backButton: {
    marginTop: 4,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backButtonAndroid: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  categoryCard: {
    marginBottom: 24,
    padding: 20,
  },
  categoryTitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  sectionWrapper: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  sectionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionDescription: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    marginLeft: 42,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionIconSelected: {
    borderColor: Colors.primary,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  checkmark: {
    marginLeft: 8,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  apiListContainer: {
    gap: 10,
  },
  apiCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.cardSolid,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  apiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  apiCardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  apiCardUrl: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 26,
  },
  apiCardDescription: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 26,
  },
  footer: {
    height: 20,
  },
});
