# Conviva React Native App Analytics - Developer Integration Guide

Use the Conviva React Native App Analytics SDK to auto-collect events and track application-specific events and state changes. The React Native bridges are internally built on top of the [Android](https://github.com/Conviva/conviva-android-appanalytics) and [iOS](https://github.com/Conviva/conviva-ios-appanalytics) native sensors.

**Table of Contents**
- [Quick Start](#quick-start)
- [More Features](#more-features)
- [Auto-collected Events](#auto-collected-events)
- [FAQ](#faq)

---

## Quick Start

### Supported Platforms

| Platform | Minimum Version |
|---|---|
| Android | Android 5.0 (API level 21) |
| iOS / tvOS | iOS 9.0 / tvOS 9.0 |
| React Native | 0.60+ (auto-linking supported) |
| Expo bare workflow | Supported (requires native setup below) |
| Expo managed workflow | Run `npx expo prebuild` first to generate native folders |

### Expo Projects

**Bare workflow** (created with `expo init --template bare-minimum` or ejected): The `android/` and `ios/` folders exist. Follow all steps below as for standard React Native.

**Managed workflow** (created with `npx create-expo-app` without ejecting, no `android/` or `ios/` folders): Native folders must be generated before native setup is possible.

```bash
npx expo prebuild
```

After prebuild, the project behaves as Expo bare workflow. Complete all steps below.

Steps 1 (add to `package.json`), 5 (Babel plugin), and 6 (React Navigation setup) apply to both managed and bare Expo workflows regardless of prebuild status.

### 1. Add the npm Package to `package.json`

> **Do not run `npm install` / `yarn add` for this package in isolation.** Instead, add the entries to `package.json` manually and run the install command once after all edits are complete.

Add to `dependencies` in `package.json`:
```json
"@convivainc/conviva-react-native-appanalytics": "<version>"
```

Then run the install command from the project root (use whichever matches your project):
```bash
npm install
```
```bash
yarn
```

After installing, run pod install for iOS:
```bash
npx pod-install
```

### 2. Android Native Setup

#### 2a. Determine Your App Type

Before adding the tracker dependency, identify whether your Android app is **standard React Native** or **hybrid**:

| App Type | Description |
|---|---|
| **Standard React Native** | All screens are React Native. The only Activity is `MainActivity` extending `ReactActivity`. No native Android Activities outside the RN bridge. |
| **Hybrid** | Contains native Android Activities (Java/Kotlin) that run outside the React Native bridge -- for example, a native splash screen, login screen, or settings activity. |

**Standard React Native apps:** The React Native bridge initializes the tracker automatically when you call `createTracker(...)` in JavaScript (Step 4). You do not need to add the tracker dependency or call `createTracker` natively. Skip ahead to [Step 2b](#2b-add-the-gradle-plugin-for-button-click-and-network-request-auto-collection).

**Hybrid apps with multiple Activities:** The tracker must also be initialized natively so that native Activities are tracked from app start, before the React Native bridge loads. Continue with the steps below.

#### Add the Tracker Dependency (Hybrid Apps only)

In `android/app/build.gradle`, add to `dependencies {}`:

```groovy
dependencies {
    // ...
    implementation 'com.conviva.sdk:conviva-android-tracker:<ANDROID_TRACKER_VERSION>'
}
```

> **Important:** `<ANDROID_TRACKER_VERSION>` is the version of the Android native tracker artifact -- it is **independent of the npm package version** (`CONVIVA_RN_VERSION`). Find the correct version at [GitHub Releases](https://github.com/Conviva/conviva-android-appanalytics/releases). Do not use the npm version number here.

#### Initialize the Native Tracker (Hybrid Apps only)

After adding the dependency, initialize the tracker in your Android `Application` class's `onCreate()`. This ensures all native Activities are covered from app start.

**Find your Application class:** Check the `android:name` attribute on the `<application>` tag in `android/app/src/main/AndroidManifest.xml`. If no custom Application class exists, use the MAIN/LAUNCHER Activity.

**Java:**
```java
// Exception is java.lang.Exception — auto-imported in every Java file, no import statement needed
import com.conviva.apptracker.ConvivaAppAnalytics;
import com.conviva.apptracker.controller.TrackerController;

public class MyApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        try {
            TrackerController tracker = ConvivaAppAnalytics.createTracker(this, "YOUR_CUSTOMER_KEY", "YOUR_APP_NAME");
            if (tracker == null) {
                // handle initialization failure
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

**Kotlin:**
```kotlin
// Exception is kotlin.Exception — auto-imported in every Kotlin file, no import statement needed
import com.conviva.apptracker.ConvivaAppAnalytics

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        try {
            val tracker = ConvivaAppAnalytics.createTracker(this, "YOUR_CUSTOMER_KEY", "YOUR_APP_NAME")
            if (tracker == null) {
                // handle initialization failure
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
```

> Use the same `YOUR_CUSTOMER_KEY` and `YOUR_APP_NAME` values as in your JavaScript `createTracker(...)` call (Step 4). Do not hardcode these -- they must match exactly.
>
> Do not create a new `Application` class if one does not exist -- ask your developer to create one, or use the MAIN/LAUNCHER Activity.

#### 2b. Add the Gradle Plugin (for button click and network request auto-collection)

**For Android Gradle Plugin (AGP) >= 8.0 - use plugin version 0.3.x:**

In the **root** `android/build.gradle`:
```groovy
buildscript {
    dependencies {
        // ...
        classpath 'com.conviva.sdk:android-plugin:0.3.x'
    }
}
```

**For AGP below 8.0 - use plugin version 0.2.x:**

In the **root** `android/build.gradle`:
```groovy
buildscript {
    dependencies {
        // ...
        classpath 'com.conviva.sdk:android-plugin:0.2.x'
    }
}
```

In `android/app/build.gradle`, apply the plugin at the end of the plugins section:
```groovy
apply plugin: 'com.conviva.sdk.android-plugin'
```

Or in Kotlin DSL (`android/app/build.gradle.kts`):
```kotlin
plugins {
    // ...
    id("com.conviva.sdk.android-plugin")
}
```

#### 2c. ProGuard / R8 Rules

Append to `android/app/proguard-rules.pro`:
```proguard
-keepnames class * extends android.view.View
-keep,allowshrinking class com.conviva.** { *; }
```

### 3. iOS Native Setup

The `ConvivaAppAnalytics` pod is automatically resolved via `RNConvivaAppAnalytics.podspec` when `npx pod-install` runs. No manual Podfile changes are needed.

Verify that `ios/Podfile` has `platform :ios, '9.0'` or higher.

#### Multi-SDK Runtime Stability (Info.plist)

If your app integrates multiple SDKs that use ISA-swizzling (e.g., analytics, crash reporting, or A/B testing SDKs), add the following key to `ios/<YourAppName>/Info.plist` to prevent runtime crashes:

```xml
<key>CATGeneratedClassDisposeDisabled</key>
<true/>
```

This setting causes the SDK to retain a small, predictable amount of class metadata in memory, which improves runtime stability when multiple swizzling SDKs are present.

### 4. Initialize the Tracker

Call `createTracker` once, at app startup, before any screen rendering. Place it at the top of your root component file (`App.js`, `App.tsx`, or `index.js`).

**JavaScript:**
```js
import { createTracker } from '@convivainc/conviva-react-native-appanalytics';

let tracker;
try {
  tracker = createTracker('YOUR_CUSTOMER_KEY', 'YOUR_APP_NAME');
  if (!tracker) {
    console.error('Tracker initialization returned null');
  }
} catch (error) {
  console.error(error);
}
```

**TypeScript:**
```ts
import { createTracker, ReactNativeTracker } from '@convivainc/conviva-react-native-appanalytics';

let tracker: ReactNativeTracker | undefined;
try {
  tracker = createTracker('YOUR_CUSTOMER_KEY', 'YOUR_APP_NAME');
  if (!tracker) {
    console.error('Tracker initialization returned null');
  }
} catch (error) {
  console.error(error);
}
```

> **YOUR_CUSTOMER_KEY** - A string to identify your Conviva account. Use separate keys for debug and production. Find your keys on the Pulse account info page.
> **YOUR_APP_NAME** - A string value that uniquely identifies your app across platforms.

### 5. Babel Plugin Setup (Button Clicks and `displayName` Auto-detection)

The required Babel configuration depends on your installed version of `@convivainc/conviva-react-native-appanalytics`. Check the version in your `package.json`.

#### For version <= 0.2.8

Add two separate plugins to your `babel.config.js` -- one for button click auto-detection and one for `displayName` injection:

**`babel.config.js`:**
```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    './node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js',
    'add-react-displayname',
  ],
};
```

Add the following to `devDependencies` in `package.json`:
```json
"babel-plugin-add-react-displayname": "0.0.5",
"babel-types": "^6.26.0",
"babel-template": "^6.26.0"
```

- `babel-plugin-add-react-displayname` `0.0.5` is the final published version of the package.
- `babel-types` and `babel-template` at `^6.26.0` are required by `instrumentation/index.js`; they are legacy Babel 6 packages not installed automatically in Babel 7 projects.

Then run `npm install` (or `yarn`) from the project root.

#### For version >= 0.3.0

A single unified Conviva plugin handles both button click auto-detection and `displayName` injection. **No extra dependencies are needed in the app.**

**`babel.config.js`:**
```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    '@convivainc/conviva-react-native-appanalytics/plugin',
  ],
};
```

`displayName` auto-detection is absorbed internally by the Conviva plugin. Do **not** add `add-react-displayname`, `babel-plugin-add-react-displayname`, or `@babel/plugin-transform-react-display-name` to `plugins` or `devDependencies`.

---

After updating `babel.config.js`, restart Metro with `--reset-cache` (applies to both versions):
```bash
npx react-native start --reset-cache
```

The Conviva instrumentation plugin enables auto-detection of button clicks for: `Button`, `TouchableHighlight`, `TouchableOpacity`, `TouchableWithoutFeedback`, and `TouchableNativeFeedback` components.

### 6. React Navigation Setup (Screen View Auto-detection)

#### React Navigation >= 5

Wrap your `NavigationContainer` with `withReactNavigationAutotrack`. The original `NavigationContainer` import must remain -- it is passed to the HOC and used internally.

**JavaScript:**
```js
import { NavigationContainer } from '@react-navigation/native';
import {
  withReactNavigationAutotrack,
  autocaptureNavigationTrack,
} from '@convivainc/conviva-react-native-appanalytics';

let ConvivaNavigationContainer;
try {
  ConvivaNavigationContainer =
    withReactNavigationAutotrack(autocaptureNavigationTrack)(NavigationContainer);
  if (!ConvivaNavigationContainer) {
    console.error('Navigation container setup returned null');
  }
} catch (error) {
  console.error(error);
}
```

**TypeScript** -- add `as typeof NavigationContainer` to preserve prop types for JSX type-checking:
```ts
import { NavigationContainer } from '@react-navigation/native';
import {
  withReactNavigationAutotrack,
  autocaptureNavigationTrack,
} from '@convivainc/conviva-react-native-appanalytics';

let ConvivaNavigationContainer: typeof NavigationContainer | undefined;
try {
  ConvivaNavigationContainer =
    withReactNavigationAutotrack(autocaptureNavigationTrack)(NavigationContainer) as typeof NavigationContainer;
  if (!ConvivaNavigationContainer) {
    console.error('Navigation container setup returned null');
  }
} catch (error) {
  console.error(error);
}

export default function App() {
  return (
    <ConvivaNavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </ConvivaNavigationContainer>
  );
}
```

#### React Navigation < 5

Wrap the `AppNavigator` (result of `createAppContainer()`) with `withReactNavigationAutotrack`:

```js
import { createStackNavigator, createAppContainer } from 'react-navigation';
import {
  withReactNavigationAutotrack,
  autocaptureNavigationTrack,
} from '@convivainc/conviva-react-native-appanalytics';

const AppNavigator = createAppContainer(
  createStackNavigator(
    { Home: HomeScreen, Settings: SettingsScreen },
    { initialRouteName: 'Home' }
  )
);

let App;
try {
  App = withReactNavigationAutotrack(autocaptureNavigationTrack)(AppNavigator);
  if (!App) {
    console.error('Navigation app setup returned null');
  }
} catch (error) {
  console.error(error);
}
export default App;
```

---

## More Features

### Set the User ID (Viewer ID)

User ID is a unique string identifier to distinguish individual viewers. If using Conviva Video Sensor, match it with the Viewer ID. Use a non-PII identifier only (opaque provider UID, stored UUID, or backend account ID - never email or phone).

```js
try {
  if (tracker != null) {
    tracker.setSubjectData({ userId: 'your-non-pii-user-id' });
  }
} catch (error) {
  console.error(error);
}
```

Clear on logout:
```js
try {
  if (tracker != null) {
    tracker.setSubjectData({ userId: null });
  }
} catch (error) {
  console.error(error);
}
```

### Track Custom Events

Use `trackCustomEvent()` to track application-specific events.

| Parameter | Type | Description |
|---|---|---|
| `eventName` | `string` | Name of the custom event (mandatory) |
| `eventData` | `object` | Any JSON-serializable object |

```js
try {
  if (tracker != null) {
    tracker.trackCustomEvent('custom_event_name', {
      tagKey1: 'tagValue1',
      tagKey2: 100,
      tagKey3: true,
    });
  }
} catch (error) {
  console.error(error);
}
```

### Track Revenue Events (>= 0.2.8)

Use `trackRevenueEvent()` to track purchase and revenue events.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `totalOrderAmount` | `number` | Yes | Total order amount |
| `transactionId` | `string` | Yes | Unique transaction identifier |
| `currency` | `string` | Yes | Currency code (e.g. `"USD"`) |
| `taxAmount` | `number` | No | Tax amount |
| `shippingCost` | `number` | No | Shipping cost |
| `discount` | `number` | No | Order-level discount amount |
| `cartSize` | `number` | No | Number of items in the cart |
| `paymentMethod` | `string` | No | Payment method used |
| `paymentProvider` | `string` | No | Payment provider name |
| `items` | `RevenueEventItemProps[]` | No | Array of purchased items |
| `extraMetadata` | `object` | No | Any additional key-value pairs |

Each item in `items` may include: `productId`, `name`, `sku`, `category`, `unitPrice`, `quantity`, `discount`, `brand`, `variant`, `extraMetadata`.

```js
try {
  if (tracker != null) {
    tracker.trackRevenueEvent({
      totalOrderAmount: 49.99,
      transactionId: 'txn-001',
      currency: 'USD',
      taxAmount: 4.50,
      shippingCost: 5.99,
      paymentMethod: 'credit_card',
      items: [
        {
          productId: 'prod-123',
          name: 'Widget',
          unitPrice: 19.99,
          quantity: 2,
        },
      ],
    });
  }
} catch (error) {
  console.error(error);
}
```

### Set / Clear Custom Tags

Custom tags are global key-value pairs attached to all subsequent events until cleared.

**Set tags:**
```js
try {
  if (tracker != null) {
    tracker.setCustomTags({
      tagKey1: 'tagValue1',
      tagKey2: 100,
      tagKey3: true,
    });
  }
} catch (error) {
  console.error(error);
}
```

**Set tags with category:**
```js
try {
  if (tracker != null) {
    tracker.setCustomTagsWithCategory('myCategory', {
      tagKey1: 'tagValue1',
    });
  }
} catch (error) {
  console.error(error);
}
```

**Clear specific tags:**
```js
try {
  if (tracker != null) {
    tracker.clearCustomTags(['tagKey1', 'tagKey2']);
  }
} catch (error) {
  console.error(error);
}
```

**Clear all tags:**
```js
try {
  if (tracker != null) {
    tracker.clearAllCustomTags();
  }
} catch (error) {
  console.error(error);
}
```

### Track Page View Events

Use `trackPageView()` to track in-app page navigations explicitly.

```js
try {
  if (tracker != null) {
    tracker.trackPageView({
      pageUrl: 'https://example.com/home',
      pageTitle: 'Home',    // optional
      referrer: 'https://example.com', // optional
    });
  }
} catch (error) {
  console.error(error);
}
```

### WebView Event Bridge

To track events from web content rendered in `react-native-webview`:

```js
import { getWebViewCallback } from '@convivainc/conviva-react-native-appanalytics';
import { WebView } from 'react-native-webview';

let webViewCallback;
try {
  webViewCallback = getWebViewCallback();
  if (!webViewCallback) {
    console.error('WebView callback setup returned null');
  }
} catch (error) {
  console.error(error);
}

<WebView
  source={{ uri: 'https://your-web-app.com' }}
  onMessage={webViewCallback}
/>
```

The web app must use the Conviva WebView tracker to send events.

### Client ID

```js
import { getClientId, setClientId } from '@convivainc/conviva-react-native-appanalytics';

try {
  const id = await getClientId();
  if (id == null) {
    console.error('getClientId returned null');
  }
  await setClientId('custom-client-id');
} catch (error) {
  console.error(error);
}
```

---

## Auto-collected Events

Conviva automatically collects a rich set of app performance metrics after completing the Quick Start.

| Event | Occurrence | Requirements |
|---|---|---|
| `network_request` | After receiving a network request response | Android: requires android-plugin; iOS: auto-collected |
| `screen_view` | When a screen is interacted with on first launch or relaunch | Native sensors + Conviva instrumentation plugin + navigation container wrapping |
| `application_error` | When an unhandled error occurs in the application | Auto-collected from native sensors |
| `button_click` | On button click callback | Native sensors + Conviva instrumentation babel plugin |
| `application_background` | When the app moves to the background | Auto-collected from native sensors |
| `application_foreground` | When the app moves to the foreground | Auto-collected from native sensors |
| `application_install` | When the app is launched for the first time after install | Auto-collected from native sensors |

### Validation

To verify the integration for auto-collected events, check the [validation dashboard](https://pulse.conviva.com/app/appmanager/ecoIntegration/validation) _(Conviva login required)_.

---

## FAQ

[DPI Integration FAQ](https://pulse.conviva.com/learning-center/content/sensor_developer_center/tools/eco_integration/eco_integration_faq.htm)
