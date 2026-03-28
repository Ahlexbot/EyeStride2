import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function WalkResetScreen({ navigation }) {
  const { state, completeWalkReset } = useApp();
  const { settings } = state;
  const targetSteps = settings.walkStepCount;

  const [isPedometerAvailable, setIsPedometerAvailable] = useState(null);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const completedAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const subscriptionRef = useRef(null);
  const timerRef = useRef(null);
  const baseStepsRef = useRef(null);

  useEffect(() => {
    checkPedometer();
    setStartTime(Date.now());

    // Elapsed time counter
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Animate progress
    const progress = Math.min(currentSteps / targetSteps, 1);
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 40,
      friction: 10,
      useNativeDriver: false,
    }).start();

    // Bounce on each step
    if (currentSteps > 0 && !completed) {
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }

    // Check completion
    if (currentSteps >= targetSteps && !completed) {
      handleComplete();
    }
  }, [currentSteps]);

  const checkPedometer = async () => {
    const available = await Pedometer.isAvailableAsync();
    setIsPedometerAvailable(available);

    if (available) {
      // Subscribe to live step updates
      subscriptionRef.current = Pedometer.watchStepCount(result => {
        if (baseStepsRef.current === null) {
          baseStepsRef.current = result.steps;
        }
        const newSteps = result.steps - baseStepsRef.current;
        setCurrentSteps(newSteps);
      });
    } else {
      // Simulate steps for testing (remove in production)
      simulateSteps();
    }
  };

  const simulateSteps = () => {
    // Simulates walking at ~2 steps/second for demo purposes
    let steps = 0;
    const interval = setInterval(() => {
      steps += 1;
      setCurrentSteps(steps);
      if (steps >= targetSteps) {
        clearInterval(interval);
      }
    }, 500);

    subscriptionRef.current = { remove: () => clearInterval(interval) };
  };

  const handleComplete = () => {
    setCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    Animated.spring(completedAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Auto-navigate back
    setTimeout(() => {
      completeWalkReset(currentSteps);
      navigation.goBack();
    }, 2500);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min(currentSteps / targetSteps, 1);
  const stepsRemaining = Math.max(targetSteps - currentSteps, 0);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="walk-outline" size={24} color="#00D28C" />
          <Text style={styles.headerTitle}>Walk Reset</Text>
        </View>

        {/* Pedometer status */}
        <View style={styles.statusBar}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isPedometerAvailable ? '#00D28C' : '#FFD60A' },
            ]}
          />
          <Text style={styles.statusText}>
            {isPedometerAvailable === null
              ? 'Checking pedometer...'
              : isPedometerAvailable
              ? 'Pedometer active — start walking!'
              : 'Simulated mode (pedometer unavailable)'}
          </Text>
        </View>

        {/* Main step counter */}
        <View style={styles.counterSection}>
          {completed ? (
            <Animated.View
              style={[
                styles.completedWrap,
                {
                  transform: [{ scale: completedAnim }],
                  opacity: completedAnim,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={80} color="#00D28C" />
              <Text style={styles.completedText}>Walk complete!</Text>
              <Text style={styles.completedSub}>
                {currentSteps} steps in {formatTime(elapsedTime)}
              </Text>
              <Text style={styles.completedUnlock}>Unlocking your apps...</Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
                <Text style={styles.stepCount}>{currentSteps}</Text>
              </Animated.View>
              <Text style={styles.stepTarget}>of {targetSteps} steps</Text>

              {/* Visual progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: progressWidth },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>

              {/* Step milestones */}
              <View style={styles.milestones}>
                {[0.25, 0.5, 0.75, 1].map((milestone, i) => (
                  <View
                    key={i}
                    style={[
                      styles.milestone,
                      progress >= milestone && styles.milestoneReached,
                    ]}
                  >
                    <Ionicons
                      name={progress >= milestone ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={progress >= milestone ? '#00D28C' : '#2A2A3E'}
                    />
                    <Text
                      style={[
                        styles.milestoneText,
                        progress >= milestone && styles.milestoneTextReached,
                      ]}
                    >
                      {Math.round(targetSteps * milestone)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Stats during walk */}
        {!completed && (
          <View style={styles.walkStats}>
            <View style={styles.walkStat}>
              <Ionicons name="time-outline" size={20} color="#8E8E93" />
              <Text style={styles.walkStatValue}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.walkStatLabel}>Time</Text>
            </View>
            <View style={styles.walkStatDivider} />
            <View style={styles.walkStat}>
              <Ionicons name="footsteps-outline" size={20} color="#8E8E93" />
              <Text style={styles.walkStatValue}>{stepsRemaining}</Text>
              <Text style={styles.walkStatLabel}>Remaining</Text>
            </View>
            <View style={styles.walkStatDivider} />
            <View style={styles.walkStat}>
              <Ionicons name="speedometer-outline" size={20} color="#8E8E93" />
              <Text style={styles.walkStatValue}>
                {elapsedTime > 0 ? (currentSteps / (elapsedTime / 60)).toFixed(0) : '0'}
              </Text>
              <Text style={styles.walkStatLabel}>Steps/min</Text>
            </View>
          </View>
        )}

        {/* Encouragement */}
        {!completed && (
          <View style={styles.encouragement}>
            <Text style={styles.encourageText}>
              {progress < 0.25
                ? '🚶 Get moving! Every step counts.'
                : progress < 0.5
                ? '💪 Great start! Keep it up!'
                : progress < 0.75
                ? '🔥 More than halfway there!'
                : '⚡ Almost done — push through!'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#13131F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  counterSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontSize: 72,
    fontWeight: '900',
    color: '#00D28C',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  stepTarget: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: -8,
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#1C1C2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D28C',
    borderRadius: 4,
  },
  progressPercent: {
    color: '#00D28C',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    width: 40,
    textAlign: 'right',
  },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  milestone: {
    alignItems: 'center',
    gap: 4,
  },
  milestoneReached: {},
  milestoneText: {
    color: '#2A2A3E',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  milestoneTextReached: {
    color: '#00D28C',
  },
  completedWrap: {
    alignItems: 'center',
    gap: 12,
  },
  completedText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00D28C',
  },
  completedSub: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completedUnlock: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 8,
  },
  walkStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1C1C2E',
    width: '100%',
  },
  walkStat: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  walkStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  walkStatLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  walkStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#1C1C2E',
  },
  encouragement: {
    paddingBottom: 30,
  },
  encourageText: {
    color: '#555566',
    fontSize: 15,
    fontWeight: '500',
  },
});
