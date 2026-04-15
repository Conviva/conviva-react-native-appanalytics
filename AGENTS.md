# Conviva React Native App Analytics - AI Integration Contract

Single source of truth. Governs: Cursor, Claude Code, Codex, ChatGPT, Gemini CLI, Copilot, and all other agents. This file always wins over any conflicting documentation.

## Workflow

1. State: "I have read AGENTS.md and will follow its contract."
2. Ask developer for all inputs in Section 3 before writing any code.
3. Seed task list from Section 17 before writing any code.
4. Execute Sections 4-16 in order. Every Section 17 row must appear in your response.
5. If you cannot proceed without violating a rule, stop and ask.

---

## 1. Non-Negotiable Rules

1. Use only APIs, imports, dependencies, and procedures defined in this file.
2. Do not invent, guess, or hallucinate Conviva APIs, function names, imports, package names, or configuration keys.
3. Do not mix instructions from other Conviva SDKs (VSI, Android-only SDK, iOS-only SDK, legacy sensors).
4. Prompt the developer for all required inputs. Never assume or hardcode them.
5. Apply minimal, localized changes only - no refactors, no comment cleanup, no unrelated edits.
6. PII Protection: Never pass email, phone, full name, IMEI, or IP address to Conviva. Use only non-PII identifiers (opaque provider UID, account ID, stored UUID). If none found, do not implement userId tracking - ask developer (see Sections 3b, 3c, 11).
7. If you cannot proceed without violating a rule, stop and ask.
8. **Never execute shell commands.** Agents make file edits only. Do not run `yarn`, `npm install`, `pnpm install`, `npx pod-install`, `gradlew`, or any other terminal command. At the end of the integration, list every command the developer must run manually under a "Commands to run" section.

---

## 2. SDK Identity

| Field | Value |
|---|---|
| Product | Conviva DPI |
| Platform | React Native (Android + iOS) |
| SDK Name | Conviva React Native App Analytics |
| npm Package | `@convivainc/conviva-react-native-appanalytics` |
| GitHub Repo | `Conviva/conviva-react-native-appanalytics` |
| Android Native Tracker | `com.conviva.sdk:conviva-android-tracker` |
| Android Plugin Artifact | `com.conviva.sdk:android-plugin` |
| Android Plugin ID | `com.conviva.sdk.android-plugin` |
| iOS Native Pod | `ConvivaAppAnalytics` |

---

## 3. Required Inputs - Ask Before Writing Any Code

| Input | Description |
|---|---|
| `CUSTOMER_KEY` | Conviva Customer Key - never guess or hardcode |
| `APP_NAME` | App name string passed to tracker initialization |
| `CONVIVA_RN_VERSION` | Exact npm version of `@convivainc/conviva-react-native-appanalytics` -- never use `*` |
| `ADD_DISPLAYNAME_VERSION` | **For `CONVIVA_RN_VERSION <= 0.2.8` only.** Exact version of `babel-plugin-add-react-displayname` to add to `devDependencies` in `package.json` -- never use `*`. Also add `'add-react-displayname'` to the `plugins` array explicitly. |
| `BABEL_DISPLAY_NAME_VERSION` | **For `CONVIVA_RN_VERSION >= 0.2.9` only -- fallback only.** `@babel/plugin-transform-react-display-name` is declared as a `dependency` of the Conviva package and resolves automatically from the package's own `node_modules` -- no host project `devDependencies` entry is needed in standard npm projects. Only required explicitly if you see `[conviva] Could not resolve @babel/plugin-transform-react-display-name` (e.g. strict pnpm / Yarn PnP environments). In that case, pin the exact version here and add to `devDependencies`. |
| `ANDROID_PLUGIN_VERSION` | Exact Android plugin version from GitHub Releases -- **never use `CONVIVA_RN_VERSION` for this** |
| `APP_TYPE_ANDROID` | **Auto-detected during Section 3a scan** by inspecting `android/app/src/main/AndroidManifest.xml` for non-ReactActivity Activities (see `AGENTS-android-setup.md` Step 1 for classification rules). After detection, include the result as a **confirmation** alongside the other required input questions: *"I detected [standard React Native / hybrid] based on your AndroidManifest.xml — is that correct?"* Do not ask the developer to classify from scratch — detect first, then confirm. If hybrid is confirmed, also ask for `ANDROID_TRACKER_VERSION` in the same prompt. |
| `ANDROID_TRACKER_VERSION` | *(Hybrid apps only)* Exact version of `com.conviva.sdk:conviva-android-tracker` from [GitHub Releases](https://github.com/Conviva/conviva-android-appanalytics/releases). This is a **separate artifact with its own release cycle** -- it is NOT the same as `CONVIVA_RN_VERSION`. Never reuse the npm version number here. Only required when `APP_TYPE_ANDROID` is hybrid. |
| `APP_TYPE_IOS` | Whether the iOS app is **standard React Native** (all screens are rendered by React Native; `AppDelegate` only sets up `RCTRootView`) or **hybrid** (has native iOS screens written in Swift/Objective-C that are presented outside the React Native bridge). Ask developer: *"Does your iOS app present any screens built with native UIKit (Swift or Objective-C UIViewControllers) that are not rendered by React Native? For example: a native splash screen (beyond the launch storyboard), a native login or onboarding flow, a native settings screen, or any screen built with UIKit/SwiftUI that exists alongside your React Native screens. If all your app's screens are React Native components and the only native code is the standard AppDelegate/SceneDelegate boilerplate that hosts the RCTRootView, answer No."* |
Do not proceed without all required values. Also detect the React Navigation version and AGP version before writing Gradle or navigation code (see Sections 5 and 7). For iOS hybrid apps, confirm the AppDelegate language (Obj-C vs Swift) before writing native init code (see Section 8).

---

## 3a. Project Scanning - Read Each File Once

Do not re-read a file already in context. If a prior tool call or subagent has already returned a file's content, use it from context - do not open it again.

| File | Extract | How |
|---|---|---|
| `package.json` | `dependencies` and `devDependencies` blocks; detect React Navigation version; detect existing Conviva package; detect `expo` presence | Full (typically < 50 lines) |
| `babel.config.js` or `.babelrc` | Existing `plugins` array | Full (typically < 30 lines) |
| `App.js` / `App.tsx` / `index.js` | Navigation container usage; existing Conviva imports; root component structure | Full |
| `android/settings.gradle` or `android/settings.gradle.kts` | Presence of `pluginManagement` block; confirms plugins DSL style | Partial - first 30 lines |
| `android/build.gradle` or `android/build.gradle.kts` | `buildscript` block; AGP version; existing classpath entries | Full (typically < 100 lines) |
| `android/app/build.gradle` or `android/app/build.gradle.kts` | `plugins {}` or `apply plugin:` block; `proguardFiles` line; last ~25 lines of `dependencies {}` | Partial - first 30 lines + search for `proguardFiles` + last 25 lines |
| `android/app/src/main/AndroidManifest.xml` | `android:name` on `<application>` tag; all `<activity>` entries to detect `APP_TYPE_ANDROID` (hybrid vs standard RN -- see `AGENTS-android-setup.md` Step 1) | Full |
| `ios/Podfile` | `platform :ios` version; existing pod entries | Full (typically < 50 lines) |
| `ios/<AppName>/AppDelegate.m` or `AppDelegate.mm` or `AppDelegate.swift` | *(iOS hybrid only)* Detect language (Obj-C vs Swift); locate `application:didFinishLaunchingWithOptions:` method; check for existing Conviva imports or `createTracker` calls | Partial - first 50 lines + search for `didFinishLaunchingWithOptions` |
| `app.json` or `app.config.js` | Expo project type detection (`expo` key presence; `android`/`ios` bare workflow keys) | Full (typically < 50 lines) - only if `expo` found in `package.json` |
| `yarn.lock` | Existence only - confirms Yarn as package manager | Existence check only |
| `pnpm-lock.yaml` | Existence only - confirms pnpm as package manager | Existence check only |
| Auth hooks (login / logout) | Every function triggering login or logout | Targeted - grep first, then partial read |

**Package manager detection:** If `yarn.lock` exists -> use Yarn commands. If `pnpm-lock.yaml` exists -> use pnpm commands. Otherwise -> use npm commands.

**Do NOT read:** native Java/Kotlin source files in `android/` or native Objective-C/Swift source files in `ios/` -- **except** `AppDelegate` (for iOS hybrid detection, see Section 8) and the Android Application class (for Android hybrid detection, see Section 7). Do not read library module sources, test source sets, or any file not in the table above. Exception: auth hooks must be found regardless of which file they are in.

---

## 3b. Auth Hook Scan - Discovery Only, No Implementation Yet

Grep all `.js`, `.jsx`, `.ts`, `.tsx` files for:
```
(login|logout|signIn|signOut|authenticate|signup|signUp|register|createUser|createAccount)
```
Record: file path, function name, line number.

For each login / registration method: trace all callers down the call chain to the single lowest-layer function where the actual auth provider call is made. This is the **convergence point** - place `setSubjectData({userId})` here only. If callers share no convergence point, place the call at each independent path.

For logout: trace all callers to the single lowest-layer function where the actual provider sign-out is called. This is the convergence point - place `setSubjectData({userId: null})` here only.

Registration / signup creates a new authenticated session - treat identically to login.

Do not read files yet - just identify convergence points. Proceed to Section 11 for implementation.

**If only PII identifiers found:** do not implement userId tracking. Report in Section 17: which methods were found, why each is unsafe, and instruct the developer: "No non-PII identifier available. Implement one of: (1) opaque provider UID, (2) custom UUID stored at first launch, (3) backend account ID. Do not use email, phone, or full name."

**Non-PII vs PII:**

| Identifier | PII? | Safe? |
|---|---|---|
| Opaque UID (Firebase UID, Auth0 ID, custom backend ID) | No | YES |
| Stored UUID (deterministic per user) | No | YES |
| Backend account ID (opaque numeric/alphanumeric) | No | YES |
| Email address | Yes | NO |
| Phone number | Yes | NO |
| Full name / display name | Yes | NO |
| IP address | Yes | NO |
| Device IMEI / IMSI / serial | Yes | NO |

---

## 3d. Expo / Managed Workflow Detection

After reading `package.json` (Section 3a), check whether `expo` appears in `dependencies` or `devDependencies`.

| Condition | Classification | Action |
|---|---|---|
| No `expo` in dependencies | Standard bare React Native | Proceed normally with all sections |
| `expo` present AND `android/` and `ios/` folders exist in project root | Expo bare workflow | Proceed normally with all sections |
| `expo` present AND `android/` or `ios/` folders are absent | Expo managed workflow | Stop - follow instructions below |

**Expo managed workflow instructions:**

The developer's project uses Expo managed workflow. Native folders (`android/`, `ios/`) do not exist and cannot be manually edited.

1. Inform the developer: "This project uses Expo managed workflow. Steps 2 (Android native setup) and 3 (iOS native setup) cannot be applied directly. Run `npx expo prebuild` to generate native folders, then re-run integration."
2. Add `@convivainc/conviva-react-native-appanalytics` to `dependencies` in `package.json` at exact `CONVIVA_RN_VERSION`, then run `npm install` (or `yarn` / `pnpm install`) from the project root.
3. Babel plugin setup (Section 9) and React Navigation setup (Section 12) still apply.
4. Initialization code (Section 10) and User ID (Section 11) still apply.
5. After `npx expo prebuild`, treat the project as Expo bare workflow and complete Sections 7 and 8.
6. Record in Section 17: "Expo managed workflow detected - developer must run prebuild before native setup."

**Expo bare workflow:** Proceed exactly as standard bare React Native. All sections apply.

---

## 4. Core Rules

- Add the npm package exactly once to `package.json` `dependencies` using the exact version from `CONVIVA_RN_VERSION`: `"@convivainc/conviva-react-native-appanalytics": "CONVIVA_RN_VERSION"`. Do not run any install command -- collect all `package.json` edits first, then list all commands for the developer to run manually at the end of the integration.
- Do not run `npx pod-install` -- list it for the developer to run manually after all file changes are complete.
- Initialize exactly once: `createTracker(customerKey, appName)` - no extra config objects unless specifically required.
- Initialization file: always create a dedicated `src/conviva.ts` (TypeScript projects) or `src/conviva.js` (JavaScript projects) module at the root of the `src/` folder. Call `createTracker` once at module level in this file and export the tracker instance. Never inline `createTracker` in `App.tsx`, `App.js`, `index.js`, or any other file.
- Root component wiring: in the root component file (`App.tsx`, `App.js`, or `index.js`), add a side-effect import of the conviva module: `import './conviva'`. This ensures the tracker is initialized before any screen renders without creating a circular dependency.
- Cross-file tracker access: in any file that needs the tracker, import the exported instance from `src/conviva.ts` directly (`import { tracker } from './conviva'`) or via the project's path alias if one exists (e.g. `import { tracker } from '@src/conviva'`). Never call `createTracker` more than once.
- Gradle changes (Android) are append-only - never modify, remove, or reorder existing lines. `repositories {}` blocks are read-only.
- Import only from `@convivainc/conviva-react-native-appanalytics` - never from internal paths or sub-packages.
- Set `userId` immediately after `createTracker` if a non-PII identifier is available. Update on login, registration, logout, and account switch. Never use PII. If no guest identifier exists, ask developer.

---

## 5. React Navigation Version Detection

Read `package.json`. Determine the major version of `@react-navigation/native` or `react-navigation` in `dependencies` or `devDependencies`.

| Version | Integration Approach |
|---|---|
| >= 5 | Wrap `NavigationContainer` with `withReactNavigationAutotrack(autocaptureNavigationTrack)` |
| < 5 | Wrap `AppNavigator` (result of `createAppContainer()`) with `withReactNavigationAutotrack(autocaptureNavigationTrack)` |
| Not present | Skip navigation autotracking; note in Section 17 |

If the React Navigation package is not present, do not add navigation autotracking. Report in Section 17.

---

## 6. Installation

Do not run any install command. Only edit `package.json`. After all `package.json` edits are complete, provide the following command for the developer to run manually (not the agent):

**Add to `dependencies` in `package.json`:**
```json
"@convivainc/conviva-react-native-appanalytics": "CONVIVA_RN_VERSION"
```

**Provide this install command for the developer to run once (detect package manager from Section 3a):**

| Lock file present | Package manager | Install command |
|---|---|---|
| `yarn.lock` | Yarn | `yarn` |
| `pnpm-lock.yaml` | pnpm | `pnpm install` |
| `package-lock.json` or none | npm | `npm install` |

After the developer runs the install command, they must also run pod install for iOS native bridging:
```bash
npx pod-install
```

List both commands at the end of the integration under "Commands to run". Do not execute them. Run all commands in the project root. If the project is Expo managed workflow (Section 3d), note that `npx pod-install` must be deferred until after `npx expo prebuild`.

---

## 7. Android Native Setup

Skip this section if Expo managed workflow was detected in Section 3d (no `android/` folder exists).

Read `AGENTS-android-setup.md` for all Android Gradle and plugin integration steps. Apply those steps to `android/build.gradle` (or `android/build.gradle.kts`) and `android/app/build.gradle` (or `android/app/build.gradle.kts`).

Before reading `AGENTS-android-setup.md`, confirm the Gradle DSL style using the scan results from Section 3a:
- If `android/settings.gradle` (or `.kts`) contains a `pluginManagement` block -> **plugins DSL style**
- If `android/build.gradle` contains `buildscript { dependencies { classpath ... } }` -> **buildscript style**

This determines which Gradle instructions to follow in `AGENTS-android-setup.md` Steps 3 and 4.

**App type detection (from `APP_TYPE_ANDROID` collected in Section 3):**

`AGENTS-android-setup.md` Step 1 determines whether the app is standard React Native or hybrid by inspecting `android/app/src/main/AndroidManifest.xml`. Use the `APP_TYPE_ANDROID` value already collected in Section 3 as the starting classification; confirm by reading the Manifest.

- **Standard React Native:** Skip Steps 1a and 1b in `AGENTS-android-setup.md` (no tracker dependency, no native `createTracker` needed).
- **Hybrid:** Follow Steps 1a and 1b -- add `conviva-android-tracker` at `ANDROID_TRACKER_VERSION` and call `ConvivaAppAnalytics.createTracker(...)` in the Application class.

AGP compatibility and plugin version constraints are in `AGENTS-android-setup.md` Step 2. If AGP >= 9.0 and `ANDROID_PLUGIN_VERSION` < 0.3.7, stop and inform the developer.

Find AGP version via `com.android.tools.build:gradle:` or `id("com.android.application") version ""` in `android/build.gradle`.

---

## 8. iOS Native Setup

Skip this section if Expo managed workflow was detected in Section 3d (no `ios/` folder exists).

Read `AGENTS-ios-setup.md` for all iOS CocoaPods and native integration steps.

The `ConvivaAppAnalytics` pod is declared as a dependency in `RNConvivaAppAnalytics.podspec` and is auto-linked when `npx pod-install` runs. No manual Podfile edits are required for the core SDK. Verify only that the `platform :ios` version in `ios/Podfile` is >= `'9.0'`.

`AGENTS-ios-setup.md` also includes the mandatory Info.plist configuration for runtime stability in multi-SDK integrations (Step 5). Apply that step regardless of how many other SDKs are present -- it is a safe, low-cost setting with no negative side effects.

**App type detection (from `APP_TYPE_IOS` collected in Section 3):**

iOS has no equivalent of Android's `AndroidManifest.xml` that declares all screens statically. ViewControllers are created in code at runtime with no central registry. Use the `APP_TYPE_IOS` value provided by the developer as the authoritative classification. Do not infer hybrid status by scanning native source files -- the presence of `UIViewController` subclasses or `.storyboard` files in `ios/` does not indicate a hybrid app.

- **Standard React Native:** Skip Steps 1a and 1b in `AGENTS-ios-setup.md` (no native `createTracker` needed). The React Native bridge initializes the tracker automatically when `createTracker(...)` is called in JavaScript.
- **Hybrid:** Follow Steps 1a and 1b in `AGENTS-ios-setup.md` -- verify pod availability for native code and call `CATAppAnalytics.createTracker(...)` natively in `AppDelegate` so native ViewControllers are tracked before the RN bridge loads.

---

## 9. Babel Plugin Setup (Button Click Auto-detection)

To enable auto-detection of button clicks for `Button`, `TouchableHighlight`, `TouchableOpacity`, `TouchableWithoutFeedback`, and `TouchableNativeFeedback` components, add the Conviva babel plugin.

**Target file:** `babel.config.js` or `.babelrc` in the project root.

**Check:** Read the existing plugins array before making changes. Append only - do not modify or remove existing plugins.

**Determine which approach to use based on `CONVIVA_RN_VERSION`:**

---

### For CONVIVA_RN_VERSION <= 0.2.8

Add two separate plugins -- the Conviva instrumentation plugin for button click auto-detection, and `add-react-displayname` for screen view display name injection.

**Display name coverage:** `babel-plugin-add-react-displayname` injects `ClassName.displayName = 'ClassName'` into every ES6 class component that **extends `React.Component` or `Component`**. All standard React Native screen components qualify. This is functionally equivalent to the coverage provided by `injectClassDisplayName` in `CONVIVA_RN_VERSION >= 0.2.9` (which targets any class with a `render()` method).

**For `babel.config.js`:**
```js
module.exports = {
  presets: [...],
  plugins: [
    // ... existing plugins ...
    './node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js',
    'add-react-displayname',
  ],
};
```

**For `.babelrc`:**
```json
{
  "plugins": [
    "./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js",
    "add-react-displayname"
  ]
}
```

Install `babel-plugin-add-react-displayname` as a `devDependency` using the exact `ADD_DISPLAYNAME_VERSION`:
```json
"babel-plugin-add-react-displayname": "<ADD_DISPLAYNAME_VERSION>"
```

Before adding, scan `package.json` `dependencies` and `devDependencies`:
- If `babel-types` / `babel-template` are already present at **any `6.x` version** in either block -> do **not** add a duplicate entry; the existing entry is sufficient and will resolve correctly from `node_modules`.
- If they are **absent** from both blocks -> add both to `devDependencies` at the minimum safe version:
```json
"babel-types": "^6.26.0",
"babel-template": "^6.26.0"
```
- If they are present at a version **outside `6.x`** -> stop and report; these packages were discontinued after Babel 6 and only `6.x` builds are compatible with `instrumentation/index.js`.

---

### For CONVIVA_RN_VERSION >= 0.2.9

A single unified Conviva plugin handles both button click auto-detection and screen view display name injection.

**Display name coverage:** `plugin.js` injects `ClassName.displayName = 'ClassName'` via `injectClassDisplayName` for every ES6 class declaration that has a **`render()` method** -- this covers all standard React Native screen components. This is functionally equivalent to the coverage provided by `babel-plugin-add-react-displayname` in `CONVIVA_RN_VERSION <= 0.2.8` (which targets classes extending `React.Component`).

**Migrating from CONVIVA_RN_VERSION <= 0.2.8:** When upgrading to `>= 0.2.9`, remove the two entries added for 0.2.8 and replace with the single unified plugin:
- Remove `'./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js'` from `plugins`
- Remove `'add-react-displayname'` from `plugins`
- Remove `"babel-plugin-add-react-displayname"` from `devDependencies`
- Add `'@convivainc/conviva-react-native-appanalytics/plugin'` to `plugins`
- `@babel/plugin-transform-react-display-name` resolves automatically from the Conviva package -- no `devDependencies` entry needed

See `AGENTS-snippets.md` -> Babel Plugin Configuration (>= 0.2.9) for exact plugin strings. Append only -- do not modify or remove existing plugins.

Display name injection for screen_view auto-detection is bundled inside the Conviva plugin -- do NOT add `@babel/plugin-transform-react-display-name` to the `plugins` array in `babel.config.js`.

`@babel/plugin-transform-react-display-name` is declared as a direct `dependency` of the Conviva package and resolves automatically from the package's own `node_modules` -- no explicit `devDependencies` entry is required in the host project for standard npm. If you see `[conviva] Could not resolve @babel/plugin-transform-react-display-name` (pnpm / Yarn PnP environments), see `AGENTS-troubleshooting.md`.

---

### Click Event Attribute Requirements

The Conviva plugin wraps each auto-tracked touchable in a Higher-Order Component that fires `convivaAutotrackPress`. The native layer requires **at least one** of the following attributes to be non-empty for every click event:

| Attribute | How it is populated |
|---|---|
| `elementText` | Fiber tree traversal -- finds the text content of any `<Text>` child at any depth |
| `elementClasses` | Collected from `componentThis.displayName` -- may be empty in some versions |
| `elementType` | Collected from `componentThis.elementType` -- may be empty in some versions |
| `elementId` | Collected from `componentThis.id` -- not set automatically |

The most reliable attribute is `elementText`. Ensure every auto-tracked touchable has at least one `<Text>` child. Icon-only touchables with no `<Text>` child can use a zero-size hidden `<Text>` as a workaround.

> Note: `accessibilityLabel` alone does **not** populate `elementText`. Only `<Text>` component content is read by the fiber traversal.

See `AGENTS-troubleshooting.md` -> "Button Click Auto-detection Not Working" for the full error details and all workarounds.

**Known behavior -- `Conviva: Display names are not available` warning (both versions):** This is a known false positive. The SDK probe never triggers regardless of configuration. No action needed. See `AGENTS-troubleshooting.md` for details.

---

## 10. Initialization Code

See `AGENTS-snippets.md` for complete, copy-ready snippets.

- Create `src/conviva.ts` (TypeScript) or `src/conviva.js` (JavaScript) at the root of the `src/` folder. This is the single place where `createTracker(CUSTOMER_KEY, APP_NAME)` is called and the tracker instance is exported.
- In the root component file (`App.tsx`, `App.js`, or `index.js`), add a side-effect import at the top: `import './conviva'`. Do not call `createTracker` there.
- In any other file that needs the tracker (e.g. Redux action files, hooks), import the exported instance using the project's path alias if available (e.g. `import { tracker } from '@src/conviva'`), otherwise use a relative path.
- Before creating `src/conviva.ts`, check whether a path alias for `src/` is configured in `babel.config.js` or `tsconfig.json` (e.g. `@src`). Use that alias in all imports of the tracker across the project.
- Forbidden: passing a third `controllerConfig` argument unless explicitly instructed by the developer.
- Forbidden: calling `createTracker` anywhere other than `src/conviva.ts` / `src/conviva.js`.
- Import: `import { createTracker } from '@convivainc/conviva-react-native-appanalytics';`

---

## 11. User ID

Complete Section 3b scan first. If only PII identifiers found, do not implement - report in Section 17 and stop.

**Safety checklist (per login / registration method):**
- [ ] Non-PII identifier confirmed (opaque provider UID, account ID, or stored UUID)
- [ ] Not email, phone, name, IMEI, IP address, or any PII
- [ ] Available immediately after successful login or registration
- [ ] Consistent across sessions (not fresh per session)

**Implementation:**
1. Trace all callers for each login / registration method to the lowest-layer convergence point.
2. At that point, obtain the non-PII identifier immediately after the auth call succeeds.
3. Use snippet from `AGENTS-snippets.md` -> "User ID".
4. Place `setSubjectData({userId})` once at the convergence point - not at each individual caller.
5. At the logout convergence point, call `setSubjectData({userId: null})` or `setUserId(null)`.

**Do not implement if:**
- Only email available -> PII
- Only phone available -> PII
- Only full name available -> PII
- No identifier available -> ask developer to define one

---

## 12. React Navigation Autotracking

See `AGENTS-snippets.md` for complete navigation wrapping snippets.

**React Navigation >= 5:**

Import `withReactNavigationAutotrack` and `autocaptureNavigationTrack` from the package. Wrap the existing `NavigationContainer` in the root component. For TypeScript, cast the result `as typeof NavigationContainer` to preserve prop types for JSX type-checking. Replace every occurrence of `<NavigationContainer>` with `<ConvivaNavigationContainer>`. Pass through all existing props unchanged.

**React Navigation < 5:**

Wrap the result of `createAppContainer()` with `withReactNavigationAutotrack(autocaptureNavigationTrack)`. Do not modify the navigator definition itself.

See `AGENTS-snippets.md` -> React Navigation Autotracking for complete JS and TS snippets for both versions.

**If React Navigation is not present:** skip this section. Record in Section 17.

---

## 13. Allowed API Surface

**npm package (only this import path):**
```
@convivainc/conviva-react-native-appanalytics
```

**Allowed exported symbols:**

| Symbol | Purpose |
|---|---|
| `createTracker(customerKey, appName)` | Initialize tracker (once) |
| `createTracker(customerKey, appName, controllerConfig)` | Initialize with optional config (only if developer requests) |
| `tracker.trackCustomEvent(eventName, eventData)` | Track custom event |
| `tracker.setCustomTags(tags)` | Set custom tags |
| `tracker.setCustomTagsWithCategory(category, tags)` | Set custom tags with category |
| `tracker.clearCustomTags(tagKeys)` | Clear specific tags |
| `tracker.clearAllCustomTags()` | Clear all tags |
| `tracker.setSubjectData({userId})` | Set user ID (preferred) |
| `tracker.setUserId(userId)` | Set user ID (alternative) |
| `tracker.trackPageView({pageUrl, pageTitle?, referrer?})` | Track page view |
| `tracker.trackScreenViewEvent(argmap)` | Track screen view |
| `tracker.trackClickEvent(eventData)` | Track click event |
| `withReactNavigationAutotrack(track)` | Wrap navigation container |
| `autocaptureNavigationTrack` | Navigation track function |
| `getWebViewCallback()` | WebView event bridge |
| `getClientId()` | Get client ID |
| `setClientId(clientId)` | Set client ID |
| `removeTracker(namespace)` | Remove a tracker |
| `removeAllTrackers()` | Remove all trackers |
| `cleanup()` | Cleanup |

**Forbidden:** Any symbol not in the table above. Any import from internal paths (e.g., `@convivainc/conviva-react-native-appanalytics/src/...`). Any Conviva Android or iOS native imports directly in JS/TS.

If a symbol does not exist in the allowed list, stop and report the error. Do not try alternate names.

---

## 14. Custom Events and Custom Tags (Optional)

See `AGENTS-snippets.md` for complete snippets. Tags are global and persist across events until cleared.

---

## 15. PageView Tracking (Optional)

Use `tracker.trackPageView({pageUrl, pageTitle?, referrer?})` to track in-app page navigations. This is separate from the automatic screen view tracking provided by the React Navigation wrapper. Only implement if the developer explicitly requests it.

---

## 16. Build and Validation

**Build verification:** Ask developer to run both Android and iOS debug builds. Share any error output and fix using only Section 13 allowed symbols.

For Android: `npx react-native run-android`
For iOS: `npx react-native run-ios`

If Metro bundler errors occur, read `AGENTS-troubleshooting.md`.

**Product validation:** Ask developer to validate in Pulse App -> Activation Module -> Live Lens. Confirm: tracking events live, identity attribution correct, user journeys not split.

---

## 17. Mandatory Checklist

Seed your task list from this table before writing any code. Every row must appear in your final response.

| Row | Required Content |
|---|---|
| Package manager detection | Detected package manager (npm/Yarn/pnpm); correct install command used |
| Expo detection | Standard RN / Expo bare workflow / Expo managed workflow detected; if managed workflow: prebuild instruction given |
| package.json entry | `@convivainc/conviva-react-native-appanalytics` added to `dependencies` in `package.json` at exact `CONVIVA_RN_VERSION`; install command listed for developer to run manually (not executed by agent) |
| pod-install | `npx pod-install` listed for developer to run manually; iOS platform version >= 9.0 confirmed; or skipped with reason if Expo managed workflow |
| Android native setup | Detected Gradle DSL style (buildscript or plugins DSL); **app type detected** (standard React Native or hybrid); if hybrid: `conviva-android-tracker` dependency added at `ANDROID_TRACKER_VERSION` (confirmed separate from `CONVIVA_RN_VERSION`) + native `ConvivaAppAnalytics.createTracker(...)` placed in Application class (or MAIN/LAUNCHER Activity); if standard React Native: tracker dependency and native init skipped; plugin classpath + apply added at `ANDROID_PLUGIN_VERSION`; ProGuard rules appended; AGP version detected; or skipped with reason if Expo managed workflow |
| iOS native setup | Pod auto-linked via podspec; no manual Podfile changes needed (or note any exceptions); **app type detected** (standard React Native or hybrid); if hybrid: native `CATAppAnalytics.createTracker(...)` placed in `AppDelegate` `application:didFinishLaunchingWithOptions:` (Obj-C or Swift snippet used based on detected language); if standard React Native: native init skipped; `CATGeneratedClassDisposeDisabled` set to `YES` in `Info.plist`; or skipped with reason if Expo managed workflow |
| Babel plugin | **For CONVIVA_RN_VERSION <= 0.2.8:** `./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js` and `add-react-displayname` added to `plugins`; `babel-plugin-add-react-displayname` added to `devDependencies` at exact `ADD_DISPLAYNAME_VERSION`; `babel-types` and `babel-template` presence confirmed in `dependencies` or `devDependencies` at a `6.x` version -- added to `devDependencies` at `^6.26.0` if absent, not duplicated if already present (legacy Babel 6 packages required by `instrumentation/index.js` -- not installed automatically in Babel 7 projects). **For CONVIVA_RN_VERSION >= 0.2.9:** `'@convivainc/conviva-react-native-appanalytics/plugin'` added to `plugins` in `babel.config.js`; `@babel/plugin-transform-react-display-name` added to `devDependencies` at exact `BABEL_DISPLAY_NAME_VERSION` (must be installed -- bundled plugin resolves it from host project); NOT added to `plugins` array |
| React Navigation version | Detected version; wrapping approach applied (v5+ or below v5); or "not present" |
| Initialization placement | `src/conviva.ts` (or `.js`) created; `createTracker` called at module level and tracker exported; root component side-effect imports it with `import './conviva'`; path alias used for cross-file tracker imports if available |
| User ID setup | Login, registration, and logout implementation; or stop instructions if PII-only |
| Custom events and tags | One code snippet each (if requested) |
| PageView tracking | Implemented (if requested) or skipped |
| AGP compatibility check | Detected AGP version; if >= 9.0, confirm plugin >= 0.3.7; or skipped if no Android setup |
| Build verification | Outcome for both Android and iOS |
| Product validation | Ask developer to validate in Pulse App -> Activation Module -> Live Lens |
