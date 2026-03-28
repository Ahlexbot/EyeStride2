import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

export default function LockScreen({ navigation }) {
  const { state } = useApp();
  const { pendingResets, settings } = state;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // If fully unlocked, go back
  useEffect(() => {
    if (pendingResets.length === 0) {
      navigation.goBack();
    }
  }, [pendingResets]);

  const hasEye = pendingResets.includes('eye');
  const hasWalk = pendingResets.includes('walk');

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Lock icon */}
        <View style={styles.lockIconWrap}>
          <Ionicons name="lock-closed" size={56} color="#FF4757" />
        </View>

        <Text style={styles.title}>Time for a Reset</Text>
        <Text style={styles.subtitle}>
          Complete the following to unlock your apps
        </Text>

        {/* Reset tasks */}
        <View style={styles.taskList}>
          {hasEye && (
            <TouchableOpacity
              style={styles.taskCard}
              onPress={() => navigation.navigate('EyeReset')}
              activeOpacity={0.8}
            >
              <View style={styles.taskIconWrap}>
                <Ionicons name="eye-outline" size={28} color="#6C63FF" />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>Eye Reset</Text>
                <Text style={styles.taskDesc}>
                  Look away from your screen for {settings.eyeLookAwayDuration} seconds
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#6C63FF" />
            </TouchableOpacity>
          )}

          {hasWalk && (
            <TouchableOpacity
              style={[styles.taskCard, styles.taskCardGreen]}
              onPress={() => navigation.navigate('WalkReset')}
              activeOpacity={0.8}
            >
              <View style={[styles.taskIconWrap, styles.taskIconGreen]}>
                <Ionicons name="walk-outline" size={28} color="#00D28C" />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>Walk Reset</Text>
                <Text style={styles.taskDesc}>
                  Walk {settings.walkStepCount} steps to unlock
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#00D28C" />
            </TouchableOpacity>
          )}
        </View>

        {hasEye && hasWalk && (
          <Text style={styles.bothNote}>
            Both resets are required to unlock
          </Text>
        )}

        {/* Motivational text */}
        <View style={styles.motivationWrap}>
          <Text style={styles.motivationText}>
            Your eyes and body will thank you
          </Text>
          <Text style={styles.motivationEmoji}>👁️ 🚶‍♂️ ✨</Text>
        </View>
      </Animated.View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  taskList: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131F',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    gap: 16,
  },
  taskCardGreen: {
    borderColor: 'rgba(0, 210, 140, 0.3)',
  },
  taskIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconGreen: {
    backgroundColor: 'rgba(0, 210, 140, 0.15)',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  bothNote: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  motivationWrap: {
    marginTop: 40,
    alignItems: 'center',
  },
  motivationText: {
    color: '#555566',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  motivationEmoji: {
    fontSize: 24,
    letterSpacing: 8,
  },
});
