import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Launch } from '../types';
import { generateDefaultTimeline } from '../utils/rocketUtils';
import { formatLaunchDate } from '../utils/dateUtils';
import { GlassCard } from './ui';
import { Colors } from '../constants/colors';

// Try to import Reanimated, but handle gracefully if it fails
let Animated: any;
let useAnimatedStyle: any;
let useSharedValue: any;
let withTiming: any;
let withSpring: any;
let FadeInUp: any;
let AnimatedView: any;
let Easing: any;
let reanimatedAvailable = false;

try {
  const Reanimated = require('react-native-reanimated');
  Animated = Reanimated.default;
  useAnimatedStyle = Reanimated.useAnimatedStyle;
  useSharedValue = Reanimated.useSharedValue;
  withTiming = Reanimated.withTiming;
  withSpring = Reanimated.withSpring;
  FadeInUp = Reanimated.FadeInUp;
  Easing = Reanimated.Easing;
  AnimatedView = Reanimated.default.createAnimatedComponent(View);
  reanimatedAvailable = true;
} catch (error) {
  if (__DEV__) console.warn('Reanimated not available, using fallback animations');
  AnimatedView = View;
  reanimatedAvailable = false;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
}

interface MissionTimelineProps {
  launch: Launch;
  timelineData?: TimelineEvent[];
}

export const MissionTimeline = React.memo<MissionTimelineProps>(({
  launch,
  timelineData,
}) => {
  // Memoize timeline to prevent recreation on every render
  const timeline = useMemo(() => {
    return timelineData || generateDefaultTimeline(launch);
  }, [timelineData, launch.id, launch.net]);
  
  const [itemOpacities, setItemOpacities] = useState<number[]>([]);
  const [itemScales, setItemScales] = useState<number[]>([]);
  const hasAnimatedRef = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Only animate once per launch
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;
    
    // Initialize all items as visible (will fade in if reanimated works)
    const initialOpacities = timeline.map(() => reanimatedAvailable ? 1 : 0);
    const initialScales = timeline.map(() => reanimatedAvailable ? 1 : 0.95);
    setItemOpacities(initialOpacities);
    setItemScales(initialScales);
    
    if (!reanimatedAvailable) {
      // Fallback: simple fade-in and scale-up using setTimeout
      timeline.forEach((_, i) => {
        const timeoutId = setTimeout(() => {
          setItemOpacities(prev => {
            // Use functional update to avoid stale closure issues
            const newOpacities = [...prev];
            if (newOpacities[i] !== undefined) {
              newOpacities[i] = 1;
            }
            return newOpacities;
          });
          setItemScales(prev => {
            const newScales = [...prev];
            if (newScales[i] !== undefined) {
              newScales[i] = 1;
            }
            return newScales;
          });
        }, i * 100);
        timeoutRefs.current.push(timeoutId);
      });
    }
    
    // Cleanup function
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current = [];
      hasAnimatedRef.current = false;
    };
  }, [timeline.length, launch.id]); // Only depend on length and launch.id, not the array itself

  const getIconName = (icon: string): any => {
    const iconMap: Record<string, any> = {
      'rocket-launch': 'rocket-launch',
      'speedometer': 'speedometer',
      'engine-off': 'engine-off-outline',
      'layers': 'layers',
      'rocket': 'rocket',
      'package': 'package-variant',
      'satellite': 'satellite-variant',
    };
    return iconMap[icon] || 'rocket-launch';
  };

  const getRelativeTime = (eventTime: string): string => {
    const launchTime = new Date(launch.net);
    const event = new Date(eventTime);
    const diffSeconds = Math.floor((event.getTime() - launchTime.getTime()) / 1000);
    
    if (diffSeconds < 0) {
      const absSeconds = Math.abs(diffSeconds);
      const hours = Math.floor(absSeconds / 3600);
      const minutes = Math.floor((absSeconds % 3600) / 60);
      const secs = absSeconds % 60;
      return `T-${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else if (diffSeconds === 0) {
      return 'T+00:00:00';
    } else {
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const secs = diffSeconds % 60;
      return `T+${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  };

  const getEventStatus = (eventTime: string): 'completed' | 'active' | 'pending' => {
    const now = new Date();
    const event = new Date(eventTime);
    const launchTime = new Date(launch.net);
    
    // If launch hasn't happened yet, all events are pending
    if (now < launchTime) {
      // Find the current/active event (closest upcoming)
      const timelineIndex = timeline.findIndex(e => new Date(e.time) >= now);
      const currentIndex = timeline.findIndex(e => e.time === eventTime);
      
      if (currentIndex === timelineIndex && timelineIndex >= 0) {
        return 'active';
      }
      return currentIndex < timelineIndex ? 'completed' : 'pending';
    }
    
    // Launch has happened
    return now >= event ? 'completed' : 'pending';
  };

  const getCurrentStatus = (): string => {
    const now = new Date();
    const launchTime = new Date(launch.net);
    
    if (now < launchTime) {
      // Find the current active event
      const activeEvent = timeline.find(e => {
        const eventTime = new Date(e.time);
        return eventTime <= now && eventTime >= launchTime;
      });
      return activeEvent ? activeEvent.title : 'Pre-Launch';
    }
    
    return 'In Flight';
  };

  return (
    <View style={styles.container}>
      {/* Status Card */}
      <GlassCard style={styles.statusCard}>
        <View style={styles.statusCardContent}>
          <View>
            <Text style={styles.statusLabel}>Current Status</Text>
            <Text style={styles.statusValue}>{getCurrentStatus()}</Text>
          </View>
          <View style={styles.statusIcon}>
            <MaterialIcons name="access-time" size={32} color={Colors.successLight} />
          </View>
        </View>
      </GlassCard>

      <View style={styles.timelineContainer}>
        {/* Vertical line */}
        <View style={styles.lineContainer}>
          <View style={styles.lineBackground} />
        </View>

        {/* Timeline events */}
        {timeline.map((event, index) => {
          const status = getEventStatus(event.time);
          const isLast = index === timeline.length - 1;
          
          return (
            <View key={event.id} style={styles.eventContainer}>
              {/* Connector Line */}
              <View style={[
                styles.connectorLine,
                isLast ? { height: '50%' } : { height: '100%' }, // Stop line at last item center
                status === 'completed' && styles.connectorCompleted,
                status === 'active' && styles.connectorActive,
                status === 'pending' && styles.connectorPending,
              ]} />
              
              {/* Icon Circle */}
              <View style={styles.iconContainer}>
                <View style={[
                  styles.iconCircle,
                  status === 'completed' && styles.iconCircleCompleted,
                  status === 'active' && styles.iconCircleActive,
                  status === 'pending' && styles.iconCirclePending,
                ]}>
                  {status === 'completed' ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : status === 'active' ? (
                    <MaterialIcons name="bolt" size={24} color={Colors.text} />
                  ) : (
                    <View style={styles.pendingDot} />
                  )}
                </View>
              </View>
              
              {/* Event Card */}
              <GlassCard style={[
                styles.eventCard,
                status === 'active' && styles.eventCardActive,
              ]}>
                <Text style={[
                  styles.eventTime,
                  status === 'completed' && styles.eventTimeCompleted,
                  status === 'active' && styles.eventTimeActive,
                  status === 'pending' && styles.eventTimePending,
                ]}>
                  {getRelativeTime(event.time)}
                </Text>
                <Text style={[
                  styles.eventTitle,
                  status === 'active' && styles.eventTitleActive,
                ]}>
                  {event.title}
                </Text>
              </GlassCard>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  statusCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
  },
  statusCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: Colors.successLight,
    fontSize: 14,
    marginBottom: 4,
  },
  statusValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContainer: {
    paddingBottom: 20,
    position: 'relative',
    paddingLeft: 24,
    paddingRight: 24,
  },
  lineContainer: {
    position: 'absolute',
    left: 48, // 24 padding + 24 (center of 48 width icon)
    top: 0,
    bottom: 0,
    width: 2,
  },
  lineBackground: {
    width: 2,
    backgroundColor: Colors.borderSolid,
    height: '100%',
  },
  eventContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    left: 24, // Center of 48 width icon
    top: 24, // Start at center of icon
    bottom: -32, // Extend through margin to next icon
    width: 2,
    zIndex: 0,
  },
  connectorCompleted: {
    backgroundColor: Colors.success,
  },
  connectorActive: {
    backgroundColor: Colors.primary,
  },
  connectorPending: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
  },
  iconContainer: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center', // Center vertically
    marginRight: 0,
    zIndex: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background, // Ensure background covers line
  },
  iconCircleCompleted: {
    backgroundColor: Colors.success,
  },
  iconCircleActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCirclePending: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)', // Transparent center for pending?
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.textPurple,
  },
  eventCard: {
    flex: 1,
    marginLeft: 16,
    padding: 16,
  },
  eventCardActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: Colors.primary,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  eventTimeCompleted: {
    color: Colors.successLight,
  },
  eventTimeActive: {
    color: Colors.textTertiary,
  },
  eventTimePending: {
    color: Colors.textPurple,
  },
  eventTitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  eventTitleActive: {
    color: Colors.text,
  },
});

