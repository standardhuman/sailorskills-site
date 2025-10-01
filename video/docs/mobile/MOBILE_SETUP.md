# BOATY Mobile - Development Environment Setup

Complete guide for setting up React Native development environment.

## Prerequisites

### Required Software
- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Git**
- **Watchman** (macOS/Linux)

### For iOS Development
- **macOS** (required for iOS)
- **Xcode** 14+ with Command Line Tools
- **CocoaPods** (`sudo gem install cocoapods`)
- **iOS Simulator** or physical iPhone

### For Android Development
- **Android Studio** with SDK
- **Java Development Kit** (JDK) 11+
- **Android SDK Platform** 33+
- **Android Emulator** or physical Android device

---

## Quick Start

```bash
# Install dependencies
npm install -g expo-cli react-native-cli

# Create project
npx create-expo-app BOATY-Mobile --template blank
cd BOATY-Mobile

# Install core dependencies
npm install react-navigation @react-navigation/native @react-navigation/stack
npm install react-native-background-upload react-native-wifi-reborn
npm install react-native-fs @react-native-google-signin/google-signin
npm install react-native-video react-native-push-notification
npm install @react-native-community/netinfo react-native-keep-awake
npm install expo-sqlite axios

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

## Detailed Setup

### 1. Install Node.js

**macOS**:
```bash
brew install node watchman
```

**Windows**:
Download from https://nodejs.org

**Linux**:
```bash
sudo apt install nodejs npm
```

### 2. Install Expo CLI

```bash
npm install -g expo-cli
```

### 3. iOS Setup (macOS only)

**Install Xcode**:
1. Download from Mac App Store
2. Install Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Accept license:
   ```bash
   sudo xcodebuild -license accept
   ```

**Install CocoaPods**:
```bash
sudo gem install cocoapods
```

### 4. Android Setup

**Install Android Studio**:
1. Download from https://developer.android.com/studio
2. During install, select:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device

**Configure Environment Variables**:
```bash
# Add to ~/.bash_profile or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Install SDK Platforms**:
```bash
# Open Android Studio > Settings > Android SDK
# Install:
- Android 13 (API 33)
- Android SDK Build-Tools
- Android Emulator
```

---

## Project Setup

### Create Project

```bash
# Using Expo (recommended)
npx create-expo-app BOATY-Mobile --template blank
cd BOATY-Mobile

# Or using React Native CLI
npx react-native init BOATYMobile
cd BOATYMobile
```

### Install Dependencies

```bash
# Core navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# GoPro integration
npm install react-native-wifi-reborn
npm install axios

# File management
npm install react-native-fs
npm install expo-file-system

# YouTube integration
npm install @react-native-google-signin/google-signin

# Background processing
npm install react-native-background-upload
npm install react-native-background-fetch

# Video handling
npm install react-native-video
npm install expo-av

# Notifications
npm install react-native-push-notification
npm install expo-notifications

# Network & connectivity
npm install @react-native-community/netinfo
npm install react-native-keep-awake

# Database
npm install expo-sqlite

# Utilities
npm install react-native-device-info
npm install @react-native-async-storage/async-storage
```

### iOS Specific Setup

```bash
cd ios
pod install
cd ..
```

### Android Specific Setup

Edit `android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 33

    defaultConfig {
        minSdkVersion 23
        targetSdkVersion 33
    }
}
```

---

## Configuration

### Create Config File

```javascript
// src/constants/Config.js
export default {
  gopro: {
    ip: '10.5.5.9',
    port: 8080,
    timeout: 30000,
    retryAttempts: 3
  },
  youtube: {
    clientId: 'YOUR_CLIENT_ID',
    scopes: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube'
    ]
  },
  upload: {
    chunkSize: 1024 * 1024, // 1MB
    maxConcurrent: 2,
    cellularWarningSize: 100 * 1024 * 1024 // 100MB
  }
};
```

### Setup Google Sign-In

**iOS** (`ios/BOATYMobile/Info.plist`):
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

**Android** (`android/app/build.gradle`):
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.4.0'
}
```

---

## Testing

### Run on Simulator/Emulator

```bash
# iOS Simulator
npm run ios
# or
npx react-native run-ios

# Android Emulator
npm run android
# or
npx react-native run-android
```

### Run on Physical Device

**iOS**:
1. Connect iPhone via USB
2. Trust computer on device
3. Select device in Xcode
4. Run: `npm run ios -- --device`

**Android**:
1. Enable Developer Options on device
2. Enable USB Debugging
3. Connect via USB
4. Run: `npm run android`

### Test Over WiFi

**iOS**:
1. Xcode > Window > Devices and Simulators
2. Select device > Connect via network

**Android**:
```bash
adb tcpip 5555
adb connect <device-ip>:5555
```

---

## Debugging

### Enable Debug Menu

**iOS**: `Cmd + D`
**Android**: `Cmd + M` or shake device

### Chrome DevTools

1. Open debug menu
2. Select "Debug"
3. Open `chrome://inspect`

### React Native Debugger

```bash
brew install --cask react-native-debugger
```

### Logging

```javascript
// Use console.log
console.log('Debug message');

// Or React Native's logger
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(); // Ignore all warnings
```

---

## Common Issues

### iOS Build Fails

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
npm run ios
```

### Android Build Fails

```bash
# Clean build
cd android
./gradlew clean
cd ..
npm run android
```

### Metro Bundler Issues

```bash
# Reset cache
npx react-native start --reset-cache
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules
npm install
```

---

## Project Structure

```
BOATY-Mobile/
├── src/
│   ├── screens/
│   ├── components/
│   ├── services/
│   ├── utils/
│   ├── navigation/
│   └── constants/
├── assets/
├── ios/
├── android/
├── app.json
├── package.json
└── README.md
```

---

## Next Steps

1. Verify environment: `npx react-native doctor`
2. Read MOBILE_ROADMAP.md for development plan
3. Read GOPRO_INTEGRATION.md for GoPro API details
4. Start Phase 1 implementation

---

**Last Updated**: 2025-09-29