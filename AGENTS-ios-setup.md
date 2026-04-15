# Conviva React Native App Analytics - iOS Native Setup

Only read this file when directed by AGENTS.md Section 8. Apply all steps to the React Native project's `ios/` directory.

---

## Overview

The React Native SDK bridges to the Conviva iOS native tracker (`ConvivaAppAnalytics`). The native dependency is declared in `RNConvivaAppAnalytics.podspec` (part of the installed npm package) and is **auto-linked** when `npx pod-install` is run. No manual additions to `Podfile` are required for the core SDK.

The following is required on iOS:

1. *(Hybrid apps only)* Initialize the native tracker in `AppDelegate` -- required only when the app contains native iOS ViewControllers (Swift/Objective-C) outside the React Native bridge.
2. Verify iOS platform version >= 9.0.
3. Run pod install.
4. Verify pod resolution.
5. Configure Info.plist for multi-SDK runtime stability.

> **Note:** Unlike Android, no separate pod dependency is needed for hybrid apps. The `ConvivaAppAnalytics` pod is already auto-linked via the podspec and is accessible to native Swift/Objective-C code in the app target.

---

## Step 1 - Detect App Type (Standard React Native vs Hybrid)

Before modifying any native files, determine whether the app is standard React Native or hybrid.

Use the `APP_TYPE_IOS` value provided by the developer (AGENTS.md Section 3). Unlike Android where `AndroidManifest.xml` declares all Activities statically, iOS has no central registry of ViewControllers -- they are created in code at runtime. The developer's answer is the authoritative classification.

**Do not attempt to detect hybrid status by scanning native source files.** The presence of `UIViewController` subclasses, `.storyboard` files, or native Swift/Objective-C code in the `ios/` folder does not indicate a hybrid app -- standard React Native projects contain native code in `AppDelegate`, bridge modules, and launch storyboards. Only the developer's explicit answer to the `APP_TYPE_IOS` question determines the classification. Never infer or assume hybrid status.

| Classification | Signal |
|---|---|
| **Standard React Native** | All screens are rendered by React Native. `AppDelegate` only sets up `RCTRootView` (or `RCTBridge` + `RCTRootView`). No native UIViewControllers are presented outside the RN bridge. |
| **Hybrid** | One or more screens are native UIViewControllers (Swift/Objective-C) -- e.g., a native splash, login, onboarding, or settings screen -- presented via `UINavigationController`, `UITabBarController`, modal presentation, or any other native navigation alongside React Native screens. |

**If Standard React Native:**
- Skip Steps 1a and 1b below.
- The React Native bridge initializes the tracker automatically when `createTracker(...)` is called in JavaScript.
- Record in checklist: "Standard React Native detected -- native initialization skipped."
- Proceed directly to Step 2.

**If Hybrid:**
- Proceed to Steps 1a and 1b.
- Record in checklist: "Hybrid app detected -- native initialization in AppDelegate required."

---

## Step 1a - Verify Pod Availability (Hybrid Apps only)

The `ConvivaAppAnalytics` pod is auto-linked by CocoaPods into the app target when `npx pod-install` runs. This means native Swift and Objective-C code in the app target can import it directly -- no additional pod entry in the Podfile is needed.

**Verify:** After `npx pod-install`, confirm `ConvivaAppAnalytics` appears in `ios/Podfile.lock`. If it does, native code can `@import ConvivaAppAnalytics;` (Obj-C) or `import ConvivaAppAnalytics` (Swift).

> Unlike Android where `conviva-android-tracker` is a separate Maven artifact that must be explicitly added to `build.gradle`, on iOS the pod is already present via auto-linking. No separate dependency step is required.

---

## Step 1b - Initialize Native Tracker in AppDelegate (Hybrid Apps only)

Initialize the tracker natively in `AppDelegate` so that native ViewControllers are tracked from app start, before the React Native bridge loads.

**Find the entry point:**
1. Read `ios/<AppName>/AppDelegate.m` (or `AppDelegate.mm` or `AppDelegate.swift`) from the Section 3a scan in AGENTS.md.
2. Locate the `application:didFinishLaunchingWithOptions:` method.
3. Insert the tracker initialization **before** the `return YES` / `return true` statement, and **before** the `RCTBridge` / `RCTRootView` setup if possible (so tracking starts before the RN bridge).
4. Never create a new AppDelegate class or modify the app's entry point structure.

**Objective-C (`AppDelegate.m` or `AppDelegate.mm`):**
```objc
@import ConvivaAppAnalytics;

// In application:didFinishLaunchingWithOptions:
id<CATTrackerController> tracker = [CATAppAnalytics createTrackerWithCustomerKey:@"CUSTOMER_KEY" appName:@"APP_NAME"];
```

**Swift (`AppDelegate.swift`):**
```swift
import ConvivaAppAnalytics

// In application(_:didFinishLaunchingWithOptions:)
let tracker = CATAppAnalytics.createTracker(customerKey: "CUSTOMER_KEY", appName: "APP_NAME")
```

> `CUSTOMER_KEY` and `APP_NAME` are the same values used in the JavaScript `createTracker(...)` call (AGENTS.md Section 10). Do not hardcode them -- use the `CUSTOMER_KEY` and `APP_NAME` provided by the developer.
>
> Forbidden: passing a configuration dictionary, builder, or settings object as a third argument to `createTracker`. Use only the two-argument form above.
>
> Import only from `ConvivaAppAnalytics` -- the framework name matches the pod name. If the import does not compile, stop and ask. Do not guess alternative import paths.

See `AGENTS-snippets.md` -> "iOS Native Tracker Initialization (Hybrid Apps Only)" for full `AppDelegate` examples in both Obj-C and Swift.

---

## Step 2 - Verify iOS Platform Version

Read `ios/Podfile`. Locate the `platform :ios` line.

**Requirement:** The platform version must be `>= '9.0'`.

**If already set to >= 9.0:** No change needed.

**If set below 9.0:** Update the platform line:
```ruby
platform :ios, '9.0'
```

Make no other changes to the Podfile.

---

## Step 3 - Run Pod Install

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

## Step 4 - Verify Pod Resolution

After `pod install`, confirm that the output includes `ConvivaAppAnalytics`. If pod install fails, read `AGENTS-troubleshooting.md`.

---

## Step 5 - Configure Info.plist for Multi-SDK Runtime Stability

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

Never touch `ios/RNConvivaAppAnalytics.m`, `ios/RNConvivaAppAnalytics.h`, or any bridge module source files. For standard React Native apps, the RN bridge handles native initialization automatically. For hybrid apps, only `AppDelegate.m` / `AppDelegate.mm` / `AppDelegate.swift` may be edited to add the native `createTracker` call (Step 1b).

---

## tvOS

The SDK also supports tvOS (`platform :tvos, '9.0'`). If the project targets tvOS, apply the same platform version check.
