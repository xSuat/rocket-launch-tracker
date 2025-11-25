import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Launch } from '../types';
import { RootStackParamList } from '../types/navigation';
import { launchAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { useLaunch } from '../hooks';
import { formatLaunchDate, getTimeUntilLaunch } from '../utils/dateUtils';
import { CountdownTimer } from '../components/CountdownTimer';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { MapSelectionModal } from '../components/MapSelectionModal';
import { openLocationInMaps } from '../utils/mapUtils';
import { ReminderModal } from '../components/ReminderModal';
import { MissionTimeline } from '../components/MissionTimeline';
import { EngineLayout } from '../components/EngineLayout';
import { RocketDetails, parseEngineLayout } from '../utils/rocketUtils';
import { GlassCard, StatusBadge, GradientButton, DataSourceLabel } from '../components';
import { isLaunchUpcoming, getStatusCategory, getStatusConfig } from '../components/ui/StatusBadge';
import { Colors } from '../constants/colors';

type LaunchDetailsRouteProp = RouteProp<RootStackParamList, 'LaunchDetails'>;

// Helper function to extract image URL from object or string
const getImageUrl = (image: string | { image_url?: string } | null | undefined): string | null => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.image_url) return image.image_url;
  return null;
};

export const LaunchDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<LaunchDetailsRouteProp>();
  const navigation = useNavigation();
  const { launchId } = route.params;
  const { isFavorite, addFavorite, removeFavorite, defaultMapApp, toggleProviderFollow, isProviderFollowed } = useApp();
  
  const { launch, loading: launchLoading, error: launchError, refetch } = useLaunch(launchId);
  
  const [rocketDetails, setRocketDetails] = useState<RocketDetails | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'status' | 'timeline'>('details');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  const favorite = isFavorite(launchId);

  // Effect to set initial hero image when launch loads
  useEffect(() => {
    if (launch) {
        const launchImageUrl = getImageUrl(launch.image as any);
        const initialHeroImage = launchImageUrl || launch.mission?.agencies?.[0]?.logo_url || null;
        setHeroImageUrl(initialHeroImage);
    }
  }, [launch]);

  // Effect to load rocket details
  useEffect(() => {
    if (launch?.rocket?.configuration?.id) {
        const configId = launch.rocket.configuration.id;
        const providerName = launch.launch_service_provider?.name;
        const rocketName = launch.rocket.configuration.name;

        // Use Promise.allSettled to load rocket config and SpaceX data in parallel
        Promise.allSettled([
          launchAPI.getRocketConfiguration(configId),
          providerName === 'SpaceX' 
            ? launchAPI.getSpaceXRocketData(rocketName.toLowerCase().replace(/\s+/g, '-'))
            : Promise.resolve(null)
        ]).then(([rocketConfigResult, spacexDataResult]) => {
          const rocketConfig = rocketConfigResult.status === 'fulfilled' ? rocketConfigResult.value : null;
          const spacexData = spacexDataResult.status === 'fulfilled' ? spacexDataResult.value : null;
          
          if (!rocketConfig) return;
          
          // Combine LL2 and SpaceX data
          const rocketImageUrl = rocketConfig.image_url || spacexData?.flickr_images?.[0] || null;
          
          const combined: RocketDetails = {
            id: rocketConfig.id,
            name: rocketConfig.name,
            family: rocketConfig.family || '',
            full_name: rocketConfig.full_name || rocketConfig.name,
            variant: rocketConfig.variant,
            description: rocketConfig.description,
            min_stage: rocketConfig.min_stage,
            max_stage: rocketConfig.max_stage,
            length: rocketConfig.length || spacexData?.height?.meters,
            diameter: rocketConfig.diameter || spacexData?.diameter?.meters,
            launch_mass: rocketConfig.launch_mass || spacexData?.mass?.kg,
            leo_capacity: rocketConfig.leo_capacity || spacexData?.payload_weights?.find((p: any) => p.id === 'leo')?.kg,
            gto_capacity: rocketConfig.gto_capacity || spacexData?.payload_weights?.find((p: any) => p.id === 'gto')?.kg,
            to_thrust: rocketConfig.to_thrust || spacexData?.first_stage?.thrust_sea_level?.kN,
            image_url: rocketImageUrl,
            info_url: rocketConfig.info_url,
            wiki_url: rocketConfig.wiki_url,
            first_flight: rocketConfig.first_flight || spacexData?.first_flight,
            boosters: spacexData?.boosters,
            cost_per_launch: spacexData?.cost_per_launch,
            success_rate_pct: spacexData?.success_rate_pct,
            stages: spacexData?.stages,
            engines: spacexData?.engines ? {
              number: spacexData.engines.number,
              type: spacexData.engines.type,
              version: spacexData.engines.version,
              layout: spacexData.engines.layout,
              isp: spacexData.engines.isp,
              thrust_sea_level: spacexData.engines.thrust_sea_level,
              thrust_vacuum: spacexData.engines.thrust_vacuum,
            } : undefined,
            landing_legs: spacexData?.landing_legs,
            payload_weights: spacexData?.payload_weights,
          };
          
          setRocketDetails(combined);
          
          if (rocketImageUrl && !heroImageUrl) {
            setHeroImageUrl(rocketImageUrl);
          }
        }).catch(() => {
          // Silently fail - rocket details are optional
        });
    }
  }, [launch?.rocket?.configuration?.id]);

  const handleToggleFavorite = async () => {
    if (favorite) {
      await removeFavorite(launchId);
    } else {
      await addFavorite(launchId);
    }
  };

  const isApiUrl = (url: string): boolean => {
    if (!url) return true;
    return url.includes('ll.thespacedevs.com') || 
           url.includes('thespacedevs.com') || 
           url.includes('/api/') ||
           url.startsWith('https://ll') ||
           url.startsWith('https://lldev');
  };

  const getManufacturerWebsite = (manufacturerName?: string, providerName?: string): string | null => {
    const name = manufacturerName || providerName || '';
    const lowerName = name.toLowerCase();
    
    // Common manufacturer/provider websites
    if (lowerName.includes('spacex')) return 'https://www.spacex.com';
    if (lowerName.includes('nasa')) return 'https://www.nasa.gov';
    if (lowerName.includes('blue origin') || lowerName.includes('blueorigin')) return 'https://www.blueorigin.com';
    if (lowerName.includes('ula') || lowerName.includes('united launch alliance')) return 'https://www.ulalaunch.com';
    if (lowerName.includes('ariane') || lowerName.includes('arianespace')) return 'https://www.arianespace.com';
    if (lowerName.includes('rocket lab') || lowerName.includes('rocketlab')) return 'https://www.rocketlabusa.com';
    if (lowerName.includes('northrop') || lowerName.includes('grumman')) return 'https://www.northropgrumman.com';
    if (lowerName.includes('boeing')) return 'https://www.boeing.com';
    if (lowerName.includes('lockheed')) return 'https://www.lockheedmartin.com';
    if (lowerName.includes('roscosmos') || lowerName.includes('russia')) return 'https://www.roscosmos.ru';
    if (lowerName.includes('cnsa') || lowerName.includes('china')) return 'https://www.cnsa.gov.cn';
    if (lowerName.includes('isro') || lowerName.includes('india')) return 'https://www.isro.gov.in';
    if (lowerName.includes('jaxa') || lowerName.includes('japan')) return 'https://global.jaxa.jp';
    if (lowerName.includes('nuri') || lowerName.includes('kslv') || lowerName.includes('korea') || lowerName.includes('kari') || lowerName.includes('south korea')) return 'https://www.kari.re.kr';
    
    return null;
  };

  const getLaunchWebsiteUrl = (): string | null => {
    if (!launch) return null;
    
    const manufacturerWebsite = getManufacturerWebsite(
      launch.rocket?.configuration?.name,
      launch.launch_service_provider?.name
    );
    if (manufacturerWebsite) return manufacturerWebsite;
    
    if (rocketDetails) {
      if (rocketDetails.info_url && !isApiUrl(rocketDetails.info_url)) return rocketDetails.info_url;
      if (rocketDetails.wiki_url && !isApiUrl(rocketDetails.wiki_url)) return rocketDetails.wiki_url;
    }
    
    if (launch.program && launch.program.length > 0) {
      for (const program of launch.program) {
        if (program.info_url && !isApiUrl(program.info_url)) return program.info_url;
      }
    }
    
    if (launch.pad?.info_url && !isApiUrl(launch.pad.info_url)) return launch.pad.info_url;
    
    return null;
  };

  const handleShare = async () => {
    if (!launch) return;
    const websiteUrl = getLaunchWebsiteUrl();
    if (!websiteUrl) return;
    
    try {
      await Share.share({
        message: `Check out this launch: ${launch.name}\n${websiteUrl}`,
        title: launch.name,
      });
    } catch (error) {
      // Silently fail
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const handleOpenInMaps = async () => {
    if (!launch || !launch.pad?.latitude || !launch.pad?.longitude) return;
    
    await openLocationInMaps(
      launch.pad.latitude,
      launch.pad.longitude,
      defaultMapApp,
      () => setMapModalVisible(true)
    );
  };

  if (launchLoading) {
    return <LoadingState message="Loading launch details..." />;
  }

  if (launchError) {
    return (
      <ErrorState 
        message={launchError} 
        onRetry={refetch}
        onBack={() => navigation.goBack()}
      />
    );
  }

  if (!launch) {
    return <LoadingState message="Loading launch details..." />;
  }

  const statusAbbrev = launch.status?.abbrev || '';
  const isUpcoming = isLaunchUpcoming(statusAbbrev);

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
          {heroImageUrl ? (
            <Image 
              source={{ uri: heroImageUrl }} 
              style={styles.heroImage} 
              resizeMode="cover"
              onError={() => {
                // If image fails to load, try fallback
                const fallbackUrl = rocketDetails?.image_url || launch.mission?.agencies?.[0]?.logo_url;
                if (fallbackUrl && fallbackUrl !== heroImageUrl) {
                  setHeroImageUrl(fallbackUrl);
                } else {
                  setHeroImageUrl(null);
                }
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
          {/* Favorite Button */}
          <TouchableOpacity 
            onPress={handleToggleFavorite} 
            style={[styles.favoriteButton, { top: Math.max(insets.top, 16) }]}
          >
            <MaterialCommunityIcons 
              name={favorite ? "heart" : "heart-outline"} 
              size={24} 
              color={favorite ? "#FF6B6B" : Colors.text} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Title Card */}
        <View style={styles.titleCardContainer}>
          <GlassCard style={styles.titleCard}>
            <Text style={styles.missionName}>{launch.name}</Text>
          </GlassCard>
        </View>

        {isUpcoming && (
          <View style={styles.countdownSection}>
            <CountdownTimer 
              launchDate={launch.net} 
              size="medium" 
              format="compact"
              showIcon={true}
              animated={true}
            />
            <GradientButton
              title="Set Reminder"
              onPress={() => setReminderModalVisible(true)}
              icon={<MaterialIcons name="notifications" size={20} color={Colors.text} />}
            />
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} tint="dark" style={styles.tabsBlur}>
              <View style={styles.tabsContent}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'details' && styles.tabActive]}
                  onPress={() => setActiveTab('details')}
                  activeOpacity={0.7}
                >
                  {activeTab === 'details' ? (
                    <LinearGradient
                      colors={[Colors.primary, Colors.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <Text style={styles.tabTextActive}>Details</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.tabText}>Details</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'status' && styles.tabActive]}
                  onPress={() => setActiveTab('status')}
                  activeOpacity={0.7}
                >
                  {activeTab === 'status' ? (
                    <LinearGradient
                      colors={[Colors.primary, Colors.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <View style={styles.tabContent}>
                        <Text style={styles.tabTextActive}>Status</Text>
                        {launch.status && (
                          <StatusBadge status={launch.status.abbrev} size="small" />
                        )}
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tabContent}>
                      <Text style={styles.tabText}>Status</Text>
                      {launch.status && (
                        <StatusBadge status={launch.status.abbrev} size="small" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
                  onPress={() => setActiveTab('timeline')}
                  activeOpacity={0.7}
                >
                  {activeTab === 'timeline' ? (
                    <LinearGradient
                      colors={[Colors.primary, Colors.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <Text style={styles.tabTextActive}>Timeline</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.tabText}>Timeline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </BlurView>
          ) : (
            <View style={styles.tabsBlurAndroid}>
              <View style={styles.tabsContent}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'details' && styles.tabActive]}
                  onPress={() => setActiveTab('details')}
                  activeOpacity={0.7}
                >
                  {activeTab === 'details' ? (
                    <LinearGradient
                      colors={[Colors.primary, Colors.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <Text style={styles.tabTextActive}>Details</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.tabText}>Details</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'status' && styles.tabActive]}
                  onPress={() => setActiveTab('status')}
                  activeOpacity={0.7}
                >
                  {activeTab === 'status' ? (
                    <LinearGradient
                      colors={[Colors.primary, Colors.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <View style={styles.tabContent}>
                        <Text style={styles.tabTextActive}>Status</Text>
                        {launch.status && (
                          <StatusBadge status={launch.status.abbrev} size="small" />
                        )}
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tabContent}>
                      <Text style={styles.tabText}>Status</Text>
                      {launch.status && (
                        <StatusBadge status={launch.status.abbrev} size="small" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
                  onPress={() => setActiveTab('timeline')}
                  activeOpacity={0.7}
                >
                  {activeTab === 'timeline' ? (
                    <LinearGradient
                      colors={[Colors.primary, Colors.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <Text style={styles.tabTextActive}>Timeline</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.tabText}>Timeline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Launch Information</Text>
          <InfoRow label="Date" value={formatLaunchDate(launch.net)} icon="event" />
        {launch.window_start && (
          <InfoRow label="Window Start" value={formatLaunchDate(launch.window_start)} />
        )}
        {launch.window_end && (
          <InfoRow label="Window End" value={formatLaunchDate(launch.window_end)} />
        )}
        {launch.pad?.location?.name && (
          <InfoRow label="Location" value={launch.pad.location.name} icon="place" />
        )}
        {launch.pad?.location?.country_code && (
          <InfoRow label="Country" value={launch.pad.location.country_code} />
        )}
        {launch.pad?.name && (
          <InfoRow label="Pad" value={launch.pad.name} />
        )}
        {launch.pad?.latitude && launch.pad?.longitude && (
          <InfoRow 
            label="Coordinates" 
            value={`${launch.pad.latitude}, ${launch.pad.longitude}`} 
          />
        )}
        {launch.probability && (
          <InfoRow label="Probability" value={`${launch.probability}%`} />
        )}
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
        {launch.pad?.map_image && (
          <Image 
            source={{ uri: launch.pad.map_image }} 
            style={styles.mapImage} 
            resizeMode="cover"
          />
        )}
        {launch.pad?.latitude && launch.pad?.longitude && (
          <>
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesLabel}>Coordinates:</Text>
              <Text style={styles.coordinatesValue}>
                {launch.pad.latitude}, {launch.pad.longitude}
              </Text>
            </View>
            <GradientButton
              title="Open in Maps"
              onPress={handleOpenInMaps}
              icon={<MaterialCommunityIcons name="map" size={20} color={Colors.text} />}
            />
          </>
        )}
        {!launch.pad?.map_image && !launch.pad?.latitude && (
          <Text style={styles.noLocationText}>Location information not available</Text>
        )}
        </GlassCard>

        {launch.rocket?.configuration && (
          <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Rocket</Text>
          {launch.rocket.configuration.full_name && (
            <InfoRow label="Name" value={launch.rocket.configuration.full_name} />
          )}
          {launch.rocket.configuration.family && (
            <InfoRow label="Family" value={launch.rocket.configuration.family} />
          )}
          {launch.rocket.configuration.variant && (
            <InfoRow label="Variant" value={launch.rocket.configuration.variant} />
          )}
          {rocketDetails?.first_flight && (
            <InfoRow label="First Flight" value={new Date(rocketDetails.first_flight).toLocaleDateString()} />
          )}
          {rocketDetails?.last_flight && (
            <InfoRow label="Last Flight" value={new Date(rocketDetails.last_flight).toLocaleDateString()} />
          )}
          </GlassCard>
        )}

        {rocketDetails && (
          <>
            <GlassCard style={styles.section}>
              <Text style={styles.sectionTitle}>Technical Specs</Text>
            {rocketDetails.length && (
              <InfoRow label="Length" value={`${rocketDetails.length.toFixed(1)} m`} />
            )}
            {rocketDetails.diameter && (
              <InfoRow label="Diameter" value={`${rocketDetails.diameter.toFixed(2)} m`} />
            )}
            {rocketDetails.launch_mass && (
              <InfoRow label="Launch Mass" value={`${(rocketDetails.launch_mass / 1000).toFixed(1)} t`} />
            )}
            {rocketDetails.stages && (
              <InfoRow label="Stages" value={String(rocketDetails.stages)} />
            )}
            {rocketDetails.engines?.number && (
              <InfoRow 
                label="Engines" 
                value={`${rocketDetails.engines.number} × ${typeof rocketDetails.engines.type === 'object' ? (rocketDetails.engines.type as any)?.name || 'Unknown' : rocketDetails.engines.type || 'Unknown'}`} 
              />
            )}
            {rocketDetails.to_thrust && (
              <InfoRow label="Thrust (SL)" value={`${(rocketDetails.to_thrust / 1000).toFixed(1)} MN`} />
            )}
            {rocketDetails.success_rate_pct && (
              <InfoRow label="Success Rate" value={`${rocketDetails.success_rate_pct}%`} />
            )}
            {rocketDetails.cost_per_launch && (
              <InfoRow label="Cost per Launch" value={`$${(rocketDetails.cost_per_launch / 1000000).toFixed(1)}M`} />
            )}
            </GlassCard>

            {rocketDetails.engines && (
              <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>Engine Layout</Text>
                <EngineLayout layout={parseEngineLayout(rocketDetails)} />
              </GlassCard>
            )}

            {rocketDetails.payload_weights && rocketDetails.payload_weights.length > 0 && (
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

            {rocketDetails.booster_flights && rocketDetails.booster_flights.length > 0 && (
              <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>Booster History</Text>
                {rocketDetails.booster_flights.map((flight, index) => (
                  <View key={flight.id || index} style={styles.boosterFlight}>
                    <View style={styles.boosterFlightHeader}>
                      <Text style={styles.boosterFlightName}>{flight.name}</Text>
                      <Text style={styles.boosterFlightStatus}>
                        {flight.success ? '✓ Success' : '✗ Failure'}
                      </Text>
                    </View>
                    <Text style={styles.boosterFlightDate}>
                      Flight #{flight.flight_number} • {new Date(flight.date).toLocaleDateString()}
                      {flight.reused && ' • Reused'}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            )}
          </>
        )}

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agency</Text>
            <TouchableOpacity
              style={styles.followButton}
              onPress={() => toggleProviderFollow(
                String(launch.launch_service_provider.id),
                launch.launch_service_provider.name
              )}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={isProviderFollowed(String(launch.launch_service_provider.id)) ? 'notifications' : 'notifications-none'}
                size={20}
                color={isProviderFollowed(String(launch.launch_service_provider.id)) ? Colors.primary : Colors.textMuted}
              />
              <Text style={[
                styles.followButtonText,
                isProviderFollowed(String(launch.launch_service_provider.id)) && styles.followButtonTextActive
              ]}>
                {isProviderFollowed(String(launch.launch_service_provider.id)) ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
          <InfoRow label="Name" value={typeof launch.launch_service_provider.name === 'object' ? (launch.launch_service_provider.name as any)?.name || String(launch.launch_service_provider.name) : launch.launch_service_provider.name} />
          {launch.launch_service_provider.country_code && (
            <InfoRow label="Country" value={launch.launch_service_provider.country_code} />
          )}
          {launch.launch_service_provider.type && (
            <InfoRow label="Type" value={launch.launch_service_provider.type} />
          )}
        </GlassCard>

        {launch.mission && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Mission</Text>
            {launch.mission.description && (
              <Text style={styles.description}>{launch.mission.description}</Text>
            )}
            {launch.mission.type && (
              <InfoRow label="Type" value={launch.mission.type} />
            )}
            {launch.mission.orbit?.name && (
              <InfoRow label="Orbit" value={launch.mission.orbit.name} />
            )}
          </GlassCard>
        )}

        {launch.program && launch.program.length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Program</Text>
            {launch.program.map((program, index) => (
              <View key={program.id || index} style={styles.programItem}>
                <Text style={styles.programName}>{program.name}</Text>
                {program.description && (
                  <Text style={styles.programDescription}>{program.description}</Text>
                )}
              </View>
            ))}
          </GlassCard>
        )}

        <View style={styles.actions}>
          <GradientButton
            title="Share"
            onPress={handleShare}
            icon={<MaterialIcons name="share" size={20} color={Colors.text} />}
          />
          {getLaunchWebsiteUrl() && (
            <GradientButton
              title="View Details"
              onPress={() => {
                const websiteUrl = getLaunchWebsiteUrl();
                if (websiteUrl) {
                  openLink(websiteUrl);
                }
              }}
              variant="secondary"
            />
          )}
        </View>

        <DataSourceLabel source={launch.source} />
          </>
        ) : activeTab === 'status' ? (
          <StatusTabContent launch={launch} />
        ) : (
          <TimelineTabContent launch={launch} />
        )}
      </ScrollView>

      {launch.pad?.latitude && launch.pad?.longitude && (
        <MapSelectionModal
          visible={mapModalVisible}
          onClose={() => setMapModalVisible(false)}
          latitude={launch.pad.latitude}
          longitude={launch.pad.longitude}
        />
      )}
      {isUpcoming && (
        <ReminderModal
          visible={reminderModalVisible}
          onClose={() => setReminderModalVisible(false)}
          launchId={launch.id}
          launchName={launch.name}
          launchDate={launch.net}
        />
      )}
    </LinearGradient>
  );
};

const TimelineTabContent: React.FC<{ launch: Launch }> = ({ launch }) => {
  if (!launch.mission) {
    return (
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Mission Timeline</Text>
        <Text style={styles.noTimelineText}>No mission timeline available for this launch.</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.section}>
      <MissionTimeline launch={launch} />
    </GlassCard>
  );
};

const StatusTabContent: React.FC<{ launch: Launch }> = ({ launch }) => {
  const statusAbbrev = launch.status?.abbrev || '';
  const statusConfig = getStatusConfig(statusAbbrev);
  const statusCategory = getStatusCategory(statusAbbrev);
  
  // Status schema examples by category
  const statusSchema = {
    success: ['GO', 'Success', 'Launched', 'Landed'],
    failed: ['Failure', 'Partial Failure', 'Aborted', 'Scrubbed'],
    pending: ['TBD', 'TBC', 'Hold', 'Delayed', 'Postponed'],
    active: ['Active', 'In Flight', 'In Progress', 'Launching', 'Testing'],
    warning: ['Concern', 'Issue', 'Problem', 'Risk'],
    info: ['Scheduled', 'Planned', 'Confirmed', 'Announced'],
    neutral: ['Unknown', 'Other'],
  };

  return (
    <View>
      {/* Current Status */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <View style={styles.statusDisplay}>
          <StatusBadge status={statusAbbrev} size="large" />
          {launch.status?.name && (
            <Text style={styles.statusName}>{launch.status.name}</Text>
          )}
          {launch.status?.description && (
            <Text style={styles.statusDescription}>{launch.status.description}</Text>
          )}
          <View style={styles.statusCategoryBadge}>
            <Text style={styles.statusCategoryLabel}>Category:</Text>
            <View style={[styles.categoryIndicator, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.categoryText, { color: statusConfig.text }]}>
                {statusCategory.charAt(0).toUpperCase() + statusCategory.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* Status Schema */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Status Schema</Text>
        <Text style={styles.schemaDescription}>
          Launch statuses are categorized to help you understand the current state of a launch.
        </Text>
        
        {Object.entries(statusSchema).map(([category, examples]) => {
          const categoryConfig = getStatusConfig(examples[0]);
          const isCurrentCategory = category === statusCategory;
          
          return (
            <View key={category} style={[styles.schemaCategory, isCurrentCategory && styles.schemaCategoryActive]}>
              <View style={styles.schemaCategoryHeader}>
                <View style={[styles.schemaCategoryIndicator, { backgroundColor: categoryConfig.bg }]}>
                  <Text style={[styles.schemaCategoryTitle, { color: categoryConfig.text }]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </View>
                {isCurrentCategory && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
              <View style={styles.schemaExamples}>
                {examples.map((example, index) => (
                  <StatusBadge
                    key={index}
                    status={example}
                    size="small"
                    style={styles.schemaBadge}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </GlassCard>

      {/* Status Information */}
      {launch.status && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Status Information</Text>
          {launch.status.name && (
            <InfoRow label="Status Name" value={launch.status.name} />
          )}
          {launch.status.abbrev && (
            <InfoRow label="Abbreviation" value={launch.status.abbrev} />
          )}
          {launch.status.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValueDescription}>{launch.status.description}</Text>
            </View>
          )}
        </GlassCard>
      )}
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value: string | number | null | undefined; icon?: string }> = ({ label, value, icon }) => {
  // Convert value to string safely - handle objects, null, undefined
  const displayValue = value === null || value === undefined 
    ? 'N/A' 
    : typeof value === 'object' 
      ? (value as any)?.name || (value as any)?.id || JSON.stringify(value)
      : String(value);
  
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        {icon && (
          <MaterialIcons 
            name={icon as any} 
            size={18} 
            color={Colors.primary} 
            style={styles.infoIcon} 
          />
        )}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{displayValue}</Text>
    </View>
  );
};

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
  favoriteButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleCardContainer: {
    marginTop: -32,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  titleCard: {
    padding: 24,
  },
  missionName: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tabsContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabsBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabsBlurAndroid: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tabsContent: {
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    // Active state handled by gradient
  },
  tabGradient: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  statusDisplay: {
    alignItems: 'center',
    gap: 12,
  },
  statusName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  statusCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statusCategoryLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  schemaDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  schemaCategory: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  schemaCategoryActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: `${Colors.primary}10`,
  },
  schemaCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  schemaCategoryIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  schemaCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  currentBadgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  schemaExamples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  schemaBadge: {
    marginBottom: 0,
  },
  infoValueDescription: {
    color: Colors.text,
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
    fontWeight: '400',
    lineHeight: 20,
  },
  countdownSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 16,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  followButtonText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  followButtonTextActive: {
    color: Colors.primary,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
    fontWeight: '600',
  },
  programItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  programName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  programDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  mapImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: Colors.cardSolid,
  },
  coordinatesContainer: {
    marginBottom: 12,
  },
  coordinatesLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  coordinatesValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  noLocationText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  noTimelineText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
    fontStyle: 'italic',
  },
  boosterFlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  boosterFlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  boosterFlightName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  boosterFlightStatus: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  boosterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  boosterBadgeSuccess: {
    backgroundColor: '#1A4A1A',
    borderWidth: 1,
    borderColor: '#2A7A2A',
  },
  boosterBadgeFailure: {
    backgroundColor: '#4A1A1A',
    borderWidth: 1,
    borderColor: '#7A2A2A',
  },
  boosterBadgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  boosterFlightDate: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});

