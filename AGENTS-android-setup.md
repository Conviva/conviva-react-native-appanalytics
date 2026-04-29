# Conviva React Native App Analytics - Android Native Setup

Only read this file when directed by AGENTS.md Section 7. Apply all changes to the React Native project's `android/` directory.

---

## Overview

The React Native SDK bridges to the Conviva Android native tracker. The following is required on Android:

1. *(Hybrid apps only)* Add the `conviva-android-tracker` native dependency and call `createTracker` natively -- required only when the app contains native Android Activities outside the React Native bridge.
2. Add the Conviva Android Gradle plugin (enables **button click** and **network request** auto-collection).
3. Append ProGuard / R8 rules.

> **Version note:** `ANDROID_PLUGIN_VERSION` is an **independent Maven artifact** with its own release cycle. Never use `CONVIVA_RN_VERSION` (the npm package version) for it. `ANDROID_TRACKER_VERSION` is only needed for hybrid apps and is also independent.

The plugin version is provided by the developer as `ANDROID_PLUGIN_VERSION`. The tracker version `ANDROID_TRACKER_VERSION` is only required for hybrid apps (see AGENTS.md Section 3).

---

## Step 1 - Detect App Type (Standard React Native vs Hybrid)

Before adding any dependencies, determine whether the app is standard React Native or hybrid.

Read `android/app/src/main/AndroidManifest.xml` (from the Section 3a scan in AGENTS.md). Inspect all `<activity>` entries.

| Signal | Classification |
|---|---|
| Only `MainActivity` present (or all Activities extend `ReactActivity`); no native-only Activities | **Standard React Native** |
| One or more Activities that do NOT extend `ReactActivity` -- e.g., a native splash, login, or settings Activity in Java/Kotlin | **Hybrid** |

**If Standard React Native:**
- Skip Steps 1a and 1b below.
- The React Native bridge initializes the tracker automatically when `createTracker(...)` is called in JavaScript.
- Record in checklist: "Standard React Native detected -- tracker dependency and native initialization skipped."
- Proceed directly to Step 2.

**If Hybrid:**
- Proceed to Steps 1a and 1b.
- Record in checklist: "Hybrid app detected -- tracker dependency and native initialization required."

---

## Step 1a - Add Tracker Dependency (Hybrid Apps only)

In `android/app/build.gradle`, append inside the `dependencies {}` block:

```groovy
implementation 'com.conviva.sdk:conviva-android-tracker:<ANDROID_TRACKER_VERSION>'
```

> `<ANDROID_TRACKER_VERSION>` is the version provided by the developer (from [GitHub Releases](https://github.com/Conviva/conviva-android-appanalytics/releases)). It is **not** the same as the npm package version (`CONVIVA_RN_VERSION`). Prompt the developer: "Please provide the version of `com.conviva.sdk:conviva-android-tracker` to use (find it at [GitHub Releases](https://github.com/Conviva/conviva-android-appanalytics/releases))." Do not substitute one for the other.

Append only -- never modify or remove existing `implementation` lines.

---

## Step 1b - Initialize Native Tracker (Hybrid Apps only)

After adding the tracker dependency, initialize it natively in the Android Application class so that native Activities are tracked from app start, before the React Native bridge loads.

**Find the entry point:**
1. Read `android/app/src/main/AndroidManifest.xml`.
2. If `<application android:name="...">` points to a custom class, read that class and insert at the end of `onCreate()` (above `super.onCreate()` if it is the last statement).
3. If no custom Application class exists, use the MAIN/LAUNCHER Activity.
4. Never create a new Application class or modify `AndroidManifest.xml`.

**Java:**
```java
// Exception is java.lang.Exception — auto-imported in every Java file, no import statement needed
import com.conviva.apptracker.ConvivaAppAnalytics;
import com.conviva.apptracker.controller.TrackerController;

// In Application onCreate():
try {
    TrackerController tracker = ConvivaAppAnalytics.createTracker(this, "CUSTOMER_KEY", "APP_NAME");
    if (tracker == null) {
        // handle initialization failure
    }
} catch (Exception e) {
    e.printStackTrace();
}
```

**Kotlin:**
```kotlin
// Exception is kotlin.Exception — auto-imported in every Kotlin file, no import statement needed
import com.conviva.apptracker.ConvivaAppAnalytics

// In Application onCreate():
try {
    val tracker = ConvivaAppAnalytics.createTracker(this, "CUSTOMER_KEY", "APP_NAME")
    if (tracker == null) {
        // handle initialization failure
    }
} catch (e: Exception) {
    e.printStackTrace()
}
```

> `CUSTOMER_KEY` and `APP_NAME` are the same values used in the JavaScript `createTracker(...)` call (AGENTS.md Section 10). Do not hardcode them -- use the `CUSTOMER_KEY` and `APP_NAME` provided by the developer.
>
> Forbidden: passing a settings map, config object, or builder as a fourth argument to `createTracker`. Use only the three-argument form above.
>
> Import only from `com.conviva.apptracker.*` -- never from `com.conviva.sdk.*`. If something does not compile, stop and ask.

---

## Step 2 - Detect Gradle Style and AGP Version

Read `android/settings.gradle` (or `android/settings.gradle.kts`) first, then `android/build.gradle` (or `android/build.gradle.kts`).

**Determine Gradle style:**
- If `android/settings.gradle` (or `.kts`) contains a `pluginManagement { plugins { ... } }` block -> **plugins DSL style**
- If `android/build.gradle` contains `buildscript { dependencies { classpath ... } }` -> **buildscript style**
- If both exist, the `buildscript` block takes precedence - treat as **buildscript style**

**Detect AGP version:** Look for `com.android.tools.build:gradle:X.Y.Z` (buildscript style) or `id("com.android.application") version "X.Y.Z"` (plugins DSL style in `android/settings.gradle`).

| AGP Version | Supported |
|---|---|
| < 7.0 | Yes |
| 7.0 to < 7.2 | No |
| >= 7.2 | Yes |

If AGP is in the unsupported range (7.0 to < 7.2), stop and inform the developer.

**Plugin version constraint:**

| AGP Version | Min Conviva Plugin Version |
|---|---|
| < 9.0 | any |
| >= 9.0 | 0.3.7 |

If AGP >= 9.0 and `ANDROID_PLUGIN_VERSION` < 0.3.7, stop and inform the developer.

---

## Step 3 - Add Plugin Classpath (Root Build File)

**Buildscript / Groovy (`android/build.gradle`):**

Before appending, scan the existing `classpath` entries inside the `buildscript > dependencies {}` block and detect the quote style already in use:
- If existing entries use `classpath("...")` -> use double-quote style
- If existing entries use `classpath '...'` -> use single-quote style
- If mixed or unclear, prefer the style of the immediately preceding `classpath` line

Append inside the `buildscript > dependencies {}` block using the detected style:
```groovy
// double-quote style:
classpath("com.conviva.sdk:android-plugin:<ANDROID_PLUGIN_VERSION>")
// single-quote style:
classpath 'com.conviva.sdk:android-plugin:<ANDROID_PLUGIN_VERSION>'
```

**Buildscript / Kotlin (`android/build.gradle.kts`):**

Append inside the `buildscript > dependencies {}` block:
```kotlin
classpath("com.conviva.sdk:android-plugin:<ANDROID_PLUGIN_VERSION>")
```

**Plugins DSL / Groovy (`android/settings.gradle`):**

Append inside `pluginManagement > plugins {}`:
```groovy
id 'com.conviva.sdk.android-plugin' version '<ANDROID_PLUGIN_VERSION>' apply false
```

**Plugins DSL / Kotlin (`android/settings.gradle.kts`):**

Append inside `pluginManagement > plugins {}`:
```kotlin
id("com.conviva.sdk.android-plugin") version "<ANDROID_PLUGIN_VERSION>" apply false
```

---

## Step 4 - Apply Plugin in App Module

**Groovy buildscript style (`android/app/build.gradle`):**

Append after the last existing `apply plugin:` line:
```groovy
apply plugin: 'com.conviva.sdk.android-plugin'
```

**Kotlin plugins DSL style (`android/app/build.gradle.kts`):**

Append inside the `plugins {}` block:
```kotlin
id("com.conviva.sdk.android-plugin")
```

---

## Step 5 - ProGuard / R8 Rules

Locate the ProGuard file referenced by `proguardFiles` in `android/app/build.gradle`. Typically `android/app/proguard-rules.pro`.

Append these rules to that file only. Never append to library module ProGuard files. Never modify existing rules:

```proguard
-keepnames class * extends android.view.View
-keep,allowshrinking class com.conviva.** { *; }
```

If using multidex with a `multidex-config.pro` file in the app module, append the same rules there as well.

If no ProGuard file exists, ask the developer to confirm whether ProGuard / R8 is in use before creating one.

---

## Step 6 - Verification

After making Gradle changes, ask the developer to run:
```bash
cd android && ./gradlew assembleDebug
```

If Gradle sync or build fails, read `AGENTS-troubleshooting.md`.

---

## Notes on React Native Project Structure

In a React Native project, the `android/` folder is a standalone Android project. The Gradle file locations are:

| File | Purpose |
|---|---|
| `android/build.gradle` | Root build file (plugin classpath goes here for buildscript style) |
| `android/settings.gradle` | Settings file (plugin declaration goes here for plugins DSL style) |
| `android/app/build.gradle` | App module build file (plugin apply goes here) |
| `android/app/proguard-rules.pro` | ProGuard rules file |

Never touch `android/app/src/main/java/...` or any native Java/Kotlin source files. The RN bridge handles native initialization automatically.
