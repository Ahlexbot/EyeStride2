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
import { Camera } from 'expo-camera';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function EyeResetScreen({ navigation }) {
  const { state, completeEyeReset } = useApp();
  const { settings } = state;
  const duration = settings.eyeLookAwayDuration;

  const [hasPermission, setHasPermission] = useState(null);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(duration);
  const [completed, setCompleted] = useState(false);
  const [gazeStatus, setGazeStatus] = useState('detecting');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const completedAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        // Start gaze detection simulation after a brief delay
        setTimeout(() => startGazeDetection(), 1500);
      }
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGazeDetection = () => {
    // In a real app, this would use TensorFlow.js or Apple Vision
    // to detect face orientation. For the prototype, we simulate
    // detection after the user turns away.
    setGazeStatus('ready');

    // Simulate: after 2 seconds, detect user looking away
    // In production: use face detection to check if face is NOT in frame
    // (meaning user is looking away from screen)
    setTimeout(() => {
      setIsLookingAway(true);
      setGazeStatus('looking_away');
      startCountdown();
    }, 2000);
  };

  const startCountdown = () => {
    let remaining = duration;

    // Animate the progress ring
    Animated.timing(ringAnim, {
      toValue: 1,
      duration: duration * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        handleComplete();
      }
    }, 1000);
  };

  const handleComplete = () => {
    setCompleted(true);
    setGazeStatus('complete');

    Animated.spring(completedAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Auto-navigate back after success animation
    setTimeout(() => {
      completeEyeReset();
      navigation.goBack();
    }, 2000);
  };

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const renderCameraView = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera-outline" size={40} color="#8E8E93" />
          <Text style={styles.cameraPlaceholderText}>Requesting camera access...</Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="warning-outline" size={40} color="#FFD60A" />
          <Text style={styles.cameraPlaceholderText}>
            Camera access needed for gaze detection.{'\n'}
            The timer will run without verification.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <Camera style={styles.camera} type="front" />
        <View style={styles.cameraOverlay}>
          {gazeStatus === 'detecting' && (
            <View style={styles.detectingBadge}>
              <Ionicons name="scan-outline" size={16} color="#6C63FF" />
              <Text style={styles.detectingText}>Initializing gaze detection...</Text>
            </View>
          )}
          {gazeStatus === 'ready' && (
            <View style={styles.detectingBadge}>
              <Ionicons name="eye-outline" size={16} color="#FFD60A" />
              <Text style={[styles.detectingText, { color: '#FFD60A' }]}>
                Now look away from your screen
              </Text>
            </View>
          )}
          {gazeStatus === 'looking_away' && (
            <View style={[styles.detectingBadge, { backgroundColor: 'rgba(0, 210, 140, 0.2)' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#00D28C" />
              <Text style={[styles.detectingText, { color: '#00D28C' }]}>
                Looking away detected ✓
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="eye-outline" size={24} color="#6C63FF" />
          <Text style={styles.headerTitle}>Eye Reset</Text>
        </View>

        {/* Camera preview (small) */}
        <View style={styles.cameraSection}>
          {renderCameraView()}
        </View>

        {/* Main timer circle */}
        <View style={styles.timerSection}>
          {completed ? (
            <Animated.View
              style={[
                styles.completedCircle,
                {
                  transform: [{ scale: completedAnim }],
                  opacity: completedAnim,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={80} color="#00D28C" />
              <Text style={styles.completedText}>Eyes rested!</Text>
              <Text style={styles.completedSub}>Unlocking your apps...</Text>
            </Animated.View>
          ) : (
            <View style={styles.timerCircleWrap}>
              <View style={styles.svgContainer}>
                {/* Background circle */}
                <View style={[styles.circleRing, { borderColor: '#1C1C2E' }]} />
                {/* Progress - simplified without SVG */}
                <View
                  style={[
                    styles.circleRing,
                    {
                      borderColor: isLookingAway ? '#6C63FF' : '#1C1C2E',
                      borderRightColor: 'transparent',
                      transform: [
                        {
                          rotate: `${((duration - secondsRemaining) / duration) * 360}deg`,
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <View style={styles.timerCenter}>
                <Text style={styles.timerNumber}>{secondsRemaining}</Text>
                <Text style={styles.timerUnit}>seconds</Text>
              </View>
            </View>
          )}
        </View>

        {/* Instructions */}
        {!completed && (
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>
              {!isLookingAway
                ? 'Look at something 20+ feet away'
                : 'Keep looking away...'}
            </Text>
            <Text style={styles.instructionSub}>
              {!isLookingAway
                ? 'Turn your head away from the screen to start the timer'
                : 'The camera is verifying you\'re looking away'}
            </Text>
          </View>
        )}

        {/* 20-20-20 Rule Info */}
        <View style={styles.ruleInfo}>
          <Ionicons name="information-circle-outline" size={16} color="#555566" />
          <Text style={styles.ruleInfoText}>
            The 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds
          </Text>
        </View>
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
  cameraSection: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 12,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#13131F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  cameraPlaceholderText: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  detectingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  detectingText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
  },
  timerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timerCircleWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
  },
  timerCenter: {
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  timerUnit: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: -4,
  },
  completedCircle: {
    alignItems: 'center',
    gap: 16,
  },
  completedText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00D28C',
  },
  completedSub: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  instructions: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  instructionSub: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  ruleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  ruleInfoText: {
    flex: 1,
    color: '#555566',
    fontSize: 12,
    lineHeight: 17,
  },
});
