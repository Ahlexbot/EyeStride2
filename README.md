# StrideReset

**Break the scroll. Reset your eyes. Move your body.**

StrideReset is a mobile health app that interrupts excessive screen time with verified physical resets — either looking away from your screen (camera-verified) or walking a set number of steps (pedometer-verified).

---

## Features

### Eye Reset (20-20-20 Rule)
- Configurable screen time interval (default: 20 minutes)
- Camera-verified look-away duration (default: 20 seconds)
- Uses front camera + gaze detection to confirm you're looking away
- Based on the ophthalmologist-recommended 20-20-20 rule

### Walk Reset
- Independent configurable screen time interval
- Step-count verified via device pedometer (default: 100 steps)
- Real-time step counter with progress milestones
- Pace and time tracking during walks

### App Selection
- Choose which specific apps to monitor
- Organized by category (Social, Entertainment, Messaging, Browsing)
- Select all / deselect all for quick setup
- Only selected apps get locked — everything else stays accessible

### Full Customization
- **Eye Reset**: Screen time interval (5–120 min), look-away duration (10–120 sec)
- **Walk Reset**: Screen time interval (5–180 min), step count (20–500 steps)
- Each feature independently toggleable
- Both can run simultaneously with separate timers

### Stats & Streaks
- Daily and all-time statistics
- Current and longest streak tracking
- Weekly activity chart
- Steps walked, resets completed, time spent resting eyes

---

## How to Use with Bolt.new

### Step 1: Go to bolt.new
Sign up for a free account at [bolt.new](https://bolt.new)

### Step 2: Create a new project
Click "Start a new project" and select **React Native / Expo** as the template.

### Step 3: Inject the code
Copy each file from this project into the corresponding location in Bolt's file editor:

```
App.jsx                              → App.jsx (root)
src/context/AppContext.js             → src/context/AppContext.js
src/screens/HomeScreen.jsx            → src/screens/HomeScreen.jsx
src/screens/LockScreen.jsx            → src/screens/LockScreen.jsx
src/screens/EyeResetScreen.jsx        → src/screens/EyeResetScreen.jsx
src/screens/WalkResetScreen.jsx       → src/screens/WalkResetScreen.jsx
src/screens/StatsScreen.jsx           → src/screens/StatsScreen.jsx
src/screens/SettingsScreen.jsx        → src/screens/SettingsScreen.jsx
src/screens/AppSelectorScreen.jsx     → src/screens/AppSelectorScreen.jsx
package.json                          → package.json
app.json                              → app.json
```

### Step 4: Install dependencies
In Bolt's terminal, run:
```bash
npm install
```

### Step 5: Test on your phone
- Install **Expo Go** on your iPhone or Android from the app store
- In Bolt, run `npx expo start`
- Scan the QR code with your phone camera (iOS) or Expo Go app (Android)

### Step 6: Iterate with AI
Now that the code is in Bolt, you can use natural language to modify it:
- "Add a dark/light theme toggle"
- "Make the lock screen show which app triggered the lock"
- "Add sound effects when a reset is completed"
- "Add a weekly goal setting feature"

---

## How to Use with Replit

1. Create a new Repl → choose **React Native** template
2. Copy all files into the same structure as above
3. Run `npm install` in the shell
4. Use the built-in mobile preview or connect Expo Go

---

## Architecture

```
App.jsx                    — Navigation setup (tab + stack navigator)
src/
  context/
    AppContext.js           — Global state (settings, stats, timers, lock state)
  screens/
    HomeScreen.jsx          — Main dashboard with monitoring toggle
    LockScreen.jsx          — Displayed when apps are locked
    EyeResetScreen.jsx      — Camera gaze detection + countdown
    WalkResetScreen.jsx     — Pedometer step counter
    StatsScreen.jsx         — Streaks, charts, activity history
    SettingsScreen.jsx      — All customization controls
    AppSelectorScreen.jsx   — Choose which apps to monitor
```

### State Management
- React Context + useReducer for global state
- AsyncStorage for persistence between sessions
- Timer-based monitoring with 1-second tick resolution

### Sensor Integration
- **Camera**: expo-camera for front-facing camera access
- **Pedometer**: expo-sensors Pedometer API for real step counting
- Both gracefully degrade with simulation mode when hardware is unavailable

---

## What's Simulated vs Real

| Feature | Status | Notes |
|---------|--------|-------|
| UI/UX | ✅ Real | Full app with all screens |
| Settings/Customization | ✅ Real | Persists across sessions |
| Streak Tracking | ✅ Real | Automatic daily tracking |
| Pedometer (steps) | ✅ Real | Works on physical device via Expo Go |
| Camera Access | ✅ Real | Front camera feed works |
| Gaze Detection ML | ⚡ Simulated | Detects "looking away" after delay |
| App Blocking | ⚡ Simulated | Shows lock screen overlay |
| App List | ⚡ Simulated | Preset list (real would use Screen Time API) |

### To make gaze detection real:
Integrate TensorFlow.js with a face landmark model (like MediaPipe Face Mesh) to detect head orientation. When no face is detected in frame → user is looking away.

### To make app blocking real:
Apply for Apple's FamilyControls entitlement (DeviceActivity framework). This requires Apple approval and is only available for apps distributed through the App Store.

---

## Tech Stack

- **React Native** via Expo SDK 50
- **React Navigation** 6.x (bottom tabs + native stack)
- **expo-camera** for camera access
- **expo-sensors** for pedometer
- **AsyncStorage** for local persistence
- **Ionicons** for icons

---

## License

Built for StrideReset. Use freely for your project.
