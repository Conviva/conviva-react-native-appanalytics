# Conviva React Native App Analytics - iOS Native Setup

Only read this file when directed by AGENTS.md Section 8. Apply all steps to the React Native project's `ios/` directory.

---

## Overview

The React Native SDK bridges to the Conviva iOS native tracker (`ConvivaAppAnalytics`). The native dependency is declared in `RNConvivaAppAnalytics.podspec` (part of the installed npm package) and is **auto-linked** when `npx pod-install` is run. No manual additions to `Podfile` are required for the core SDK.

---

## Step 1 - Verify iOS Platform Version

Read `ios/Podfile`. Locate the `platform :ios` line.

**Requirement:** The platform version must be `>= '9.0'`.

**If already set to >= 9.0:** No change needed.

**If set below 9.0:** Update the platform line:
```ruby
platform :ios, '9.0'
```

Make no other changes to the Podfile.

---

## Step 2 - Run Pod Install

After adding the package to `package.json` and running the install command (and any Podfile version update), run:
```bash
npx pod-install
```

Or equivalently:
```bash
cd ios && pod install
```

This resolves `ConvivaAppAnalytics` (version pinned in `RNConvivaAppAnalytics.podspec`) and all other pod dependencies automatically.

---

## Step 3 - Verify Pod Resolution

After `pod install`, confirm that the output includes `ConvivaAppAnalytics`. If pod install fails, read `AGENTS-troubleshooting.md`.

---

## Step 4 - Configure Info.plist for Multi-SDK Runtime Stability

Add the following key to `ios/<AppName>/Info.plist` to prevent runtime crashes when multiple SDKs using ISA-swizzling are present in the same app (e.g., analytics, crash reporting, or A/B testing SDKs):

```xml
<key>CATGeneratedClassDisposeDisabled</key>
<true/>
```

This setting causes the SDK to retain a small, predictable amount of class metadata in memory, which improves runtime stability when multiple swizzling SDKs are present. It has no negative side effects and should be applied regardless of how many other SDKs are integrated.

**Where to place it:** Inside the top-level `<dict>` of `ios/<AppName>/Info.plist`, alongside other existing keys.

---

## What Gets Auto-linked

When `npx pod-install` runs, CocoaPods reads `RNConvivaAppAnalytics.podspec` from the installed npm package. That podspec declares:

```ruby
s.dependency "ConvivaAppAnalytics", "1.8.0"
```

This means `ConvivaAppAnalytics 1.8.0` is automatically fetched and linked. No manual `pod 'ConvivaAppAnalytics'` entry in your `Podfile` is needed or allowed.

---

## Notes on React Native Project Structure

In a React Native project, the `ios/` folder is a standard Xcode / CocoaPods project. The relevant files are:

| File | Purpose |
|---|---|
| `ios/Podfile` | CocoaPods dependency file (only `platform :ios` version may need updating) |
| `ios/Podfile.lock` | Auto-generated lock file; do not edit manually |

Never touch `ios/RNConvivaAppAnalytics.m`, `ios/RNConvivaAppAnalytics.h`, or any other native Objective-C source files. The RN bridge handles native initialization automatically.

---

## tvOS

The SDK also supports tvOS (`platform :tvos, '9.0'`). If the project targets tvOS, apply the same platform version check.
