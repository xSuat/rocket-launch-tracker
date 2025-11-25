import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Launch } from '../types';
import { formatLaunchDateShort, getTimeUntilLaunch } from '../utils/dateUtils';
import { CountdownTimer } from './CountdownTimer';
import { launchAPI } from '../services/api';
import { GlassCard, StatusBadge, GradientButton } from './ui';
import { Colors } from '../constants/colors';

interface LaunchCardProps {
  launch: Launch;
  onPress: () => void;
  showCountdown?: boolean;
}

// Helper function to extract image URL from object or string
const getImageUrl = (image: string | { image_url?: string } | null | undefined): string | null => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.image_url) return image.image_url;
  return null;
};

export const LaunchCard = React.memo<LaunchCardProps>(({
  launch,
  onPress,
  showCountdown = false,
}) => {
  const [rocketImageUrl, setRocketImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Determine image URL with fallback chain: rocket image → launch image → mission patch → agency logo
  const launchImageUrl = getImageUrl(launch.image as any);
  const imageUrl = rocketImageUrl || launchImageUrl || launch.mission?.agencies?.[0]?.logo_url || null;
  
  // Debug logging (development only)
  useEffect(() => {
    if (__DEV__) {
      // Debug logging can be added here if needed
    }
  }, [imageUrl, launch.name]);

  useEffect(() => {
    // Reset image error when image URL changes
    setImageError(false);
    setImageLoading(true);
  }, [imageUrl]);

  useEffect(() => {
    // Fetch rocket configuration to get rocket image
    const fetchRocketImage = async () => {
      if (!launch.rocket?.configuration?.id) {
        setImageLoading(false);
        return;
      }

      try {
        const rocketConfig = await launchAPI.getRocketConfiguration(
          launch.rocket.configuration.id,
          true // Use cache
        );

        if (rocketConfig?.image_url) {
          setRocketImageUrl(rocketConfig.image_url);
        } else {
          // No rocket image available
        }
      } catch (error) {
        // Silently fail - we'll use fallback images
      } finally {
        setImageLoading(false);
      }
    };

    fetchRocketImage();
  }, [launch.rocket?.configuration?.id]);

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.wrapper}>
      <GlassCard style={styles.card} onPress={onPress} padding={20}>
        <View style={styles.content}>
          {/* Icon/Image */}
          <View style={styles.iconContainer}>
            {imageUrl && !imageError ? (
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.icon} 
                resizeMode="cover"
                onError={(error) => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoad={() => {
                  setImageError(false);
                  setImageLoading(false);
                }}
              />
            ) : (
              <LinearGradient
                colors={[Colors.primary, Colors.pink]}
                style={styles.iconPlaceholder}
              >
                <MaterialIcons name="rocket-launch" size={32} color={Colors.text} />
              </LinearGradient>
            )}
          </View>

          {/* Info Section */}
          <View style={styles.info}>
            <View style={styles.headerRow}>
              <View style={styles.titleSection}>
                <Text style={styles.missionName} numberOfLines={1}>
                  {launch.name}
                </Text>
                <Text style={styles.rocketProvider}>
                  {launch.rocket.configuration.full_name} • {launch.launch_service_provider.name}
                </Text>
              </View>
              <StatusBadge status={launch.status.abbrev as any} size="small" />
            </View>

            {/* Time and Location */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="access-time" size={16} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {showCountdown ? formatTime(launch.net) : getTimeUntilLaunch(launch.net)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={16} color={Colors.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {launch.pad.location.name}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.detailsButton}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.detailsButtonText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bellButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="notifications" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GlassCard>
      {showCountdown && (
        <View style={styles.countdownWrapper}>
          <CountdownTimer 
            launchDate={launch.net} 
            size="medium" 
            format="compact"
            showIcon={true}
            animated={true}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 24,
    marginVertical: 12,
  },
  card: {
    margin: 0,
  },
  content: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 100,
  },
  iconContainer: {
    flexShrink: 0,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.cardSolid,
  },
  iconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  titleSection: {
    flex: 1,
    minWidth: 0,
  },
  missionName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  rocketProvider: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
});

