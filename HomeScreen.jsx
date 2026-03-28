import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { state, startMonitoring, stopMonitoring } = useApp();
  const { settings, stats, isMonitoring, eyeTimerSeconds, walkTimerSeconds, isLocked, pendingResets } = state;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMonitoring) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isMonitoring]);

  // Navigate to lock screen when locked
  useEffect(() => {
    if (isLocked && pendingResets.length > 0) {
      navigation.navigate('LockScreen');
    }
  }, [isLocked, pendingResets]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEyeProgress = () => {
    if (!settings.eyeResetEnabled) return 0;
    return Math.min(eyeTimerSeconds / (settings.eyeScrollInterval * 60), 1);
  };

  const getWalkProgress = () => {
    if (!settings.walkResetEnabled) return 0;
    return Math.min(walkTimerSeconds / (settings.walkScrollInterval * 60), 1);
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(108, 99, 255, 0.0)', 'rgba(108, 99, 255, 0.3)'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Stride</Text>
          <Text style={styles.logoAccent}>Reset</Text>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FF6B35" />
            <Text style={styles.streakText}>{stats.currentStreak}</Text>
          </View>
        </View>

        {/* Main Control */}
        <View style={styles.mainControlSection}>
          <Animated.View
            style={[
              styles.mainButtonOuter,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Animated.View
              style={[
                styles.mainButtonGlow,
                { backgroundColor: glowColor },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.mainButton,
                isMonitoring && styles.mainButtonActive,
              ]}
              onPress={isMonitoring ? stopMonitoring : startMonitoring}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isMonitoring ? 'shield-checkmark' : 'shield-outline'}
                size={48}
                color={isMonitoring ? '#FFFFFF' : '#6C63FF'}
              />
              <Text style={[styles.mainButtonText, isMonitoring && styles.mainButtonTextActive]}>
                {isMonitoring ? 'Protected' : 'Start Protection'}
              </Text>
              <Text style={[styles.mainButtonSub, isMonitoring && styles.mainButtonSubActive]}>
                {isMonitoring
                  ? `Monitoring ${settings.monitoredApps.length} app${settings.monitoredApps.length !== 1 ? 's' : ''}`
                  : 'Tap to begin'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Active Timers */}
        {isMonitoring && (
          <View style={styles.timersSection}>
            {settings.eyeResetEnabled && (
              <View style={styles.timerCard}>
                <View style={styles.timerHeader}>
                  <View style={styles.timerIconWrap}>
                    <Ionicons name="eye-outline" size={20} color="#6C63FF" />
                  </View>
                  <Text style={styles.timerLabel}>Eye Reset</Text>
                  <Text style={styles.timerTime}>
                    {formatTime(settings.eyeScrollInterval * 60 - eyeTimerSeconds)}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${getEyeProgress() * 100}%`,
                        backgroundColor: getEyeProgress() > 0.8 ? '#FF6B35' : '#6C63FF',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.timerDetail}>
                  Look away {settings.eyeLookAwayDuration}s when timer ends
                </Text>
              </View>
            )}

            {settings.walkResetEnabled && (
              <View style={styles.timerCard}>
                <View style={styles.timerHeader}>
                  <View style={[styles.timerIconWrap, { backgroundColor: 'rgba(0, 210, 140, 0.15)' }]}>
                    <Ionicons name="walk-outline" size={20} color="#00D28C" />
                  </View>
                  <Text style={styles.timerLabel}>Walk Reset</Text>
                  <Text style={styles.timerTime}>
                    {formatTime(settings.walkScrollInterval * 60 - walkTimerSeconds)}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${getWalkProgress() * 100}%`,
                        backgroundColor: getWalkProgress() > 0.8 ? '#FF6B35' : '#00D28C',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.timerDetail}>
                  Walk {settings.walkStepCount} steps when timer ends
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="eye" size={24} color="#6C63FF" />
              <Text style={styles.statNumber}>{stats.todayEyeResets}</Text>
              <Text style={styles.statLabel}>Eye Resets</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="walk" size={24} color="#00D28C" />
              <Text style={styles.statNumber}>{stats.todayWalkResets}</Text>
              <Text style={styles.statLabel}>Walk Resets</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="footsteps" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>{stats.todaySteps}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
          </View>
        </View>

        {/* Feature Toggles Quick Access */}
        <View style={styles.quickToggles}>
          <Text style={styles.sectionTitle}>Active Features</Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="eye-outline" size={22} color="#6C63FF" />
              <Text style={styles.toggleLabel}>Eye Reset (20-20-20)</Text>
            </View>
            <View style={[styles.toggleIndicator, settings.eyeResetEnabled && styles.toggleOn]}>
              <Text style={styles.toggleIndicatorText}>
                {settings.eyeResetEnabled ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="walk-outline" size={22} color="#00D28C" />
              <Text style={styles.toggleLabel}>Walk Reset</Text>
            </View>
            <View style={[styles.toggleIndicator, settings.walkResetEnabled && styles.toggleOnGreen]}>
              <Text style={styles.toggleIndicatorText}>
                {settings.walkResetEnabled ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => navigation.navigate('AppSelector')}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="apps-outline" size={22} color="#FF6B35" />
              <Text style={styles.toggleLabel}>Monitored Apps</Text>
            </View>
            <View style={styles.appCount}>
              <Text style={styles.appCountText}>{settings.monitoredApps.length}</Text>
              <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Warning if no apps selected */}
        {settings.monitoredApps.length === 0 && (
          <TouchableOpacity
            style={styles.warningCard}
            onPress={() => navigation.navigate('AppSelector')}
          >
            <Ionicons name="warning-outline" size={24} color="#FFD60A" />
            <View style={styles.warningText}>
              <Text style={styles.warningTitle}>No apps selected</Text>
              <Text style={styles.warningSub}>
                Choose which apps to monitor for screen time resets
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6C63FF',
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    color: '#FF6B35',
    fontWeight: '700',
    fontSize: 15,
  },
  mainControlSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  mainButtonOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  mainButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mainButtonActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#8B83FF',
  },
  mainButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  mainButtonTextActive: {
    color: '#FFFFFF',
  },
  mainButtonSub: {
    color: 'rgba(108, 99, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  mainButtonSubActive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timersSection: {
    gap: 12,
    marginBottom: 24,
  },
  timerCard: {
    backgroundColor: '#13131F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  timerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  timerTime: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1C1C2E',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  timerDetail: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  quickStats: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#13131F',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickToggles: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#13131F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
  },
  toggleOn: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
  },
  toggleOnGreen: {
    backgroundColor: 'rgba(0, 210, 140, 0.2)',
  },
  toggleIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appCountText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '700',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 10, 0.08)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.2)',
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    color: '#FFD60A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  warningSub: {
    color: '#8E8E93',
    fontSize: 12,
  },
});
