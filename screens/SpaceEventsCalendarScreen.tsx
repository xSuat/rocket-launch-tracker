import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
  Modal,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpaceEvent } from '../services/events';
import { useEvents } from '../hooks';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PageHeader, StatCard, GlassCard, GradientButton } from '../components/ui';
import { DataSourceLabel } from '../components';
import { Colors } from '../constants/colors';
import { getMeteorShowerDetails } from '../utils/meteorShowerUtils';

export const SpaceEventsCalendarScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<SpaceEvent | null>(null);
  const [eventDetailsVisible, setEventDetailsVisible] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [eventTypeFilters, setEventTypeFilters] = useState({
    launch: true,
    meteor: true,
    asteroid: true,
    moon: true,
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const monthStart = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
  const monthEnd = useMemo(() => {
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return end;
  }, [currentDate]);

  const { events: allEvents, loading, refreshing, error, refetch } = useEvents(
    monthStart.toISOString(),
    monthEnd.toISOString()
  );

  const events = useMemo(() => {
    return allEvents.filter(event => {
      if (event.type === 'apod') return false;
      if (event.type === 'launch' && !eventTypeFilters.launch) return false;
      if (event.type === 'meteor' && !eventTypeFilters.meteor) return false;
      if (event.type === 'asteroid' && !eventTypeFilters.asteroid) return false;
      if (event.type === 'moon' && !eventTypeFilters.moon) return false;
      return true;
    });
  }, [allEvents, eventTypeFilters]);

  const meteorShowerDetails = useMemo(() => {
    if (selectedEvent?.type === 'meteor') {
      return getMeteorShowerDetails(selectedEvent.title);
    }
    return null;
  }, [selectedEvent]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group events by date for the Calendar section
  const eventsByDate = useMemo(() => {
    const grouped: { [dateKey: string]: { date: Date; events: SpaceEvent[]; count: number } } = {};

    events.forEach((event) => {
      const eventDate = new Date(event.date);
      const dateKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: eventDate,
          events: [],
          count: 0,
        };
      }

      grouped[dateKey].events.push(event);
      grouped[dateKey].count += 1;
    });

    // Convert to sorted array
    return Object.values(grouped)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  // Month names and current month info
  const monthNames = useMemo(() => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], []);
  const currentMonthName = useMemo(() => monthNames[currentDate.getMonth()], [currentDate, monthNames]);
  const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    return Object.values(eventTypeFilters).filter(Boolean).length;
  }, [eventTypeFilters]);

  // Get event color based on type
  const getEventColor = (type: string): string => {
    switch (type) {
      case 'launch': return '#4A9EFF'; // blue
      case 'meteor':
      case 'asteroid': return Colors.primary; // purple (astronomy)
      case 'moon': return '#C0C0C0'; // silver
      case 'apod': return '#FF6B6B'; // red
      case 'epic': return '#4ECDC4'; // teal
      default: return Colors.primary;
    }
  };

  const getEventIcon = (type: string): any => {
    switch (type) {
      case 'launch': return 'rocket-launch';
      case 'meteor': return 'meteor';
      case 'asteroid': return 'star';
      case 'moon': return 'moon-full';
      case 'apod': return 'image-outline';
      case 'epic': return 'earth';
      default: return 'star';
    }
  };

  // Get event type display name
  const getEventTypeName = (type: string): string => {
    switch (type) {
      case 'launch': return 'Launch';
      case 'meteor': return 'Meteor Shower';
      case 'asteroid': return 'Astronomy';
      case 'moon': return 'Moon Phase';
      case 'apod': return 'APOD';
      case 'epic': return 'Earth View';
      default: return 'Event';
    }
  };

  // Check if URL is an API URL
  const isApiUrl = (url: string): boolean => {
    if (!url) return true;
    return url.includes('ll.thespacedevs.com') || 
           url.includes('thespacedevs.com') || 
           url.includes('/api/') ||
           url.startsWith('https://ll') ||
           url.startsWith('https://lldev');
  };

  // Get manufacturer website from event title/name
  const getManufacturerWebsite = (eventTitle: string): string | null => {
    const lowerTitle = eventTitle.toLowerCase();
    
    // Common manufacturer/provider websites
    if (lowerTitle.includes('spacex') || lowerTitle.includes('falcon')) {
      return 'https://www.spacex.com';
    }
    if (lowerTitle.includes('nasa') || lowerTitle.includes('sls') || lowerTitle.includes('artemis')) {
      return 'https://www.nasa.gov';
    }
    if (lowerTitle.includes('blue origin') || lowerTitle.includes('blueorigin') || lowerTitle.includes('new shepard')) {
      return 'https://www.blueorigin.com';
    }
    if (lowerTitle.includes('ula') || lowerTitle.includes('united launch alliance') || lowerTitle.includes('atlas') || lowerTitle.includes('delta')) {
      return 'https://www.ulalaunch.com';
    }
    if (lowerTitle.includes('ariane') || lowerTitle.includes('arianespace') || lowerTitle.includes('galileo')) {
      return 'https://www.arianespace.com';
    }
    if (lowerTitle.includes('rocket lab') || lowerTitle.includes('rocketlab') || lowerTitle.includes('electron')) {
      return 'https://www.rocketlabusa.com';
    }
    if (lowerTitle.includes('northrop') || lowerTitle.includes('grumman') || lowerTitle.includes('antares')) {
      return 'https://www.northropgrumman.com';
    }
    if (lowerTitle.includes('boeing')) {
      return 'https://www.boeing.com';
    }
    if (lowerTitle.includes('lockheed')) {
      return 'https://www.lockheedmartin.com';
    }
    if (lowerTitle.includes('roscosmos') || lowerTitle.includes('russia') || lowerTitle.includes('soyuz') || lowerTitle.includes('proton')) {
      return 'https://www.roscosmos.ru';
    }
    if (lowerTitle.includes('cnsa') || lowerTitle.includes('china') || lowerTitle.includes('long march')) {
      return 'https://www.cnsa.gov.cn';
    }
    if (lowerTitle.includes('isro') || lowerTitle.includes('india') || lowerTitle.includes('pslv') || lowerTitle.includes('gslv')) {
      return 'https://www.isro.gov.in';
    }
    if (lowerTitle.includes('jaxa') || lowerTitle.includes('japan') || lowerTitle.includes('h-ii') || lowerTitle.includes('h3')) {
      return 'https://global.jaxa.jp';
    }
    if (lowerTitle.includes('nuri') || lowerTitle.includes('kslv') || lowerTitle.includes('korea') || lowerTitle.includes('kari') || lowerTitle.includes('south korea')) {
      return 'https://www.kari.re.kr';
    }
    
    return null;
  };

  // Get the best URL for a launch event
  const getLaunchEventUrl = (event: SpaceEvent): string | null => {
    if (event.type !== 'launch') {
      return event.url || null;
    }
    
    // Try manufacturer website first (most reliable)
    const manufacturerWebsite = getManufacturerWebsite(event.title);
    if (manufacturerWebsite) {
      return manufacturerWebsite;
    }
    
    // If original URL exists and is not an API URL, use it
    if (event.url && !isApiUrl(event.url)) {
      return event.url;
    }
    
    // No valid URL found
    return null;
  };

  // Opens the system "New Event" sheet. On iOS 17+ this needs no calendar
  // permission; older iOS versions require access before the sheet can open.
  const handleAddToCalendar = async (event: SpaceEvent) => {
    if (addingToCalendar) return;
    setAddingToCalendar(true);

    try {
      if (Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) < 17) {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Calendar Access Needed',
            'Allow calendar access in Settings to add events to your calendar.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }

      const startDate = event.startDate ? new Date(event.startDate) : new Date(event.date);
      const endDate = event.endDate
        ? new Date(event.endDate)
        : new Date(startDate.getTime() + 60 * 60 * 1000);

      const result = await Calendar.createEventInCalendarAsync({
        title: event.title,
        startDate,
        endDate,
        location: event.locationName,
        notes: `${event.description || ''}\n\n${event.url || ''}`.trim(),
      });

      if (result.action === 'saved') {
        setEventDetailsVisible(false);
        setSelectedEvent(null);
      }
    } catch {
      Alert.alert('Could Not Add Event', 'The event could not be added to your calendar. Please try again.');
    } finally {
      setAddingToCalendar(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const thisMonth = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    }).length;
    
    const visible = events.filter(e => e.type === 'meteor' || e.type === 'asteroid' || e.type === 'moon').length;
    const launches = events.filter(e => e.type === 'launch').length;
    
    return {
      thisMonth,
      visible,
      launches,
    };
  }, [events]);

  // Calculate heights
  const headerTitleHeight = 80; // Title + subtitle height
  const statsHeight = 92; // Stats container height
  const monthNavHeight = 48; // Month navigation height
  const topSectionHeight = Math.max(insets.top, 16) + headerTitleHeight + statsHeight + monthNavHeight;

  if (error && events.length === 0 && !loading) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <LinearGradient
      colors={Colors.backgroundGradient as any}
      style={styles.container}
    >
      {/* Fixed Blur Background for Top Section */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={20}
          tint="dark"
          style={[styles.blurBackground, { height: topSectionHeight }]}
        />
      ) : (
        <View style={[styles.blurBackground, { height: topSectionHeight, backgroundColor: 'rgba(0, 0, 0, 0.6)' }]} />
      )}

      {/* Fixed Top Section - Title + Stats + Search/Filter */}
      <View style={[styles.topSectionWrapper, { paddingTop: Math.max(insets.top, 16), height: topSectionHeight }]}>
        <PageHeader
          title="Space Events"
          subtitle={`${currentMonthName} ${currentYear}`}
          rightButtons={[
            {
              icon: 'today',
              onPress: goToToday,
            },
            {
              icon: 'filter-list',
              onPress: () => setFilterModalVisible(true),
              badge: getActiveFilterCount() < 4 ? getActiveFilterCount() : undefined,
            },
          ]}
        />
        <View style={styles.statsContainer}>
          <StatCard value={loading ? '-' : stats.thisMonth} label="This Month" />
          <StatCard value={loading ? '-' : stats.visible} label="Visible" />
          <StatCard value={loading ? '-' : stats.launches} label="Launches" />
        </View>
        {/* Month Navigation */}
        <View style={styles.monthNavContainer}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.monthNavButton}>
            <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.monthNavButton}>
            <MaterialIcons name="chevron-right" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={[styles.loadingContainer, { paddingTop: topSectionHeight + 24 }]}>
          <LoadingState message="Loading space events..." />
        </View>
      ) : eventsByDate.length === 0 ? (
        <ScrollView 
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: topSectionHeight + 24 }]}
          contentInsetAdjustmentBehavior="automatic"
        >
          <EmptyState
            title="No events found"
            message={getActiveFilterCount() < 4 ? "Try adjusting your filters" : "No events available for this month"}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={eventsByDate}
          keyExtractor={(item) => item.date.toISOString()}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: topSectionHeight + 24 }]}
          renderItem={({ item }) => (
            <View style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>
                  {item.date.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                  })}
                  {' - Events'}
                </Text>
              </View>
              <View style={styles.eventsList}>
                {item.events.map((event) => {
                  const eventColor = getEventColor(event.type);
                  const eventTime = new Date(event.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  });
                  
                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventCard}
                      onPress={() => {
                        setSelectedEvent(event);
                        setEventDetailsVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <GlassCard style={styles.eventCardInner}>
                        <View style={[styles.eventIconContainer, { backgroundColor: `${eventColor}20` }]}>
                          <LinearGradient
                            colors={[eventColor, Colors.pink]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.eventIconGradient}
                          >
                            <MaterialCommunityIcons
                              name={getEventIcon(event.type)}
                              size={24}
                              color={Colors.text}
                            />
                          </LinearGradient>
                        </View>
                        <View style={styles.eventCardContent}>
                          <Text style={styles.eventCardTitle}>{event.title}</Text>
                          {event.description && (
                            <Text style={styles.eventCardDescription} numberOfLines={1}>
                              {event.description}
                            </Text>
                          )}
                          <View style={styles.eventCardTimeRow}>
                            <MaterialIcons name="schedule" size={14} color={eventColor} />
                            <Text style={[styles.eventCardTime, { color: eventColor }]}>
                              {eventTime}
                            </Text>
                          </View>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.background}
              progressViewOffset={topSectionHeight}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <GlassCard style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Events</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.filterModalCloseButton}
              >
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.filterOptions}>
              {[
                { key: 'launch', label: 'Launches', color: '#4A9EFF', icon: 'rocket-launch' },
                { key: 'meteor', label: 'Meteor Showers', color: Colors.primary, icon: 'meteor' },
                { key: 'asteroid', label: 'Asteroids', color: Colors.primary, icon: 'star' },
                { key: 'moon', label: 'Moon Phases', color: '#C0C0C0', icon: 'moon-full' },
              ].map(({ key, label, color, icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterOption,
                    eventTypeFilters[key as keyof typeof eventTypeFilters] && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    setEventTypeFilters(prev => ({
                      ...prev,
                      [key]: !prev[key as keyof typeof prev],
                    }));
                  }}
                >
                  <View style={styles.filterOptionContent}>
                    <View style={[styles.filterOptionIcon, { backgroundColor: `${color}20` }]}>
                      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
                    </View>
                    <Text
                      style={[
                        styles.filterOptionText,
                        eventTypeFilters[key as keyof typeof eventTypeFilters] && styles.filterOptionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  {eventTypeFilters[key as keyof typeof eventTypeFilters] && (
                    <MaterialIcons name="check" size={20} color={color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={() => {
                  setEventTypeFilters({
                    launch: true,
                    meteor: true,
                    asteroid: true,
                    moon: true,
                  });
                }}
              >
                <Text style={styles.filterResetText}>Reset All</Text>
              </TouchableOpacity>
              <GradientButton
                title="Apply"
                onPress={() => {
                  setFilterModalVisible(false);
                }}
                style={styles.filterApplyButton}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        visible={eventDetailsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setEventDetailsVisible(false);
          setSelectedEvent(null);
        }}
      >
        <LinearGradient
          colors={Colors.backgroundGradient as any}
          style={styles.modalContainer}
        >
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={[styles.modalScrollContent, { paddingTop: Math.max(insets.top, 20) + 20 }]}
          >
            {selectedEvent && (
              <>
                {/* Header with back and favorite buttons */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setEventDetailsVisible(false);
                      setSelectedEvent(null);
                    }}
                    style={styles.modalBackButton}
                  >
                    <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalFavoriteButton}
                    onPress={() => {}}
                  >
                    <MaterialIcons name="star-outline" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Event Icon */}
                <View style={[styles.modalIconSquare, { backgroundColor: `${getEventColor(selectedEvent.type)}40` }]}>
                  <MaterialCommunityIcons
                    name={getEventIcon(selectedEvent.type)}
                    size={64}
                    color={getEventColor(selectedEvent.type)}
                  />
                </View>

                {/* Event Type Badge */}
                <View style={styles.modalBadgeContainer}>
                  <GlassCard style={styles.modalBadge}>
                    <Text style={styles.modalBadgeText}>{getEventTypeName(selectedEvent.type)}</Text>
                  </GlassCard>
                </View>

                {/* Event Title */}
                <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>

                {/* Event Subtitle */}
                {selectedEvent.description && (
                  <Text style={styles.modalSubtitle} numberOfLines={2}>
                    {selectedEvent.description}
                  </Text>
                )}

                {/* Details Card */}
                <GlassCard style={styles.modalInfoCard}>
                  {/* Date */}
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <MaterialIcons name="calendar-today" size={20} color={Colors.text} />
                    </View>
                    <View style={styles.modalInfoText}>
                      <Text style={styles.modalInfoLabel}>Date</Text>
                      <Text style={styles.modalInfoValue}>
                        {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Time */}
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <MaterialIcons name="schedule" size={20} color={Colors.text} />
                    </View>
                    <View style={styles.modalInfoText}>
                      <Text style={styles.modalInfoLabel}>
                        {selectedEvent.endDate ? 'Best Observation Time' : 'Time'}
                      </Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedEvent.endDate
                          ? `${new Date(selectedEvent.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })} - ${new Date(selectedEvent.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}`
                          : new Date(selectedEvent.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZoneName: 'short',
                            })
                        }
                      </Text>
                    </View>
                  </View>

                  {selectedEvent.locationName && (
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoIcon}>
                        <MaterialIcons name="place" size={20} color={Colors.text} />
                      </View>
                      <View style={styles.modalInfoText}>
                        <Text style={styles.modalInfoLabel}>Location</Text>
                        <Text style={styles.modalInfoValue}>{selectedEvent.locationName}</Text>
                      </View>
                    </View>
                  )}
                </GlassCard>

                {/* Meteor Shower Details Section */}
                {meteorShowerDetails && (
                  <View style={styles.modalAboutSection}>
                    <Text style={styles.modalAboutTitle}>Meteor Shower Details</Text>
                    
                    {/* Description */}
                    <Text style={styles.modalAboutText}>{meteorShowerDetails.description}</Text>
                    
                    {/* Key Information */}
                    <GlassCard style={styles.meteorInfoCard}>
                      <View style={styles.meteorInfoRow}>
                        <View style={styles.meteorInfoIcon}>
                          <MaterialCommunityIcons name="star-four-points" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.meteorInfoText}>
                          <Text style={styles.meteorInfoLabel}>Radiant</Text>
                          <Text style={styles.meteorInfoValue}>{meteorShowerDetails.radiant}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.meteorInfoRow}>
                        <View style={styles.meteorInfoIcon}>
                          <MaterialCommunityIcons name="meteor" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.meteorInfoText}>
                          <Text style={styles.meteorInfoLabel}>Peak Rate</Text>
                          <Text style={styles.meteorInfoValue}>{meteorShowerDetails.zhr}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.meteorInfoRow}>
                        <View style={styles.meteorInfoIcon}>
                          <MaterialCommunityIcons name="orbit" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.meteorInfoText}>
                          <Text style={styles.meteorInfoLabel}>Parent Body</Text>
                          <Text style={styles.meteorInfoValue}>{meteorShowerDetails.parent}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.meteorInfoRow}>
                        <View style={styles.meteorInfoIcon}>
                          <MaterialIcons name="schedule" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.meteorInfoText}>
                          <Text style={styles.meteorInfoLabel}>Duration</Text>
                          <Text style={styles.meteorInfoValue}>{meteorShowerDetails.duration}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.meteorInfoRow}>
                        <View style={styles.meteorInfoIcon}>
                          <MaterialIcons name="visibility" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.meteorInfoText}>
                          <Text style={styles.meteorInfoLabel}>Best Viewing</Text>
                          <Text style={styles.meteorInfoValue}>{meteorShowerDetails.bestViewingTime}</Text>
                        </View>
                      </View>
                    </GlassCard>
                    
                    {/* Viewing Tips */}
                    <View style={styles.viewingTipsSection}>
                      <Text style={styles.viewingTipsTitle}>Viewing Tips</Text>
                      {meteorShowerDetails.viewingTips.map((tip, index) => (
                        <View key={index} style={styles.viewingTipItem}>
                          <MaterialIcons name="check-circle" size={18} color={Colors.primary} style={styles.viewingTipIcon} />
                          <Text style={styles.viewingTipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                    
                    {/* Notable Years */}
                    {meteorShowerDetails.notableYears && (
                      <GlassCard style={styles.notableYearsCard}>
                        <View style={styles.notableYearsHeader}>
                          <MaterialCommunityIcons name="star-circle" size={20} color={Colors.warning} />
                          <Text style={styles.notableYearsTitle}>Notable Activity</Text>
                        </View>
                        <Text style={styles.notableYearsText}>{meteorShowerDetails.notableYears}</Text>
                      </GlassCard>
                    )}
                  </View>
                )}

                {/* Asteroid Details Section */}
                {selectedEvent.type === 'asteroid' && selectedEvent.asteroidData && (
                  <View style={styles.modalAboutSection}>
                    <Text style={styles.modalAboutTitle}>Asteroid Details</Text>
                    
                    <GlassCard style={styles.meteorInfoCard}>
                      {selectedEvent.asteroidData.diameterMin && selectedEvent.asteroidData.diameterMax && (
                        <View style={styles.meteorInfoRow}>
                          <View style={styles.meteorInfoIcon}>
                            <MaterialCommunityIcons name="circle-outline" size={20} color={Colors.primary} />
                          </View>
                          <View style={styles.meteorInfoText}>
                            <Text style={styles.meteorInfoLabel}>Estimated Diameter</Text>
                            <Text style={styles.meteorInfoValue}>
                              {selectedEvent.asteroidData.diameterMin.toFixed(0)} - {selectedEvent.asteroidData.diameterMax.toFixed(0)} m
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedEvent.asteroidData.velocity && (
                        <View style={styles.meteorInfoRow}>
                          <View style={styles.meteorInfoIcon}>
                            <MaterialCommunityIcons name="speedometer" size={20} color={Colors.primary} />
                          </View>
                          <View style={styles.meteorInfoText}>
                            <Text style={styles.meteorInfoLabel}>Relative Velocity</Text>
                            <Text style={styles.meteorInfoValue}>
                              {selectedEvent.asteroidData.velocity.toFixed(2)} km/s
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedEvent.asteroidData.missDistanceKm && (
                        <View style={styles.meteorInfoRow}>
                          <View style={styles.meteorInfoIcon}>
                            <MaterialIcons name="straighten" size={20} color={Colors.primary} />
                          </View>
                          <View style={styles.meteorInfoText}>
                            <Text style={styles.meteorInfoLabel}>Miss Distance</Text>
                            <Text style={styles.meteorInfoValue}>
                              {selectedEvent.asteroidData.missDistanceKm.toFixed(0)} km
                              {selectedEvent.asteroidData.missDistanceLunar && selectedEvent.asteroidData.missDistanceLunar > 0 && (
                                ` (${selectedEvent.asteroidData.missDistanceLunar.toFixed(2)} lunar distances)`
                              )}
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedEvent.asteroidData.orbitingBody && (
                        <View style={styles.meteorInfoRow}>
                          <View style={styles.meteorInfoIcon}>
                            <MaterialCommunityIcons name="orbit" size={20} color={Colors.primary} />
                          </View>
                          <View style={styles.meteorInfoText}>
                            <Text style={styles.meteorInfoLabel}>Orbiting Body</Text>
                            <Text style={styles.meteorInfoValue}>{selectedEvent.asteroidData.orbitingBody}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedEvent.asteroidData.isHazardous !== undefined && (
                        <View style={styles.meteorInfoRow}>
                          <View style={styles.meteorInfoIcon}>
                            <MaterialCommunityIcons 
                              name={selectedEvent.asteroidData.isHazardous ? "alert-circle" : "shield-check"} 
                              size={20} 
                              color={selectedEvent.asteroidData.isHazardous ? Colors.error : Colors.success} 
                            />
                          </View>
                          <View style={styles.meteorInfoText}>
                            <Text style={styles.meteorInfoLabel}>Hazard Status</Text>
                            <Text style={[
                              styles.meteorInfoValue,
                              { color: selectedEvent.asteroidData.isHazardous ? Colors.error : Colors.success }
                            ]}>
                              {selectedEvent.asteroidData.isHazardous ? 'Potentially Hazardous' : 'Not Hazardous'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </GlassCard>
                    
                    {selectedEvent.asteroidData.isHazardous && (
                      <GlassCard style={[styles.notableYearsCard, { borderColor: Colors.error, borderWidth: 1 }]}>
                        <View style={styles.notableYearsHeader}>
                          <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.error} />
                          <Text style={[styles.notableYearsTitle, { color: Colors.error }]}>Potentially Hazardous Asteroid</Text>
                        </View>
                        <Text style={styles.notableYearsText}>
                          This asteroid is classified as potentially hazardous based on its size and close approach distance. 
                          However, there is no immediate threat to Earth.
                        </Text>
                      </GlassCard>
                    )}
                  </View>
                )}

                {/* About Section */}
                {selectedEvent.description && selectedEvent.type !== 'meteor' && selectedEvent.type !== 'asteroid' && (
                  <View style={styles.modalAboutSection}>
                    <Text style={styles.modalAboutTitle}>About</Text>
                    <Text style={styles.modalAboutText}>{selectedEvent.description}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalFooter}>
                  {getLaunchEventUrl(selectedEvent) && (
                    <GradientButton
                      title="View Details"
                      onPress={() => {
                        const url = getLaunchEventUrl(selectedEvent);
                        if (url) {
                          Linking.openURL(url).catch(() => {
                            // Silently fail
                          });
                        }
                      }}
                      variant="secondary"
                      icon={<MaterialIcons name="open-in-new" size={20} color={Colors.text} />}
                      style={{ marginBottom: 12 }}
                    />
                  )}
                  <GradientButton
                    title={addingToCalendar ? 'Adding...' : 'Add to Calendar'}
                    onPress={() => {
                      if (selectedEvent && !addingToCalendar) {
                        handleAddToCalendar(selectedEvent);
                      }
                    }}
                    disabled={addingToCalendar}
                    loading={addingToCalendar}
                    icon={!addingToCalendar ? <MaterialIcons name="event" size={20} color={Colors.text} /> : undefined}
                  />
                </View>

                <DataSourceLabel source={selectedEvent.source} />
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topSectionWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  monthNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  list: {
    flex: 1,
    zIndex: 1,
  },
  listContent: {
    paddingBottom: 100, // Extra padding for tab bar
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    zIndex: 1,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  eventsList: {
    gap: 12,
    marginTop: 12,
  },
  eventCard: {
    marginBottom: 0,
  },
  eventCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  eventIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCardContent: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  eventCardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  eventCardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventCardTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFavoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconSquare: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  modalBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  modalBadgeText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modalEventTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  modalInfoCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalInfoText: {
    flex: 1,
  },
  modalInfoLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalInfoValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  modalAboutSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  modalAboutTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalAboutText: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  // Meteor shower details styles
  meteorInfoCard: {
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
  },
  meteorInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  meteorInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  meteorInfoText: {
    flex: 1,
  },
  meteorInfoLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  meteorInfoValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  viewingTipsSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  viewingTipsTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  viewingTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  viewingTipIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  viewingTipText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  notableYearsCard: {
    marginTop: 8,
    padding: 16,
  },
  notableYearsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  notableYearsTitle: {
    color: Colors.warning,
    fontSize: 16,
    fontWeight: '700',
  },
  notableYearsText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  // Filter Modal styles
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 0,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  filterModalCloseButton: {
    padding: 4,
  },
  filterOptions: {
    padding: 20,
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.cardSolid,
    borderColor: Colors.primary,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  filterOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  filterResetButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterResetText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  filterApplyButton: {
    flex: 1,
  },
});