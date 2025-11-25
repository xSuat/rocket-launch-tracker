import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getAvailableMapApps, MapApp, openMapApp } from '../utils/mapUtils';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants/colors';

interface MapSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: string;
  longitude: string;
  onMapSelected?: (appId: string, setAsDefault: boolean) => void;
}

const getMapAppIcon = (appId: string): string => {
  switch (appId) {
    case 'google-maps':
      return 'google-maps';
    case 'apple-maps':
      return 'map-marker';
    case 'waze':
      return 'map';
    default:
      return 'map-marker';
  }
};

export const MapSelectionModal: React.FC<MapSelectionModalProps> = ({
  visible,
  onClose,
  latitude,
  longitude,
  onMapSelected,
}) => {
  const [availableApps, setAvailableApps] = useState<MapApp[]>([]);
  const [loading, setLoading] = useState(true);
  const { defaultMapApp, setDefaultMapApp } = useApp();

  useEffect(() => {
    if (visible) {
      setAvailableApps([]);
      setLoading(true);
      loadAvailableApps();
    }
  }, [visible]);

  const loadAvailableApps = async () => {
    setLoading(true);
    try {
      const apps = await getAvailableMapApps();
      if (apps.length === 0) {
        const googleMapsApp: MapApp = {
          id: 'google-maps',
          name: 'Google Maps',
          scheme: Platform.OS === 'ios' ? 'comgooglemaps://' : 'geo:',
          url: (lat: string, lng: string) => `https://maps.google.com/?q=${lat},${lng}`,
        };
        setAvailableApps([googleMapsApp]);
      } else {
        setAvailableApps(apps);
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading map apps:', error);
      const googleMapsApp: MapApp = {
        id: 'google-maps',
        name: 'Google Maps',
        scheme: Platform.OS === 'ios' ? 'comgooglemaps://' : 'geo:',
        url: (lat: string, lng: string) => `https://maps.google.com/?q=${lat},${lng}`,
      };
      setAvailableApps([googleMapsApp]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApp = async (app: MapApp) => {
    const success = await openMapApp(app.id, latitude, longitude);
    if (success) {
      if (onMapSelected) {
        onMapSelected(app.id, false);
      }
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <Header onClose={onClose} />
                <Content 
                  loading={loading}
                  availableApps={availableApps}
                  defaultMapApp={defaultMapApp}
                  onSelectApp={handleSelectApp}
                />
              </View>
            </BlurView>
          ) : (
            <LinearGradient
              colors={[Colors.cardSolid, Colors.card]}
              style={styles.modal}
            >
              <View style={styles.modalContent}>
                <Header onClose={onClose} />
                <Content 
                  loading={loading}
                  availableApps={availableApps}
                  defaultMapApp={defaultMapApp}
                  onSelectApp={handleSelectApp}
                />
              </View>
            </LinearGradient>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const Header: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <View style={styles.headerIconContainer}>
        <MaterialCommunityIcons name="map-marker" size={22} color={Colors.primary} />
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title}>Open in Maps</Text>
        <Text style={styles.subtitle}>Select your preferred map app</Text>
      </View>
    </View>
    <TouchableOpacity 
      onPress={onClose} 
      style={styles.closeButton} 
      activeOpacity={0.7}
    >
      <MaterialIcons name="close" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  </View>
);

interface ContentProps {
  loading: boolean;
  availableApps: MapApp[];
  defaultMapApp: string | null;
  onSelectApp: (app: MapApp) => void;
}

const Content: React.FC<ContentProps> = ({ loading, availableApps, defaultMapApp, onSelectApp }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading map apps...</Text>
      </View>
    );
  }

  if (availableApps.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="map-marker-off" size={56} color={Colors.textMuted} />
        <Text style={styles.emptyText}>No map apps available</Text>
        <Text style={styles.emptySubtext}>Google Maps web will be used</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {availableApps.map((app) => {
        const isDefault = defaultMapApp === app.id;
        const iconName = getMapAppIcon(app.id);
        
        return (
          <MapOption
            key={app.id}
            app={app}
            iconName={iconName}
            isDefault={isDefault}
            onPress={() => onSelectApp(app)}
          />
        );
      })}
    </View>
  );
};

interface MapOptionProps {
  app: MapApp;
  iconName: string;
  isDefault: boolean;
  onPress: () => void;
}

const MapOption: React.FC<MapOptionProps> = ({ app, iconName, isDefault, onPress }) => (
  <TouchableOpacity
    style={[styles.optionItem, isDefault && styles.optionItemActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={isDefault 
        ? [`${Colors.primary}20`, `${Colors.primary}10`]
        : [Colors.cardSolid, Colors.cardSolid]
      }
      style={styles.optionGradient}
    >
      <View style={styles.optionContent}>
        <View style={[styles.iconWrapper, isDefault && styles.iconWrapperActive]}>
          <MaterialCommunityIcons 
            name={iconName as any} 
            size={28} 
            color={isDefault ? Colors.primary : Colors.text} 
          />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, isDefault && styles.optionTitleActive]}>
            {app.name}
          </Text>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <MaterialIcons name="check-circle" size={14} color={Colors.primary} />
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <MaterialIcons 
          name="chevron-right" 
          size={20} 
          color={isDefault ? Colors.primary : Colors.textMuted} 
        />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 420,
  },
  modalBlur: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  modal: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 15,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 6,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingTop: 12,
  },
  optionItem: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionItemActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionGradient: {
    padding: 18,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrapperActive: {
    backgroundColor: `${Colors.primary}25`,
    borderColor: Colors.primary,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  optionTitleActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  defaultText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
});
