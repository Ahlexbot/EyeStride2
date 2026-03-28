import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

// Default settings
const DEFAULT_SETTINGS = {
  // Eye Reset
  eyeResetEnabled: true,
  eyeScrollInterval: 20, // minutes of scrolling before lock
  eyeLookAwayDuration: 20, // seconds to look away
  
  // Walking Reset
  walkResetEnabled: false,
  walkScrollInterval: 30, // minutes of scrolling before lock
  walkStepCount: 100, // steps required to unlock
  
  // Monitored apps (simulated - in real app this would use Screen Time API)
  monitoredApps: [],
  
  // Available apps (simulated list for demo)
  availableApps: [
    { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', category: 'Social' },
    { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', category: 'Social' },
    { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter', category: 'Social' },
    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', category: 'Social' },
    { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', category: 'Social' },
    { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', category: 'Social' },
    { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', category: 'Entertainment' },
    { id: 'netflix', name: 'Netflix', icon: 'film', category: 'Entertainment' },
    { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', category: 'Entertainment' },
    { id: 'discord', name: 'Discord', icon: 'logo-discord', category: 'Social' },
    { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', category: 'Social' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', category: 'Social' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', category: 'Messaging' },
    { id: 'telegram', name: 'Telegram', icon: 'paper-plane', category: 'Messaging' },
    { id: 'safari', name: 'Safari', icon: 'compass', category: 'Browsing' },
    { id: 'chrome', name: 'Chrome', icon: 'logo-chrome', category: 'Browsing' },
  ],
};

const DEFAULT_STATS = {
  currentStreak: 0,
  longestStreak: 0,
  totalEyeResets: 0,
  totalWalkResets: 0,
  totalStepsTaken: 0,
  totalLookAwaySeconds: 0,
  todayEyeResets: 0,
  todayWalkResets: 0,
  todaySteps: 0,
  lastActiveDate: null,
  weeklyHistory: [], // [{date, eyeResets, walkResets, steps}]
};

const DEFAULT_STATE = {
  settings: DEFAULT_SETTINGS,
  stats: DEFAULT_STATS,
  // Timer state
  eyeTimerActive: false,
  eyeTimerSeconds: 0, // counts up to eyeScrollInterval * 60
  walkTimerActive: false,
  walkTimerSeconds: 0, // counts up to walkScrollInterval * 60
  // Lock state
  isLocked: false,
  lockType: null, // 'eye', 'walk', or 'both'
  pendingResets: [], // ['eye', 'walk'] - what needs to be completed
  // Session
  isMonitoring: false,
  loaded: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...state, ...action.payload, loaded: true };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'TOGGLE_MONITORED_APP': {
      const appId = action.payload;
      const current = state.settings.monitoredApps;
      const updated = current.includes(appId)
        ? current.filter(id => id !== appId)
        : [...current, appId];
      return {
        ...state,
        settings: { ...state.settings, monitoredApps: updated },
      };
    }

    case 'START_MONITORING':
      return {
        ...state,
        isMonitoring: true,
        eyeTimerActive: state.settings.eyeResetEnabled,
        walkTimerActive: state.settings.walkResetEnabled,
        eyeTimerSeconds: 0,
        walkTimerSeconds: 0,
      };

    case 'STOP_MONITORING':
      return {
        ...state,
        isMonitoring: false,
        eyeTimerActive: false,
        walkTimerActive: false,
        eyeTimerSeconds: 0,
        walkTimerSeconds: 0,
        isLocked: false,
        lockType: null,
        pendingResets: [],
      };

    case 'TICK_TIMERS': {
      let newState = { ...state };
      const eyeLimit = state.settings.eyeScrollInterval * 60;
      const walkLimit = state.settings.walkScrollInterval * 60;
      let shouldLock = false;
      let pending = [...state.pendingResets];

      if (state.eyeTimerActive && !state.isLocked) {
        newState.eyeTimerSeconds = state.eyeTimerSeconds + 1;
        if (newState.eyeTimerSeconds >= eyeLimit) {
          shouldLock = true;
          if (!pending.includes('eye')) pending.push('eye');
        }
      }

      if (state.walkTimerActive && !state.isLocked) {
        newState.walkTimerSeconds = state.walkTimerSeconds + 1;
        if (newState.walkTimerSeconds >= walkLimit) {
          shouldLock = true;
          if (!pending.includes('walk')) pending.push('walk');
        }
      }

      if (shouldLock) {
        newState.isLocked = true;
        newState.pendingResets = pending;
        newState.lockType = pending.length > 1 ? 'both' : pending[0];
      }

      return newState;
    }

    case 'COMPLETE_EYE_RESET': {
      const today = new Date().toISOString().split('T')[0];
      const newPending = state.pendingResets.filter(r => r !== 'eye');
      const isFullyUnlocked = newPending.length === 0;
      return {
        ...state,
        pendingResets: newPending,
        isLocked: !isFullyUnlocked,
        lockType: isFullyUnlocked ? null : newPending[0],
        eyeTimerSeconds: 0,
        stats: {
          ...state.stats,
          totalEyeResets: state.stats.totalEyeResets + 1,
          todayEyeResets: state.stats.todayEyeResets + 1,
          totalLookAwaySeconds: state.stats.totalLookAwaySeconds + state.settings.eyeLookAwayDuration,
          lastActiveDate: today,
        },
      };
    }

    case 'COMPLETE_WALK_RESET': {
      const today = new Date().toISOString().split('T')[0];
      const stepsCompleted = action.payload?.steps || state.settings.walkStepCount;
      const newPending = state.pendingResets.filter(r => r !== 'walk');
      const isFullyUnlocked = newPending.length === 0;
      return {
        ...state,
        pendingResets: newPending,
        isLocked: !isFullyUnlocked,
        lockType: isFullyUnlocked ? null : newPending[0],
        walkTimerSeconds: 0,
        stats: {
          ...state.stats,
          totalWalkResets: state.stats.totalWalkResets + 1,
          todayWalkResets: state.stats.todayWalkResets + 1,
          totalStepsTaken: state.stats.totalStepsTaken + stepsCompleted,
          todaySteps: state.stats.todaySteps + stepsCompleted,
          lastActiveDate: today,
        },
      };
    }

    case 'UPDATE_STREAK': {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let streak = state.stats.currentStreak;

      if (state.stats.lastActiveDate === today) {
        // Already active today, no change
      } else if (state.stats.lastActiveDate === yesterday) {
        streak += 1;
      } else if (state.stats.lastActiveDate === null) {
        streak = 1;
      } else {
        streak = 1; // Streak broken
      }

      return {
        ...state,
        stats: {
          ...state.stats,
          currentStreak: streak,
          longestStreak: Math.max(streak, state.stats.longestStreak),
        },
      };
    }

    case 'RESET_DAILY_STATS': {
      const today = new Date().toISOString().split('T')[0];
      if (state.stats.lastActiveDate !== today) {
        return {
          ...state,
          stats: {
            ...state.stats,
            todayEyeResets: 0,
            todayWalkResets: 0,
            todaySteps: 0,
          },
        };
      }
      return state;
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_STATE);
  const timerRef = useRef(null);

  // Load saved state on mount
  useEffect(() => {
    loadState();
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (state.loaded) {
      saveState();
    }
  }, [state.settings, state.stats]);

  // Timer tick
  useEffect(() => {
    if (state.isMonitoring && !state.isLocked) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_TIMERS' });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isMonitoring, state.isLocked]);

  const loadState = async () => {
    try {
      const saved = await AsyncStorage.getItem('stridereset_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
            stats: { ...DEFAULT_STATS, ...parsed.stats },
          },
        });
      } else {
        dispatch({ type: 'LOAD_STATE', payload: {} });
      }
    } catch (e) {
      console.log('Failed to load state:', e);
      dispatch({ type: 'LOAD_STATE', payload: {} });
    }
  };

  const saveState = async () => {
    try {
      await AsyncStorage.setItem(
        'stridereset_state',
        JSON.stringify({ settings: state.settings, stats: state.stats })
      );
    } catch (e) {
      console.log('Failed to save state:', e);
    }
  };

  const updateSettings = useCallback((updates) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
  }, []);

  const toggleMonitoredApp = useCallback((appId) => {
    dispatch({ type: 'TOGGLE_MONITORED_APP', payload: appId });
  }, []);

  const startMonitoring = useCallback(() => {
    dispatch({ type: 'RESET_DAILY_STATS' });
    dispatch({ type: 'UPDATE_STREAK' });
    dispatch({ type: 'START_MONITORING' });
  }, []);

  const stopMonitoring = useCallback(() => {
    dispatch({ type: 'STOP_MONITORING' });
  }, []);

  const completeEyeReset = useCallback(() => {
    dispatch({ type: 'COMPLETE_EYE_RESET' });
  }, []);

  const completeWalkReset = useCallback((steps) => {
    dispatch({ type: 'COMPLETE_WALK_RESET', payload: { steps } });
  }, []);

  const value = {
    state,
    updateSettings,
    toggleMonitoredApp,
    startMonitoring,
    stopMonitoring,
    completeEyeReset,
    completeWalkReset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export default AppContext;
