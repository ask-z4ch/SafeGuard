# Building the APK

## Prerequisites

- **Node.js** >= 18
- **Android Studio** (with Android SDK API 36+)
- **JDK 21** (Temurin recommended)

## Install JDK 21

```bash
winget install "Eclipse Temurin JDK with Hotspot 21"
```

Or download from: https://adoptium.net/temurin/releases/?version=21

## Set Environment Variables

```bash
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

## Build Web App

```bash
cd backend/frontend-user
npm run build
```

## Sync with Capacitor

```bash
npx cap copy
npx cap sync android
```

## Build APK

```bash
cd android
.\gradlew.bat assembleDebug
```

The APK will be at: `android\app\build\outputs\apk\debug\safeguard-companion.apk`

## Alternative: Build via Android Studio

```bash
npx cap open android
```

Then in Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK**
