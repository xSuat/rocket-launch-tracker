import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  Linking,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllEvents } from '../services/events';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { GlassCard, GradientButton, DataSourceLabel } from '../components';
import { PageHeader } from '../components/ui';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export const GalleryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [apodEvents, setApodEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const loadImages = useCallback(async (useCache = true) => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const allEvents = await getAllEvents(
        monthStart.toISOString(),
        monthEnd.toISOString(),
        undefined,
        undefined,
        undefined,
        useCache
      );

      const apod = allEvents.filter(e => e.type === 'apod').sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setApodEvents(apod);
    } catch (err: any) {
      setError(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadImages(false);
  }, [loadImages]);

  const handleImageError = useCallback((eventId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(eventId));
  }, []);

  const headerHeight = Math.max(insets.top, 16) + 100;

  if (error && apodEvents.length === 0 && !loading) {
    return <ErrorState message={error} onRetry={() => loadImages(false)} />;
  }

  const emptyMessage = 'No astronomy pictures available';

  return (
    <>
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
        <PageHeader
          title="Space Gallery"
          subtitle="Astronomy Picture of the Day"
        />
      </View>

      {loading && !refreshing ? (
        <View style={[styles.loadingContainer, { paddingTop: headerHeight + 24 }]}>
          <LoadingState message="Loading space images..." transparent alignTop />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: headerHeight + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.background}
              progressViewOffset={headerHeight}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {apodEvents.length > 0 ? (
            <>
              {/* Featured Image (Hero) */}
              {apodEvents[0] && (
                <TouchableOpacity
                  onPress={() => setSelectedEvent(apodEvents[0])}
                  activeOpacity={0.9}
                  style={styles.featuredCardWrapper}
                >
                  <GlassCard style={styles.featuredCard}>
                    {!imageLoadErrors.has(apodEvents[0].id) ? (
                      <Image
                        source={{ uri: apodEvents[0].url }}
                        style={styles.featuredImage}
                        resizeMode="cover"
                        onError={() => handleImageError(apodEvents[0].id)}
                      />
                    ) : (
                      <View style={styles.imageError}>
                        <MaterialCommunityIcons name="image-off" size={64} color={Colors.textMuted} />
                        <Text style={styles.imageErrorText}>Image unavailable</Text>
                      </View>
                    )}
                    
                    <LinearGradient
                      colors={['transparent', 'rgba(0, 0, 0, 0.95)']}
                      style={styles.featuredGradient}
                    >
                      <View style={styles.featuredContent}>
                        <View style={styles.featuredHeader}>
                          <View style={styles.featuredBadge}>
                            <MaterialCommunityIcons
                              name="star"
                              size={16}
                              color={Colors.text}
                            />
                            <Text style={styles.featuredBadgeText}>Featured</Text>
                          </View>
                          <Text style={styles.featuredDate}>
                            {new Date(apodEvents[0].date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                        <Text style={styles.featuredTitle} numberOfLines={2}>
                          {apodEvents[0].title}
                        </Text>
                        {apodEvents[0].description && (
                          <Text style={styles.featuredDescription} numberOfLines={2}>
                            {apodEvents[0].description}
                          </Text>
                        )}
                      </View>
                    </LinearGradient>
                  </GlassCard>
                </TouchableOpacity>
              )}

              {/* Regular Images Grid */}
              {apodEvents.length > 1 && (
                <View style={styles.gridContainer}>
                  <Text style={styles.sectionTitle}>More Images</Text>
                  <View style={styles.imageGrid}>
                    {apodEvents.slice(1).map((event) => {
                      const hasError = imageLoadErrors.has(event.id);
                      const eventDate = new Date(event.date);
                      const isToday = eventDate.toDateString() === new Date().toDateString();
                      
                      return (
                        <TouchableOpacity
                          key={event.id}
                          onPress={() => setSelectedEvent(event)}
                          activeOpacity={0.9}
                          style={styles.imageCardWrapper}
                        >
                          <GlassCard style={styles.imageCard}>
                            {!hasError ? (
                              <Image
                                source={{ uri: event.url }}
                                style={styles.image}
                                resizeMode="cover"
                                onError={() => handleImageError(event.id)}
                              />
                            ) : (
                              <View style={styles.imageError}>
                                <MaterialCommunityIcons name="image-off" size={32} color={Colors.textMuted} />
                              </View>
                            )}
                            
                            <LinearGradient
                              colors={['transparent', 'rgba(0, 0, 0, 0.85)']}
                              style={styles.imageGradient}
                            >
                              <View style={styles.imageContent}>
                                {isToday && (
                                  <View style={styles.todayBadge}>
                                    <Text style={styles.todayBadgeText}>Today</Text>
                                  </View>
                                )}
                                <Text style={styles.imageDate}>
                                  {eventDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </Text>
                                <Text style={styles.imageTitle} numberOfLines={2}>
                                  {event.title}
                                </Text>
                              </View>
                            </LinearGradient>
                            <View style={styles.imageIcon}>
                              <MaterialCommunityIcons
                                name="image-outline"
                                size={14}
                                color={Colors.text}
                              />
                            </View>
                          </GlassCard>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          ) : (
            <EmptyState
              title="No images found"
              message={emptyMessage}
            />
          )}
        </ScrollView>
      )}

      {/* Image Detail Modal */}
      {selectedEvent && (
        <Modal
          visible={!!selectedEvent}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedEvent(null)}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setSelectedEvent(null)}
            />
            <View style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedEvent(null)}
                >
                  <MaterialIcons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
                
                <ScrollView
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {!imageLoadErrors.has(selectedEvent.id) ? (
                    <View style={styles.modalImageContainer}>
                      <Image
                        source={{ uri: selectedEvent.url }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View style={styles.modalImageError}>
                      <MaterialCommunityIcons name="image-off" size={64} color={Colors.textMuted} />
                      <Text style={styles.modalImageErrorText}>Image unavailable</Text>
                    </View>
                  )}
                  
                  <View style={styles.modalText}>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalIconContainer}>
                        <LinearGradient
                          colors={['#FF6B6B', Colors.pink]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.modalIconGradient}
                        >
                          <MaterialCommunityIcons
                            name="image-outline"
                            size={24}
                            color={Colors.text}
                          />
                        </LinearGradient>
                      </View>
                      <View style={styles.modalHeaderText}>
                        <Text style={styles.modalDate}>
                          {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                      </View>
                    </View>
                    
                    {selectedEvent.description && (
                      <Text style={styles.modalDescription}>{selectedEvent.description}</Text>
                    )}
                    
                    <GradientButton
                      title="View Full Image"
                      onPress={() => {
                        if (selectedEvent.url) {
                          Linking.openURL(selectedEvent.url).catch(() => {});
                        }
                      }}
                      variant="secondary"
                      icon={<MaterialIcons name="open-in-new" size={20} color={Colors.text} />}
                      style={{ marginTop: 20 }}
                    />

                    <DataSourceLabel source={selectedEvent.source} />
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
    </>
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
    zIndex: 11,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  // Featured Image Styles
  featuredCardWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  featuredCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    justifyContent: 'flex-end',
  },
  featuredContent: {
    padding: 24,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  featuredBadgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredDate: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 8,
  },
  featuredDescription: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  // Grid Section
  gridContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCardWrapper: {
    width: (width - 52) / 2, // 2 columns with gap
  },
  imageCard: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageError: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    justifyContent: 'flex-end',
  },
  imageContent: {
    padding: 12,
  },
  todayBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  todayBadgeText: {
    color: Colors.text,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  imageDate: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imageTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  imageIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.95)' : 'transparent',
  },
  modalContent: {
    width: Dimensions.get('window').width - 40,
    maxHeight: Dimensions.get('window').height * 0.9,
    backgroundColor: Colors.cardSolid,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 101,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 20,
    width: '100%',
  },
  modalImageContainer: {
    width: '100%',
    aspectRatio: 1.5,
    minHeight: 300,
    maxHeight: Dimensions.get('window').height * 0.5,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
  },
  modalImageError: {
    width: '100%',
    minHeight: 400,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageErrorText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: 16,
  },
  modalText: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderText: {
    flex: 1,
  },
  modalDate: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 30,
  },
  modalDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginTop: 8,
  },
});
