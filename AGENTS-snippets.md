# Conviva React Native App Analytics - JS/TS Snippets

Only read this file when directed by AGENTS.md. All imports use `@convivainc/conviva-react-native-appanalytics`.

---

## Initialization

Always create a dedicated `src/conviva.ts` (TypeScript) or `src/conviva.js` (JavaScript) module. Call `createTracker` once at module level in this file and export the tracker instance. Then side-effect import it from the root component so the tracker is initialized before any screen renders.

**`src/conviva.ts` (TypeScript):**
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
export { tracker };
```

**`src/conviva.js` (JavaScript):**
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
export { tracker };
```

**Root component (`App.tsx` / `App.js` / `index.js`) — side-effect import only:**
```ts
import './conviva';
```

> **YOUR_CUSTOMER_KEY** - A string to identify this specific Conviva account. Use separate keys for development/debug and production.
> **YOUR_APP_NAME** - A string value for the app name that uniquely identifies your app across platforms.

**Do NOT** call `createTracker` inside `App.tsx` or any other file. The `conviva.ts` module is the single source of truth for tracker initialization.

---

## Accessing the Tracker Across Components

Call `createTracker` exactly once — inside `src/conviva.ts` (or `src/conviva.js`). Import the exported tracker instance wherever it is needed. Never re-initialize.

**Importing via path alias (preferred when a `@src` or similar alias is configured in `babel.config.js` / `tsconfig.json`):**

```ts
import { tracker } from '@src/conviva';
try {
  if (tracker != null) {
    tracker.trackCustomEvent('my_event', { key: 'value' });
  }
} catch (error) {
  console.error(error);
}
```

**Importing via relative path (when no alias is configured):**

```ts
import { tracker } from '../conviva';
try {
  if (tracker != null) {
    tracker.trackCustomEvent('my_event', { key: 'value' });
  }
} catch (error) {
  console.error(error);
}
```

Before writing any import, check `babel.config.js` (or `.babelrc`) for a `module-resolver` plugin with an `alias` entry pointing to `src/`. Use the alias form if present; use a relative path otherwise.

**Pattern 2 - React Context (for larger apps that need dependency injection):**

```ts
// ConvivaContext.tsx
import React, { createContext, useContext } from 'react';
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
const ConvivaContext = createContext<ReactNativeTracker | undefined>(tracker);

export const ConvivaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConvivaContext.Provider value={tracker}>{children}</ConvivaContext.Provider>
);

export const useConviva = (): ReactNativeTracker => useContext(ConvivaContext);
```

Wrap the root component:
```tsx
// App.tsx
import { ConvivaProvider } from './ConvivaContext';

export default function App() {
  return (
    <ConvivaProvider>
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>
    </ConvivaProvider>
  );
}
```

Use in any component:
```tsx
const tracker = useConviva();
try {
  if (tracker != null) {
    tracker.trackCustomEvent('my_event', { key: 'value' });
  }
} catch (error) {
  console.error(error);
}
```

**Pattern 3 - Root component with prop drilling (only for very small apps with no Redux/Context layer):**

Initialize in `src/conviva.ts` and pass `tracker` as a prop to child screens that need it directly.

---

## iOS Native Tracker Initialization (Hybrid Apps Only)

For hybrid iOS apps with native ViewControllers, initialize the tracker natively in `AppDelegate` before the RN bridge loads. This ensures native screens are tracked from app launch.

**Objective-C (`AppDelegate.m` or `AppDelegate.mm`):**
```objc
@import Foundation;      // Required for NSException and NSLog
@import ConvivaAppAnalytics;

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

    @try {
        id<CATTrackerController> tracker = [CATAppAnalytics createTrackerWithCustomerKey:@"YOUR_CUSTOMER_KEY" appName:@"YOUR_APP_NAME"];
        if (tracker == nil) {
            NSLog(@"Conviva tracker init returned nil");
        }
    } @catch (NSException *exception) {
        NSLog(@"Conviva tracker init failed: %@", exception);
    }

    // ... existing RCTBridge / RCTRootView setup ...
    return YES;
}

@end
```

**Swift (`AppDelegate.swift`):**
```swift
import ConvivaAppAnalytics

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Note: CATAppAnalytics.createTracker is an Objective-C method and does not throw Swift errors.
        // Use guard to safely handle a nil result.
        guard let tracker = CATAppAnalytics.createTracker(customerKey: "YOUR_CUSTOMER_KEY", appName: "YOUR_APP_NAME") else {
            return false
        }

        // ... existing RCTBridge / RCTRootView setup ...
        return true
    }
}
```

> **YOUR_CUSTOMER_KEY** and **YOUR_APP_NAME** must match the values used in the JavaScript `createTracker(...)` call in `src/conviva.ts`. The SDK deduplicates internally -- the second `createTracker` call from the JS bridge reuses the tracker already initialized natively.
>
> Use only the two-argument form. Do not pass a configuration dictionary or builder as a third argument.

---

## User ID

Place immediately after successful login or registration at the convergence point. Use the tracker returned from `createTracker`, or the same module-level instance.

**Set user ID (preferred - using setSubjectData):**
```js
try {
  if (tracker != null) {
    tracker.setSubjectData({ userId: userId });
  }
} catch (error) {
  console.error(error);
}
```

**Set user ID (alternative):**
```js
try {
  if (tracker != null) {
    tracker.setUserId(userId);
  }
} catch (error) {
  console.error(error);
}
```

**Clear on logout:**
```js
try {
  if (tracker != null) {
    tracker.setSubjectData({ userId: null });
    // or
    tracker.setUserId(null);
  }
} catch (error) {
  console.error(error);
}
```

> `userId` must be a non-PII identifier: opaque provider UID, stored UUID, or backend account ID. Never pass email, phone, full name, or any PII.

---

## Custom Events

```js
const eventName = 'your_event_name';
const eventData = {
  identifier1: intValue,
  identifier2: boolValue,
  identifier3: 'stringValue',
};
try {
  if (tracker != null) {
    tracker.trackCustomEvent(eventName, eventData);
  }
} catch (error) {
  console.error(error);
}
```

**TypeScript:**
```ts
try {
  if (tracker != null) {
    tracker.trackCustomEvent('your_event_name', {
      identifier1: 42,
      identifier2: true,
      identifier3: 'stringValue',
    });
  }
} catch (error) {
  console.error(error);
}
```

---

## Custom Tags

Custom tags are global key-value pairs applied to all subsequent events until cleared.

**Set tags:**
```js
const tagsToSet = {
  tagKey1: 'tagValue1',
  tagKey2: 100,
  tagKey3: true,
};
try {
  if (tracker != null) {
    tracker.setCustomTags(tagsToSet);
  }
} catch (error) {
  console.error(error);
}
```

**Set tags with category:**
```js
try {
  if (tracker != null) {
    tracker.setCustomTagsWithCategory('categoryName', {
      tagKey1: 'tagValue1',
      tagKey2: 100,
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

---

## Revenue Event Tracking (>= 0.2.8)

Use `trackRevenueEvent()` to track purchase and revenue events. Required fields: `totalOrderAmount`, `transactionId`, `currency`.

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

**TypeScript:**
```ts
import { RevenueEventProps } from '@convivainc/conviva-react-native-appanalytics';

const revenueEvent: RevenueEventProps = {
  totalOrderAmount: 49.99,
  transactionId: 'txn-001',
  currency: 'USD',
};
try {
  if (tracker != null) {
    tracker.trackRevenueEvent(revenueEvent);
  }
} catch (error) {
  console.error(error);
}
```

---

## PageView Tracking

Use to track in-app page navigations explicitly (distinct from automatic screen view tracking).

```js
try {
  if (tracker != null) {
    tracker.trackPageView({
      pageUrl: 'https://example.com/page',
      pageTitle: 'Page Title',    // optional
      referrer: 'https://example.com', // optional
    });
  }
} catch (error) {
  console.error(error);
}
```

---

## React Navigation Autotracking

### React Navigation >= 5 (NavigationContainer)

Import and wrap `NavigationContainer` in your root component. Pass all existing props unchanged.

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

**TypeScript:**
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

// In your render / return:
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

### React Navigation < 5 (createAppContainer)

Wrap the result of `createAppContainer()` with `withReactNavigationAutotrack(autocaptureNavigationTrack)`.

```js
import { createStackNavigator, createAppContainer } from 'react-navigation';
import {
  withReactNavigationAutotrack,
  autocaptureNavigationTrack,
} from '@convivainc/conviva-react-native-appanalytics';

const AppNavigator = createAppContainer(
  createStackNavigator(
    {
      Home: { screen: HomeScreen },
      Settings: { screen: SettingsScreen },
    },
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

## Babel Plugin Configuration

The required Babel configuration depends on the installed `CONVIVA_RN_VERSION`. Check `package.json` before applying.

### For CONVIVA_RN_VERSION <= 0.2.8

Add two separate plugins for button click auto-detection and `displayName` injection.

#### babel.config.js

```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // ... existing plugins ...
    './node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js',
    'add-react-displayname',
  ],
};
```

#### .babelrc

```json
{
  "presets": ["module:metro-react-native-babel-preset"],
  "plugins": [
    "./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js",
    "add-react-displayname"
  ]
}
```

Add the following to `devDependencies` in `package.json`:
```json
"babel-plugin-add-react-displayname": "0.0.5",
"babel-types": "^6.26.0",
"babel-template": "^6.26.0"
```

- `babel-plugin-add-react-displayname` `0.0.5` is the final published version.
- `babel-types` and `babel-template` at `^6.26.0` are legacy Babel 6 packages required by `instrumentation/index.js`; they are not installed automatically in Babel 7 projects.

Then run `npm install` (or `yarn` / `pnpm install`) from the project root.

---

### For CONVIVA_RN_VERSION >= 0.3.0

A single unified Conviva plugin handles both button click and screen view auto-detection.

#### babel.config.js

Add the Conviva instrumentation plugin to the `plugins` array. Append only - do not modify or remove existing entries.

```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // ... existing plugins ...
    '@convivainc/conviva-react-native-appanalytics/plugin',
  ],
};
```

#### .babelrc

```json
{
  "presets": ["module:metro-react-native-babel-preset"],
  "plugins": [
    "@convivainc/conviva-react-native-appanalytics/plugin"
  ]
}
```

> The Conviva instrumentation plugin bundles `@babel/plugin-transform-react-display-name` internally via Babel's `inherits` -- do NOT add it separately to `plugins`. `displayName` injection (used for button click and screen_view component identification) is handled automatically.
> `@babel/plugin-transform-react-display-name` is declared as a direct `dependency` of the Conviva package and installs transitively into the host project's `node_modules` -- no explicit `devDependencies` entry is required.

---

After modifying `babel.config.js` (either version), restart the Metro bundler with `--reset-cache`:
```bash
npx react-native start --reset-cache
```

---

## WebView Event Bridge (Optional)

To track events from web content rendered in `react-native-webview`, set the `onMessage` callback:

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

// In your component render:
<WebView
  source={{ uri: 'https://your-web-app.com' }}
  onMessage={webViewCallback}
/>
```

---

## Client ID (Optional)

```js
import { getClientId, setClientId } from '@convivainc/conviva-react-native-appanalytics';

try {
  // Get current client ID
  const clientId = await getClientId();
  if (clientId == null) {
    console.error('getClientId returned null');
  }

  // Set a specific client ID
  await setClientId('your-client-id');
} catch (error) {
  console.error(error);
}
```
