# Conviva React Native App Analytics - Troubleshooting

Companion to AGENTS.md. Read only when a build failure or runtime issue occurs.

---

## Metro Bundler Issues

**Issue: Metro bundler fails after adding babel plugins**

Symptoms: `SyntaxError` or `Cannot find module` after updating `babel.config.js`.

Fix:
1. **For CONVIVA_RN_VERSION <= 0.2.8:** Confirm the plugin path is correct: `./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js`
2. **For CONVIVA_RN_VERSION >= 0.3.0:** Confirm the plugin resolves correctly: `'@convivainc/conviva-react-native-appanalytics/plugin'`
3. Confirm the npm package is installed: check `node_modules/@convivainc/conviva-react-native-appanalytics/` exists.
4. Clear Metro cache and restart:
   ```bash
   npx react-native start --reset-cache
   ```

**Issue: `babel-types` not found (CONVIVA_RN_VERSION <= 0.2.8)**

Symptoms: `[BABEL]: Cannot find module 'babel-types'` -- thrown by `instrumentation/index.js` during Metro bundling.

Cause: `instrumentation/index.js` for this version uses the legacy Babel 6 packages `babel-types` and `babel-template`. These packages are **not** installed transitively in Babel 7 projects.

Fix:
1. Check `package.json` `dependencies` and `devDependencies` for existing entries:
   - If `babel-types` / `babel-template` are already present at **any `6.x` version** in either block -> do **not** add a duplicate entry; the existing entry is sufficient. Skip to step 3.
   - If they are present at a version **outside `6.x`** -> stop and report; only `6.x` builds are compatible with `instrumentation/index.js`.
2. If absent from both blocks, add to `devDependencies` in `package.json`:
```json
"babel-types": "^6.26.0",
"babel-template": "^6.26.0"
```
3. Run `npm install` (or `yarn` / `pnpm install`) from the project root.
4. Restart Metro with `--reset-cache` after installing.

**Issue: `add-react-displayname` not found (CONVIVA_RN_VERSION <= 0.2.8)**

Symptoms: `Cannot find module 'add-react-displayname'`

Fix: Add `babel-plugin-add-react-displayname` to `devDependencies` in `package.json` (`0.0.5` is the final published version):
```json
"babel-plugin-add-react-displayname": "0.0.5"
```
Then run `npm install` (or `yarn` / `pnpm install`) from the project root.
Restart Metro with `--reset-cache` after installing.

**Issue: `@babel/plugin-transform-react-display-name` not found (CONVIVA_RN_VERSION >= 0.3.0)**

Symptoms: `[conviva] Could not resolve @babel/plugin-transform-react-display-name`

Cause: In standard npm projects this package resolves automatically from the Conviva package's own `node_modules`. In strict pnpm or Yarn PnP environments, nested resolution is blocked and the package must be explicitly declared in the host project.

Fix: Add `@babel/plugin-transform-react-display-name` to `devDependencies` in `package.json`. Use the same version declared in `node_modules/@convivainc/conviva-react-native-appanalytics/package.json`:
```json
"@babel/plugin-transform-react-display-name": "<version-from-conviva-package>"
```
Then run `npm install` (or `yarn` / `pnpm install`) from the project root.
Do NOT add it to the `plugins` array in `babel.config.js` -- the Conviva plugin resolves it internally. It only needs to be present in `node_modules`.

---

## Button Click Auto-detection Not Working

Symptoms: `button_click` events are not firing for `TouchableOpacity`, `TouchableHighlight`, `TouchableWithoutFeedback`, `TouchableNativeFeedback`, or `Button` components.

Checklist:
1. **For CONVIVA_RN_VERSION <= 0.2.8:** Confirm `./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js` is in the `plugins` array of `babel.config.js` or `.babelrc`. Also confirm `add-react-displayname` is in `plugins` and `babel-plugin-add-react-displayname` is installed as a `devDependency`.
2. **For CONVIVA_RN_VERSION >= 0.3.0:** Confirm `'@convivainc/conviva-react-native-appanalytics/plugin'` is in the `plugins` array of `babel.config.js` or `.babelrc`.
3. Metro bundler was restarted with `--reset-cache` after adding the plugin.
4. The component is one of the supported types: `Button`, `TouchableHighlight`, `TouchableOpacity`, `TouchableWithoutFeedback`, `TouchableNativeFeedback`. The `Pressable` component is not automatically instrumented.
5. On Android: confirm the `android-plugin` is applied in `android/app/build.gradle` (see AGENTS-android-setup.md).

---

**Issue: `click event requires atleast one attribute` error logged by `errorHandler`**

Symptoms: `WARN [DEBUG-...] errorHandler called: ... msg=click event requires atleast one attribute` appears when tapping an auto-tracked touchable.

Cause: The SDK collects four attributes per click event:

| Attribute | Source | Populated? |
|---|---|---|
| `elementId` | `componentThis.id` | Never -- SDK-internal instance property, not set automatically |
| `elementClasses` | `componentThis.displayName` | Never -- set on the constructor, not on the instance |
| `elementType` | `componentThis.elementType` | Never -- not set anywhere |
| `elementText` | React fiber tree traversal of children | **Only when the touchable contains a `<Text>` node** |

The native layer requires at least one attribute to be non-empty. For touchables with `<Text>` children, `elementText` is populated and the event succeeds. For icon-only buttons with no text, all four attributes are empty and the error fires.

**Application-side fix -- ensure every auto-tracked touchable provides at least one non-empty attribute:**

1. **Touchables with text (preferred):** `elementText` is populated automatically by traversing the React fiber tree. Any `<Text>` node at any nesting depth satisfies the requirement:
```jsx
{/* [OK] elementText = 'Login' */}
<TouchableOpacity onPress={handleLogin}>
  <Text>Login</Text>
</TouchableOpacity>

{/* [OK] elementText = 'Submit' -- nested Text is found */}
<TouchableOpacity onPress={handleSubmit}>
  <View>
    <Icon name="check" />
    <Text>Submit</Text>
  </View>
</TouchableOpacity>
```

2. **Icon-only buttons (no Text child):** The fiber traversal only reads `<Text>` component content. `accessibilityLabel` alone does **not** populate `elementText`. Add a zero-size hidden `<Text>` label as a workaround:
```jsx
{/* [FAIL] Fails -- no Text node anywhere */}
<TouchableOpacity onPress={handleBack}>
  <Icon name="arrow-back" />
</TouchableOpacity>

{/* [OK] Fix -- hidden Text satisfies the requirement */}
<TouchableOpacity onPress={handleBack}>
  <Icon name="arrow-back" />
  <Text style={{ width: 0, height: 0, overflow: 'hidden' }}>Back</Text>
</TouchableOpacity>
```

---

## `Conviva: Display names are not available` Warning (Both Versions)

Symptoms: `console.warn('Conviva: Display names are not available')` appears in the Metro / device log when `autocaptureNavigationTrack` or `autocaptureTrack` fires.

Cause: This is a **known false positive** in the SDK. The SDK runs an internal startup probe to check whether `displayName` injection is active. The probe class intentionally does not match the patterns targeted by either the `<= 0.2.8` or `>= 0.3.0` plugins, so the warning fires unconditionally regardless of configuration.

Impact: **None on actual functionality.** The `displayName` plugin is working correctly -- the warning only reflects that the internal probe was not matched, not that real components are affected.

Action: **Ignore this warning.** No code change is needed to suppress it. Do not add or remove Babel plugin entries to try to fix it -- doing so will not affect this warning.

---

## Screen View Auto-detection Not Working

Symptoms: `screen_view` events are not firing or screen names are missing.

Checklist:
1. **For CONVIVA_RN_VERSION <= 0.2.8:** Confirm `add-react-displayname` is in the `plugins` array of `babel.config.js` or `.babelrc` and `babel-plugin-add-react-displayname` is installed as a `devDependency`. Confirm `./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js` is also in `plugins`.
2. **For CONVIVA_RN_VERSION >= 0.3.0:** Confirm `'@convivainc/conviva-react-native-appanalytics/plugin'` is in the `plugins` array of `babel.config.js`. `@babel/plugin-transform-react-display-name` is bundled inside the Conviva package and resolves automatically -- no `devDependencies` entry is required. If you see `[conviva] Could not resolve @babel/plugin-transform-react-display-name`, see the error entry above.
3. Metro bundler was restarted with `--reset-cache`.
4. For React Navigation >= 5: confirm `NavigationContainer` is wrapped with `ConvivaNavigationContainer` (the HOC wrapper).
5. For React Navigation < 5: confirm `AppNavigator` is wrapped with `withReactNavigationAutotrack(autocaptureNavigationTrack)`.
6. Screen components have meaningful display names (injected automatically by the display name plugin).

---

## iOS - Pod Install Failures

**Issue: `pod install` fails with dependency conflicts**

Symptoms: `CocoaPods could not find compatible versions for pod "ConvivaAppAnalytics"`

Fix:
1. Confirm the `ios/Podfile` `platform :ios` version is >= `'9.0'`.
2. Run `pod repo update` to refresh the spec repository, then retry `npx pod-install`.
3. If a different version of `ConvivaAppAnalytics` is already in the Podfile, remove the manual entry - it is auto-linked via the podspec.

**Issue: React Native pod linkage errors**

Symptoms: Xcode build errors about missing headers after pod install.

Fix: Run `cd ios && pod install --repo-update`. If still failing, delete `ios/Pods/`, `ios/Podfile.lock`, and re-run `npx pod-install`.

---

## iOS Hybrid - Native Tracker Issues

**Issue: Native ViewControllers not being tracked**

Symptoms: Events from React Native screens appear in Pulse, but native iOS screens (UIViewControllers) do not generate `screen_view` or other events.

Checklist:
1. Confirm `APP_TYPE_IOS` is hybrid and native `CATAppAnalytics.createTracker(...)` was added to `AppDelegate`.
2. Confirm the `createTracker` call is **before** the `RCTBridge` / `RCTRootView` setup in `application:didFinishLaunchingWithOptions:`.
3. Confirm `CUSTOMER_KEY` and `APP_NAME` match the values in `src/conviva.ts`.
4. Confirm `ConvivaAppAnalytics` appears in `ios/Podfile.lock`.
5. If using Swift: confirm `import ConvivaAppAnalytics` compiles. If not, run `pod install` again.
6. If using Obj-C: confirm `@import ConvivaAppAnalytics;` compiles. If the module is not found, run `pod install --repo-update`.

**Issue: Duplicate tracker warning or unexpected behavior**

Symptoms: Console log shows warnings about duplicate tracker initialization.

Cause: Both the native `createTracker` (in `AppDelegate`) and the JS `createTracker` (in `src/conviva.ts`) are called. This is expected for hybrid apps.

Fix: Confirm both calls use **identical** `CUSTOMER_KEY` and `APP_NAME` values. The SDK deduplicates internally when the same key and name are used. If the values differ, the SDK may create two separate trackers, causing split user journeys.

**Issue: `ConvivaAppAnalytics` module or header not found**

Symptoms: Xcode build error `Module 'ConvivaAppAnalytics' not found` (Swift) or `'ConvivaAppAnalytics/ConvivaAppAnalytics.h' file not found` (Obj-C).

Fix:
1. Confirm `npx pod-install` was run after `npm install`.
2. Confirm `ConvivaAppAnalytics` appears in `ios/Podfile.lock`.
3. Clean Xcode build folder: Product > Clean Build Folder (Cmd+Shift+K).
4. If still failing: delete `ios/Pods/` and `ios/Podfile.lock`, then re-run `npx pod-install`.

---

## Android - Gradle Sync Failures

**Issue: Gradle sync fails to resolve Conviva artifacts**

Symptoms: `Could not find com.conviva.sdk:conviva-android-tracker:<version>` or `Could not find com.conviva.sdk:android-plugin:<version>`

Fix:
1. Verify exact versions from GitHub Releases for each artifact.
2. Verify required repositories exist in the Gradle files (Maven Central, Google). Do not edit repository blocks.
3. Ask developer to verify network / proxy configuration.

**Issue: Plugin classpath conflict**

Symptoms: `Plugin with id 'com.conviva.sdk.android-plugin' not found` or classpath resolution error.

Fix:
1. For buildscript style: confirm `classpath 'com.conviva.sdk:android-plugin:<version>'` is inside `buildscript > dependencies {}` in the **root** `android/build.gradle`, not the app module build file.
2. For plugins DSL style: confirm `id 'com.conviva.sdk.android-plugin' version '<version>' apply false` is in `android/settings.gradle` pluginManagement block.
3. For `apply plugin:` in app module: confirm `apply plugin: 'com.conviva.sdk.android-plugin'` is in `android/app/build.gradle` after any `apply from:` lines.

**Issue: AGP version incompatibility (7.0 to < 7.2)**

This AGP version range is not supported. Ask the developer to upgrade AGP to >= 7.2 or use a version < 7.0.

---

## React Navigation Autotracking Not Firing

Symptoms: Navigation screen changes are not captured as `screen_view` events.

Checklist:
1. Confirm the React Navigation version from `package.json`.
2. For >= 5: `ConvivaNavigationContainer` wraps the `NavigationContainer` - not a child screen or navigator component.
3. For < 5: `withReactNavigationAutotrack(autocaptureNavigationTrack)` wraps the result of `createAppContainer(...)`.
4. The Conviva Babel plugin is in the `plugins` array of `babel.config.js` (for `>= 0.3.0`: `'@convivainc/conviva-react-native-appanalytics/plugin'`; for `<= 0.2.8`: `instrumentation/index.js` + `'add-react-displayname'`); Metro was restarted with `--reset-cache`.
5. Only one `NavigationContainer` / `AppNavigator` exists in the app. If there are multiple, each must be wrapped.

---

## Wrong Import Path

**Issue:** `Cannot find module '@convivainc/conviva-react-native-appanalytics'`

Fix:
1. Confirm the package is installed: `npm list @convivainc/conviva-react-native-appanalytics`
2. If missing: add `@convivainc/conviva-react-native-appanalytics` to `dependencies` in `package.json` and run `npm install` (or `yarn` / `pnpm install`) from the project root.
3. Clear Metro cache: `npx react-native start --reset-cache`

**Issue:** TypeScript type errors on tracker methods

Fix: Import types from the package:
```ts
import { ReactNativeTracker, createTracker } from '@convivainc/conviva-react-native-appanalytics';
```

Never import from internal paths like `@convivainc/conviva-react-native-appanalytics/src/...`.

**Issue:** TypeScript error on `<ConvivaNavigationContainer>` -- `children`, `ref`, `theme` or other props rejected

Symptoms:
```
Type '{ children: Element[]; ref: ...; theme: ...; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
```

Cause: `withReactNavigationAutotrack` returns a type narrowed to `RefAttributes<any>`, which drops all `NavigationContainer` props.

Fix: Cast `ConvivaNavigationContainer` to `typeof NavigationContainer` so TypeScript sees the full prop surface:
```ts
const ConvivaNavigationContainer =
  withReactNavigationAutotrack(autocaptureNavigationTrack)(NavigationContainer) as typeof NavigationContainer;
```
The cast is safe -- the HOC forwards all props to the underlying `NavigationContainer` at runtime.

---

## Network Request Auto-collection

**Supported HTTP clients (via native layer):**

| Client | Platform | Supported |
|---|---|---|
| OkHttp | Android | Yes (requires android-plugin) |
| Retrofit (via OkHttp) | Android | Yes (requires android-plugin) |
| HTTPSUrlConnection | Android | Yes (requires android-plugin) |
| HTTPURLConnection | Android | Yes (requires android-plugin) |
| NSURLSession | iOS | Yes |
| fetch() / XMLHttpRequest | RN JS layer | Not auto-collected |
| axios (JS layer only) | RN JS layer | Not auto-collected |

Network requests made purely in the JS layer (fetch, axios) are not automatically collected. Only requests made through the native networking layer are captured.

**Request / Response Body Collection:** Collected only when all conditions are true:

| Condition | Detail |
|---|---|
| Size | < 10 KB and `Content-Length` is present |
| Content-Type | `application/json` or `text/plain` |
| Format | `JSONObject`, nested `JSONObject`, or `JSONArray` |

**Request / Response Header Collection:** Collected only when all conditions are true:

| Condition | Detail |
|---|---|
| Format | Flat JSON object only (nested objects and arrays not supported) |
| Server config | Server provisioned with `Access-Control-Expose-Headers` |

---

## Expo-specific Issues

**Issue: `android/` or `ios/` folder not found**

Cause: Project uses Expo managed workflow. Native folders are generated only after prebuild.

Fix:
1. Run `npx expo prebuild` in the project root to generate native folders.
2. After prebuild, treat the project as Expo bare workflow.
3. Re-run `npx pod-install` from the project root.
4. Proceed with Android and iOS native setup (AGENTS-android-setup.md, AGENTS-ios-setup.md).

**Issue: `pod install` fails in Expo bare workflow**

Fix: Ensure `npx expo prebuild` was run before `pod install`. Delete `ios/Pods/` and `ios/Podfile.lock` if they pre-date prebuild, then re-run `npx pod-install`.

**Issue: Gradle sync fails after Expo prebuild**

Fix: In `android/`, run `./gradlew clean` then retry Gradle sync. If dependency resolution fails, verify exact tracker and plugin versions from GitHub Releases.

---

## New Architecture / Hermes Compatibility

React Native 0.71 and above supports the New Architecture (Bridgeless mode, Fabric renderer) and uses Hermes as the default JS engine.

**Issue: Metro bundler fails with Hermes after adding Babel plugins**

Symptoms: `SyntaxError` or transform errors when using Hermes.

Fix:
1. Confirm `babel.config.js` uses `metro-react-native-babel-preset` as the preset (not `babel-preset-react-native`).
2. Clear Metro cache and restart:
   ```bash
   npx react-native start --reset-cache
   ```

**Issue: SDK events not appearing with New Architecture enabled**

The SDK bridges through the legacy React Native bridge. If New Architecture (Bridgeless mode) is fully enabled, confirm the following in your project:
- Android (`android/gradle.properties`): `newArchEnabled=false` (or verify SDK support with Conviva).
- iOS (`ios/Podfile`): `ENV['RCT_NEW_ARCH_ENABLED'] = '0'` (or verify SDK support with Conviva).

If New Architecture support is required, contact Conviva support for the latest compatibility status before disabling.

**Issue: Hermes source maps missing in crash reports**

This is unrelated to the Conviva SDK. Hermes source maps must be generated separately during the build. See React Native documentation for Hermes source map configuration.

---

## Initialization Not Taking Effect

**Issue:** Events are not appearing in Pulse / Live Lens.

Checklist:
1. `createTracker` is called before any events are tracked.
2. `CUSTOMER_KEY` is the correct production or debug key from the Pulse account info page.
3. The device / simulator has network access to Conviva backend endpoints.
4. For Android: confirm the `conviva-android-tracker` dependency is in `android/app/build.gradle`.
5. For iOS: confirm `npx pod-install` was run and `ConvivaAppAnalytics` appears in `ios/Podfile.lock`. For hybrid iOS apps: confirm native `CATAppAnalytics.createTracker(...)` is called in `AppDelegate` with the same `CUSTOMER_KEY` and `APP_NAME` as the JS call.

---

## ProGuard / R8 Obfuscation (Android)

**Issue:** SDK classes are obfuscated and events stop being reported after a release build.

Fix: Confirm these rules are in `android/app/proguard-rules.pro`:
```proguard
-keepnames class * extends android.view.View
-keep,allowshrinking class com.conviva.** { *; }
```

These rules must be in the file referenced by `proguardFiles` in `android/app/build.gradle`. Not in library module ProGuard files.
