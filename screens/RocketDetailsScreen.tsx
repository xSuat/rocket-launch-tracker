import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types/navigation';
import { launchAPI } from '../services/api';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EngineLayout } from '../components/EngineLayout';
import { RocketDetails, parseEngineLayout } from '../utils/rocketUtils';
import { Launch } from '../types';
import { formatLaunchDate } from '../utils/dateUtils';
import { GlassCard, StatusBadge } from '../components';
import { getStatusCategory } from '../utils/launchStatus';
import { Colors } from '../constants/colors';

type RocketDetailsRouteProp = RouteProp<RootStackParamList, 'RocketDetails'>;

// Helper function to extract image URL from object or string
const getImageUrl = (image: string | { image_url?: string | null; thumbnail_url?: string | null } | null | undefined): string | null => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.image_url || image.thumbnail_url || null;
};

// Helper function to check if URL is an API URL
const isApiUrl = (url: string): boolean => {
  return url.includes('thespacedevs.com') || url.includes('/api/');
};

// Helper function to get a valid non-API URL from launch data
const getValidInfoUrl = (launch: Launch): string | null => {
  // Check launch_service_provider.url
  const providerUrl = launch.launch_service_provider?.url;
  if (providerUrl && !isApiUrl(providerUrl)) {
    return providerUrl;
  }
  
  // Check rocket configuration URL
  const rocketUrl = launch.rocket?.configuration?.url;
  if (rocketUrl && !isApiUrl(rocketUrl)) {
    return rocketUrl;
  }
  
  // Check pad info_url
  if (launch.pad?.info_url && !isApiUrl(launch.pad.info_url)) {
    return launch.pad.info_url;
  }
  
  // Don't use launch.url as it's always the API URL
  return null;
};

export const RocketDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<RocketDetailsRouteProp>();
  const navigation = useNavigation();
  const { rocketId } = route.params;
  const [rocket, setRocket] = useState<any | null>(null);
  const [rocketDetails, setRocketDetails] = useState<RocketDetails | null>(null);
  const [associatedLaunches, setAssociatedLaunches] = useState<Launch[]>([]);
  const [loadingLaunches, setLoadingLaunches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  const loadRocket = useCallback(async (useCache = true) => {
    try {
      setError(null);
      setLoading(true);
      
      // Try to get rocket configuration
      let data = await launchAPI.getRocketConfiguration(rocketId, useCache);
      let isFromFallback = false;
      
      // If config not found, try to extract from launches
      if (!data || !data.id) {
        if (__DEV__) console.log('[RocketDetailsScreen] Rocket config not found, trying to extract from launches...');
        isFromFallback = true;
        
        // Try multiple approaches to get rocket data
        let foundData = false;
        let allMatchingLaunches: Launch[] = [];
        
        // Approach 1: Try to find launches by rocket config ID
        try {
          const launchesResponse = await launchAPI.getLaunchesByRocket(rocketId, useCache);
          allMatchingLaunches = launchesResponse.results || [];
          
          if (allMatchingLaunches.length > 0) {
            const firstLaunch = allMatchingLaunches[0];
            if (firstLaunch.rocket?.configuration) {
              // Extract comprehensive data from launches
              const launchDates = allMatchingLaunches
                .map(l => l.net ? new Date(l.net).getTime() : 0)
                .filter(d => d > 0)
                .sort((a, b) => a - b);
              
              // Find best image from launches (prefer launch images, then infographics, then mission patches)
              // Try to find the highest quality image available
              const launchWithImage = allMatchingLaunches.find(l => l.image);
              const launchWithInfographic = allMatchingLaunches.find(l => l.infographic);
              const launchWithMissionPatch = allMatchingLaunches.find(l => l.mission?.agencies?.[0]?.logo_url);
              const launchWithProviderLogo = allMatchingLaunches.find(l => l.launch_service_provider?.logo_url);
              
              const launchImageUrl = launchWithImage?.image ? getImageUrl(launchWithImage.image as any) : null;
              const firstLaunchImageUrl = firstLaunch.image ? getImageUrl(firstLaunch.image as any) : null;
              
              const bestImage = launchImageUrl || 
                               launchWithInfographic?.infographic ||
                               launchWithMissionPatch?.mission?.agencies?.[0]?.logo_url ||
                               firstLaunchImageUrl ||
                               launchWithProviderLogo?.launch_service_provider?.logo_url ||
                               firstLaunch.launch_service_provider?.logo_url;
              
              if (__DEV__) console.log('[RocketDetailsScreen] Image extraction:', {
                foundImage: !!bestImage,
                imageUrl: bestImage,
                totalLaunches: allMatchingLaunches.length,
                launchesWithImages: allMatchingLaunches.filter(l => l.image).length,
              });
              
              // Extract mission descriptions for more context
              const missionDescriptions = allMatchingLaunches
                .map(l => l.mission?.description)
                .filter(Boolean)
                .slice(0, 3); // Get first 3 unique descriptions
              
              // Get unique pad locations
              const padLocations = Array.from(new Set(
                allMatchingLaunches
                  .map(l => l.pad?.location?.name)
                  .filter(Boolean)
              ));
              
              // Calculate success rate from launch statuses
              const successCount = allMatchingLaunches.filter(l => {
                const statusAbbrev = l.status?.abbrev || '';
                return getStatusCategory(statusAbbrev) === 'success';
              }).length;
              const successRate = allMatchingLaunches.length > 0 
                ? Math.round((successCount / allMatchingLaunches.length) * 100) 
                : undefined;
              
              // Build comprehensive description
              let description = `Rocket information extracted from launch records. Data compiled from ${allMatchingLaunches.length} launch${allMatchingLaunches.length > 1 ? 'es' : ''}.`;
              if (missionDescriptions.length > 0) {
                description += `\n\n${missionDescriptions[0]}`;
              }
              if (padLocations.length > 0) {
                description += `\n\nLaunched from: ${padLocations.join(', ')}`;
              }
              
              data = {
                id: rocketId,
                name: firstLaunch.rocket.configuration.name,
                family: firstLaunch.rocket.configuration.family || '',
                full_name: firstLaunch.rocket.configuration.full_name,
                variant: firstLaunch.rocket.configuration.variant || '',
                image_url: bestImage || undefined,
                description: description,
                manufacturer: firstLaunch.launch_service_provider?.name || undefined,
                country_code: firstLaunch.launch_service_provider?.country_code || 
                             firstLaunch.pad?.location?.country_code || undefined,
                first_flight: launchDates.length > 0 ? new Date(launchDates[0]).toISOString() : undefined,
                last_flight: launchDates.length > 0 ? new Date(launchDates[launchDates.length - 1]).toISOString() : undefined,
                success_rate_pct: successRate,
                info_url: getValidInfoUrl(firstLaunch) || undefined,
                wiki_url: undefined, // wiki_url not available on Agency type
              };
              foundData = true;
              if (__DEV__) console.log('[RocketDetailsScreen] Using rocket data from launches by rocket ID');
            }
          }
        } catch (launchError) {
          if (__DEV__) console.log('[RocketDetailsScreen] Could not extract from launches by rocket ID:', launchError);
        }
        
        // Approach 2: Search upcoming and past launches for this rocket
        if (!foundData) {
          try {
            const [upcomingResponse, pastResponse] = await Promise.allSettled([
              launchAPI.getUpcomingLaunches({ limit: 100 }, useCache),
              launchAPI.getPastLaunches({ limit: 100, ordering: '-net' }, useCache)
            ]);
            
            const allLaunches = [
              ...(upcomingResponse.status === 'fulfilled' ? upcomingResponse.value.results || [] : []),
              ...(pastResponse.status === 'fulfilled' ? pastResponse.value.results || [] : [])
            ];
            
            // Find all launches with matching rocket config ID
            allMatchingLaunches = allLaunches.filter(
              launch => launch.rocket?.configuration?.id === rocketId
            );
            
            if (allMatchingLaunches.length > 0) {
              const firstLaunch = allMatchingLaunches[0];
              if (firstLaunch.rocket?.configuration) {
                const launchDates = allMatchingLaunches
                  .map(l => l.net ? new Date(l.net).getTime() : 0)
                  .filter(d => d > 0)
                  .sort((a, b) => a - b);
                
                const launchWithImage = allMatchingLaunches.find(l => l.image);
                const launchWithInfographic = allMatchingLaunches.find(l => l.infographic);
                const launchWithMissionPatch = allMatchingLaunches.find(l => l.mission?.agencies?.[0]?.logo_url);
                const launchWithProviderLogo = allMatchingLaunches.find(l => l.launch_service_provider?.logo_url);
                
                const launchImageUrl = launchWithImage?.image ? getImageUrl(launchWithImage.image as any) : null;
                const firstLaunchImageUrl = firstLaunch.image ? getImageUrl(firstLaunch.image as any) : null;
                
                const bestImage = launchImageUrl || 
                                 launchWithInfographic?.infographic ||
                                 launchWithMissionPatch?.mission?.agencies?.[0]?.logo_url ||
                                 firstLaunchImageUrl ||
                                 launchWithProviderLogo?.launch_service_provider?.logo_url ||
                                 firstLaunch.launch_service_provider?.logo_url;
                
                if (__DEV__) console.log('[RocketDetailsScreen] Image extraction (search):', {
                  foundImage: !!bestImage,
                  imageUrl: bestImage,
                  totalLaunches: allMatchingLaunches.length,
                });
                
                const missionDescriptions = allMatchingLaunches
                  .map(l => l.mission?.description)
                  .filter(Boolean)
                  .slice(0, 3);
                
                const padLocations = Array.from(new Set(
                  allMatchingLaunches
                    .map(l => l.pad?.location?.name)
                    .filter(Boolean)
                ));
                
                const successCount = allMatchingLaunches.filter(l => {
                  const statusAbbrev = l.status?.abbrev || '';
                  return getStatusCategory(statusAbbrev) === 'success';
                }).length;
                const successRate = allMatchingLaunches.length > 0 
                  ? Math.round((successCount / allMatchingLaunches.length) * 100) 
                  : undefined;
                
                let description = `Rocket information extracted from launch records. Data compiled from ${allMatchingLaunches.length} launch${allMatchingLaunches.length > 1 ? 'es' : ''}.`;
                if (missionDescriptions.length > 0) {
                  description += `\n\n${missionDescriptions[0]}`;
                }
                if (padLocations.length > 0) {
                  description += `\n\nLaunched from: ${padLocations.join(', ')}`;
                }
                
                data = {
                  id: rocketId,
                  name: firstLaunch.rocket.configuration.name,
                  family: firstLaunch.rocket.configuration.family || '',
                  full_name: firstLaunch.rocket.configuration.full_name,
                  variant: firstLaunch.rocket.configuration.variant || '',
                  image_url: bestImage || undefined,
                  description: description,
                  manufacturer: firstLaunch.launch_service_provider?.name || undefined,
                  country_code: firstLaunch.launch_service_provider?.country_code || 
                               firstLaunch.pad?.location?.country_code || undefined,
                  first_flight: launchDates.length > 0 ? new Date(launchDates[0]).toISOString() : undefined,
                  last_flight: launchDates.length > 0 ? new Date(launchDates[launchDates.length - 1]).toISOString() : undefined,
                  success_rate_pct: successRate,
                  info_url: getValidInfoUrl(firstLaunch) || undefined,
                  wiki_url: undefined, // wiki_url not available on Agency type
                };
                foundData = true;
                if (__DEV__) console.log('[RocketDetailsScreen] Using rocket data from search in launches');
              }
            }
          } catch (searchError) {
            if (__DEV__) console.log('[RocketDetailsScreen] Could not search launches:', searchError);
          }
        }
      }
      
      // If still no data, create minimal data structure to show something
      if (!data || !data.id) {
        // Show partial data instead of error
        data = {
          id: rocketId,
          name: `Rocket #${rocketId}`,
          family: '',
          full_name: `Rocket #${rocketId}`,
          variant: '',
          description: 'Rocket configuration details are not available in the database. This may be a new or unlisted rocket.',
        };
        isFromFallback = true;
        if (__DEV__) console.log('[RocketDetailsScreen] Using minimal rocket data structure');
      }
      
      setRocket(data);
      setIsFallbackData(isFromFallback);

      const basicDetails: RocketDetails = {
        id: data.id,
        name: data.name,
        family: data.family || '',
        full_name: data.full_name || data.name,
        variant: data.variant,
        description: data.description,
        min_stage: data.min_stage,
        max_stage: data.max_stage,
        length: data.length,
        diameter: data.diameter,
        launch_mass: data.launch_mass,
        leo_capacity: data.leo_capacity,
        gto_capacity: data.gto_capacity,
        to_thrust: data.to_thrust,
        image_url: data.image_url,
        info_url: data.info_url,
        wiki_url: data.wiki_url,
        first_flight: data.first_flight,
        last_flight: data.last_flight,
        success_rate_pct: data.success_rate_pct,
      };
      setRocketDetails(basicDetails);
      
      // Store manufacturer and country_code in rocket object for display
      setRocket({
        ...data,
        manufacturer: data.manufacturer,
        country_code: data.country_code,
      });
      
      // Log image URL for debugging
      if (__DEV__) {
      if (data.image_url) {
        console.log('[RocketDetailsScreen] Rocket image URL set:', data.image_url);
      } else {
        console.log('[RocketDetailsScreen] No rocket image URL available');
        }
      }
      
      // Reset image error when rocket data changes
      setHeroImageError(false);
      
    } catch (err: any) {
      if (__DEV__) console.error('[RocketDetailsScreen] Error loading rocket details:', err);
      setError(err.message || 'Failed to load rocket details');
    } finally {
      setLoading(false);
    }
  }, [rocketId]);

  const loadAssociatedLaunches = useCallback(async (configId: number) => {
    try {
      setLoadingLaunches(true);
      const response = await launchAPI.getLaunchesByRocket(configId, true);
      setAssociatedLaunches(response.results || []);
    } catch (err: any) {
      if (__DEV__) console.log('Error loading associated launches:', err);
      setAssociatedLaunches([]);
    } finally {
      setLoadingLaunches(false);
    }
  }, []);

  useEffect(() => {
    loadRocket();
  }, [loadRocket]);

  useEffect(() => {
    if (rocket?.id) {
      loadAssociatedLaunches(rocket.id);
    }
  }, [rocket?.id, loadAssociatedLaunches]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // Silently fail - link opening is optional
    });
  };

  if (loading) {
    return <LoadingState message="Loading rocket details..." />;
  }

  if (error || !rocket) {
    return (
      <ErrorState 
        message={error || 'Rocket not found'} 
        onRetry={() => loadRocket(false)} 
      />
    );
  }

  return (
    <LinearGradient
      colors={Colors.backgroundGradient as any}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: Math.max(insets.top, 16) }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {rocketDetails?.image_url && !heroImageError ? (
            <Image 
              source={{ uri: rocketDetails.image_url }} 
              style={styles.heroImage} 
              resizeMode="cover"
              onError={(error) => {
                if (__DEV__) console.log('[RocketDetailsScreen] Hero image load error:', error.nativeEvent.error, 'URL:', rocketDetails.image_url);
                setHeroImageError(true);
              }}
              onLoad={() => {
                if (__DEV__) console.log('[RocketDetailsScreen] Hero image loaded successfully:', rocketDetails.image_url);
                setHeroImageError(false);
              }}
            />
          ) : (
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary]}
              style={styles.heroImagePlaceholder}
            >
              <MaterialIcons name="rocket-launch" size={80} color={Colors.text} />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.heroGradient}
          />
        </View>
        
        {/* Title Card */}
        <View style={styles.titleCardContainer}>
          <GlassCard style={styles.titleCard}>
            <Text style={styles.rocketName}>{rocketDetails?.full_name || rocket.name}</Text>
            <Text style={styles.rocketSubtitle}>
              {rocketDetails?.family || rocket.family || 'Rocket'}
            </Text>
            <View style={styles.badgesRow}>
              {rocket.active !== undefined && (
                <StatusBadge 
                  status={rocket.active ? 'Active' : 'Retired'} 
                  size="medium"
                />
              )}
              {rocketDetails?.engines?.layout && (
                <StatusBadge 
                  status="Reusable" 
                  size="medium"
                />
              )}
            </View>
          </GlassCard>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>Total Flights</Text>
            <Text style={styles.statValue}>{associatedLaunches.length}</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>Success Rate</Text>
            <Text style={[styles.statValue, styles.statValueSuccess]}>
              {rocketDetails?.success_rate_pct !== undefined 
                ? `${rocketDetails.success_rate_pct}%`
                : 'N/A'}
            </Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>Successful Landings</Text>
            <Text style={styles.statValue}>
              {associatedLaunches.filter(l => {
                const statusAbbrev = l.status?.abbrev || '';
                return getStatusCategory(statusAbbrev) === 'success';
              }).length}
            </Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>First Flight</Text>
            <Text style={styles.statValue}>
              {rocketDetails?.first_flight 
                ? new Date(rocketDetails.first_flight).getFullYear()
                : 'N/A'}
            </Text>
          </GlassCard>
        </View>

        {/* Technical Specs */}
        {rocketDetails && (
          <GlassCard style={styles.specsCard}>
            <Text style={styles.sectionTitle}>Technical Specifications</Text>
            {rocketDetails.length ? (
              <>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Height</Text>
                  <Text style={styles.specValue}>{rocketDetails.length.toFixed(1)} m</Text>
                </View>
                <View style={styles.specDivider} />
              </>
            ) : null}
            {rocketDetails.diameter ? (
              <>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Diameter</Text>
                  <Text style={styles.specValue}>{rocketDetails.diameter.toFixed(2)} m</Text>
                </View>
                <View style={styles.specDivider} />
              </>
            ) : null}
            {rocketDetails.launch_mass ? (
              <>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Mass</Text>
                  <Text style={styles.specValue}>{(rocketDetails.launch_mass / 1000).toFixed(1)} t</Text>
                </View>
                <View style={styles.specDivider} />
              </>
            ) : null}
            {rocketDetails.leo_capacity ? (
              <>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>LEO Capacity</Text>
                  <Text style={styles.specValue}>{(rocketDetails.leo_capacity / 1000).toFixed(1)} t</Text>
                </View>
                <View style={styles.specDivider} />
              </>
            ) : null}
            {rocketDetails.gto_capacity ? (
              <>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>GTO Capacity</Text>
                  <Text style={styles.specValue}>{(rocketDetails.gto_capacity / 1000).toFixed(1)} t</Text>
                </View>
                <View style={styles.specDivider} />
              </>
            ) : null}
            {rocketDetails.engines?.number ? (
              <>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Engines</Text>
                  <Text style={styles.specValue}>
                    {rocketDetails.engines.number}× {rocketDetails.engines.type || 'Unknown'}
                  </Text>
                </View>
              </>
            ) : null}
          </GlassCard>
        )}

        {/* Description */}
        {rocketDetails?.description && (
          <GlassCard style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{rocketDetails.description}</Text>
          </GlassCard>
        )}

        {rocketDetails?.engines && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Engine Layout</Text>
            <EngineLayout layout={parseEngineLayout(rocketDetails!)} />
          </GlassCard>
        )}

        {rocketDetails?.payload_weights && rocketDetails.payload_weights.length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Payload Capacity</Text>
            {rocketDetails.payload_weights.map((payload, index) => (
              <InfoRow
                key={payload.id || index}
                label={payload.name}
                value={`${(payload.kg / 1000).toFixed(1)} t (${(payload.lb / 1000).toFixed(1)} klb)`}
              />
            ))}
          </GlassCard>
        )}

        {associatedLaunches.length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Associated Launches</Text>
            {associatedLaunches.slice(0, 10).map((launch) => (
              <TouchableOpacity
                key={launch.id}
                style={styles.launchItem}
                onPress={() => {
                  (navigation as any).navigate('LaunchDetails', { launchId: launch.id });
                }}
              >
                <View style={styles.launchItemContent}>
                  <Text style={styles.launchName}>{launch.name}</Text>
                  <Text style={styles.launchDate}>
                    {formatLaunchDate(launch.net)}
                  </Text>
                  {launch.status && (
                    <StatusBadge 
                      status={launch.status.abbrev as any} 
                      size="small"
                    />
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
            {associatedLaunches.length > 10 && (
              <Text style={styles.moreLaunchesText}>
                +{associatedLaunches.length - 10} more launches
              </Text>
            )}
          </GlassCard>
        )}

        {(rocketDetails?.info_url || rocketDetails?.wiki_url) && (
          <View style={styles.actions}>
            {rocketDetails.info_url && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openLink(rocketDetails.info_url!)}
              >
                <Text style={styles.actionButtonText}>More Info</Text>
              </TouchableOpacity>
            )}
            {rocketDetails.wiki_url && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => openLink(rocketDetails.wiki_url!)}
              >
                <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                  Wikipedia
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.cardSolid,
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  titleCardContainer: {
    marginTop: -32,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  titleCard: {
    padding: 24,
  },
  rocketName: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  rocketSubtitle: {
    color: Colors.textTertiary,
    fontSize: 16,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 16,
    minHeight: 100,
  },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  statValueSuccess: {
    color: Colors.successLight,
  },
  specsCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  specLabel: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  specValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  specDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  descriptionCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: Colors.primary,
  },
  launchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
  },
  launchItemContent: {
    flex: 1,
  },
  launchName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  launchDate: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  moreLaunchesText: {
    color: Colors.primary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

