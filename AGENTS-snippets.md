# Conviva React Native App Analytics - JS/TS Snippets

Only read this file when directed by AGENTS.md. All imports use `@convivainc/conviva-react-native-appanalytics`.

---

## Initialization

Always create a dedicated `src/conviva.ts` (TypeScript) or `src/conviva.js` (JavaScript) module. Call `createTracker` once at module level in this file and export the tracker instance. Then side-effect import it from the root component so the tracker is initialized before any screen renders.

**`src/conviva.ts` (TypeScript):**
```ts
import { createTracker, ReactNativeTracker } from '@convivainc/conviva-react-native-appanalytics';

export const tracker: ReactNativeTracker = createTracker('YOUR_CUSTOMER_KEY', 'YOUR_APP_NAME');
```

**`src/conviva.js` (JavaScript):**
```js
import { createTracker } from '@convivainc/conviva-react-native-appanalytics';

export const tracker = createTracker('YOUR_CUSTOMER_KEY', 'YOUR_APP_NAME');
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
tracker.trackCustomEvent('my_event', { key: 'value' });
```

**Importing via relative path (when no alias is configured):**

```ts
import { tracker } from '../conviva';
tracker.trackCustomEvent('my_event', { key: 'value' });
```

Before writing any import, check `babel.config.js` (or `.babelrc`) for a `module-resolver` plugin with an `alias` entry pointing to `src/`. Use the alias form if present; use a relative path otherwise.

**Pattern 2 - React Context (for larger apps that need dependency injection):**

```ts
// ConvivaContext.tsx
import React, { createContext, useContext } from 'react';
import { createTracker, ReactNativeTracker } from '@convivainc/conviva-react-native-appanalytics';

const tracker: ReactNativeTracker = createTracker('YOUR_CUSTOMER_KEY', 'YOUR_APP_NAME');
const ConvivaContext = createContext<ReactNativeTracker>(tracker);

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
tracker.trackCustomEvent('my_event', { key: 'value' });
```

**Pattern 3 - Root component with prop drilling (only for very small apps with no Redux/Context layer):**

Initialize in `src/conviva.ts` and pass `tracker` as a prop to child screens that need it directly.

---

## User ID

Place immediately after successful login or registration at the convergence point. Use the tracker returned from `createTracker`, or the same module-level instance.

**Set user ID (preferred - using setSubjectData):**
```js
tracker.setSubjectData({ userId: userId });
```

**Set user ID (alternative):**
```js
tracker.setUserId(userId);
```

**Clear on logout:**
```js
tracker.setSubjectData({ userId: null });
// or
tracker.setUserId(null);
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
tracker.trackCustomEvent(eventName, eventData);
```

**TypeScript:**
```ts
tracker.trackCustomEvent('your_event_name', {
  identifier1: 42,
  identifier2: true,
  identifier3: 'stringValue',
});
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
tracker.setCustomTags(tagsToSet);
```

**Set tags with category:**
```js
tracker.setCustomTagsWithCategory('categoryName', {
  tagKey1: 'tagValue1',
  tagKey2: 100,
});
```

**Clear specific tags:**
```js
tracker.clearCustomTags(['tagKey1', 'tagKey2']);
```

**Clear all tags:**
```js
tracker.clearAllCustomTags();
```

---

## PageView Tracking

Use to track in-app page navigations explicitly (distinct from automatic screen view tracking).

```js
tracker.trackPageView({
  pageUrl: 'https://example.com/page',
  pageTitle: 'Page Title',    // optional
  referrer: 'https://example.com', // optional
});
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

const ConvivaNavigationContainer =
  withReactNavigationAutotrack(autocaptureNavigationTrack)(NavigationContainer);
```

**TypeScript:**
```ts
import { NavigationContainer } from '@react-navigation/native';
import {
  withReactNavigationAutotrack,
  autocaptureNavigationTrack,
} from '@convivainc/conviva-react-native-appanalytics';

const ConvivaNavigationContainer =
  withReactNavigationAutotrack(autocaptureNavigationTrack)(NavigationContainer) as typeof NavigationContainer;

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

const App = withReactNavigationAutotrack(autocaptureNavigationTrack)(AppNavigator);

export default App;
```

---

## Babel Plugin Configuration

The required Babel configuration depends on the installed `CONVIVA_RN_VERSION`. Check `package.json` before applying.

### For CONVIVA_RN_VERSION <= 0.2.8

Add two separate plugins for button click auto-detection and screen view display name injection.

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

Add `babel-plugin-add-react-displayname` to `devDependencies` in `package.json` using the exact `ADD_DISPLAYNAME_VERSION`:
```json
"babel-plugin-add-react-displayname": "<ADD_DISPLAYNAME_VERSION>"
```
Then run `npm install` (or `yarn` / `pnpm install`) from the project root.

---

### For CONVIVA_RN_VERSION >= 0.2.9

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

> The Conviva instrumentation plugin bundles `@babel/plugin-transform-react-display-name` internally via Babel's `inherits` -- do NOT add it separately to `plugins`. Display name injection for screen_view auto-detection is handled automatically.
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

// In your component render:
<WebView
  source={{ uri: 'https://your-web-app.com' }}
  onMessage={getWebViewCallback()}
/>
```

---

## Client ID (Optional)

```js
import { getClientId, setClientId } from '@convivainc/conviva-react-native-appanalytics';

// Get current client ID
const clientId = await getClientId();

// Set a specific client ID
await setClientId('your-client-id');
```
