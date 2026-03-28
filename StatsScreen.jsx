import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { state } = useApp();
  const { stats } = state;

  const StatBox = ({ icon, iconColor, bgColor, value, label, sublabel }) => (
    <View style={[styles.statBox, { borderColor: bgColor }]}>
      <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
    </View>
  );

  // Generate fake weekly data for demo (in production, pull from stats.weeklyHistory)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay(); // 0=Sun
  const adjustedToday = today === 0 ? 6 : today - 1; // 0=Mon

  const weeklyData = weekDays.map((day, i) => ({
    day,
    eyeResets: i <= adjustedToday ? Math.floor(Math.random() * 8) + 2 : 0,
    walkResets: i <= adjustedToday ? Math.floor(Math.random() * 4) + 1 : 0,
    isToday: i === adjustedToday,
    isFuture: i > adjustedToday,
  }));

  const maxResets = Math.max(...weeklyData.map(d => d.eyeResets + d.walkResets), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Streak Section */}
      <View style={styles.streakSection}>
        <View style={styles.streakMain}>
          <Ionicons name="flame" size={40} color="#FF6B35" />
          <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>
        <View style={styles.streakBest}>
          <Text style={styles.streakBestLabel}>Best</Text>
          <Text style={styles.streakBestValue}>{stats.longestStreak}</Text>
          <Text style={styles.streakBestLabel}>days</Text>
        </View>
      </View>

      {/* All-time Stats Grid */}
      <Text style={styles.sectionTitle}>All Time</Text>
      <View style={styles.statsGrid}>
        <StatBox
          icon="eye"
          iconColor="#6C63FF"
          bgColor="rgba(108, 99, 255, 0.12)"
          value={stats.totalEyeResets}
          label="Eye Resets"
        />
        <StatBox
          icon="walk"
          iconColor="#00D28C"
          bgColor="rgba(0, 210, 140, 0.12)"
          value={stats.totalWalkResets}
          label="Walk Resets"
        />
        <StatBox
          icon="footsteps"
          iconColor="#FF6B35"
          bgColor="rgba(255, 107, 53, 0.12)"
          value={stats.totalStepsTaken.toLocaleString()}
          label="Steps Taken"
        />
        <StatBox
          icon="time"
          iconColor="#FFD60A"
          bgColor="rgba(255, 214, 10, 0.12)"
          value={`${Math.round(stats.totalLookAwaySeconds / 60)}m`}
          label="Eyes Rested"
        />
      </View>

      {/* Weekly Chart */}
      <Text style={styles.sectionTitle}>This Week</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6C63FF' }]} />
            <Text style={styles.legendText}>Eye Resets</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00D28C' }]} />
            <Text style={styles.legendText}>Walk Resets</Text>
          </View>
        </View>
        <View style={styles.chartBars}>
          {weeklyData.map((data, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barStack}>
                {!data.isFuture && (
                  <>
                    <View
                      style={[
                        styles.barSegment,
                        {
                          height: `${(data.walkResets / maxResets) * 100}%`,
                          backgroundColor: '#00D28C',
                          borderTopLeftRadius: data.eyeResets === 0 ? 4 : 0,
                          borderTopRightRadius: data.eyeResets === 0 ? 4 : 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.barSegment,
                        {
                          height: `${(data.eyeResets / maxResets) * 100}%`,
                          backgroundColor: '#6C63FF',
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                        },
                      ]}
                    />
                  </>
                )}
              </View>
              <Text style={[styles.barLabel, data.isToday && styles.barLabelToday]}>
                {data.day}
              </Text>
              {data.isToday && <View style={styles.todayDot} />}
            </View>
          ))}
        </View>
      </View>

      {/* Today's Detail */}
      <Text style={styles.sectionTitle}>Today's Activity</Text>
      <View style={styles.todayCard}>
        <View style={styles.todayRow}>
          <Ionicons name="eye-outline" size={20} color="#6C63FF" />
          <Text style={styles.todayLabel}>Eye Resets Completed</Text>
          <Text style={styles.todayValue}>{stats.todayEyeResets}</Text>
        </View>
        <View style={styles.todayDivider} />
        <View style={styles.todayRow}>
          <Ionicons name="walk-outline" size={20} color="#00D28C" />
          <Text style={styles.todayLabel}>Walk Resets Completed</Text>
          <Text style={styles.todayValue}>{stats.todayWalkResets}</Text>
        </View>
        <View style={styles.todayDivider} />
        <View style={styles.todayRow}>
          <Ionicons name="footsteps-outline" size={20} color="#FF6B35" />
          <Text style={styles.todayLabel}>Steps Walked</Text>
          <Text style={styles.todayValue}>{stats.todaySteps}</Text>
        </View>
      </View>

      {/* Health tip */}
      <View style={styles.healthTip}>
        <Ionicons name="heart" size={18} color="#FF4757" />
        <Text style={styles.healthTipText}>
          Regular movement breaks reduce eye strain by up to 50% and improve focus throughout the day.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131F',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  streakMain: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  streakNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FF6B35',
    fontVariant: ['tabular-nums'],
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  streakBest: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  streakBestLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  streakBestValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    width: (width - 50) / 2,
    backgroundColor: '#13131F',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statSublabel: {
    fontSize: 11,
    color: '#555566',
  },
  chartCard: {
    backgroundColor: '#13131F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barStack: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barSegment: {
    width: '100%',
    minHeight: 2,
  },
  barLabel: {
    color: '#555566',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  barLabelToday: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6C63FF',
    marginTop: 4,
  },
  todayCard: {
    backgroundColor: '#13131F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  todayLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  todayValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  todayDivider: {
    height: 1,
    backgroundColor: '#1C1C2E',
    marginVertical: 4,
  },
  healthTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 71, 87, 0.06)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.12)',
  },
  healthTipText: {
    flex: 1,
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 19,
  },
});
