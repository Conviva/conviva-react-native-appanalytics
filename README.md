# conviva-react-native-appanalytics
## Application Analytics for Conviva React Native Sensor
Use Application Analytics to autocollect events, track application specific events and state changes, and track users anonymously. The React Native Bridges are internally built on top of the [Android](https://github.com/Conviva/conviva-android-appanalytics) and [iOS](https://github.com/Conviva/conviva-ios-appanalytics) Native Sensors.

## Installation

### Install via npm:
```js
npm install @convivainc/conviva-react-native-appanalytics --save
npx pod-install
```

## Android Gradle dependency
Add the following line to app's build.gradle file along with the dependencies:
```
dependencies {
    ...
    implementation 'com.conviva.sdk:conviva-android-tracker:<version>'
}
```

## Initialize the tracker
```js
import { createTracker } from '@convivainc/conviva-react-native-appanalytics';

createTracker(customerKey: string, appName: string);

const tracker = createTracker(
  customerKey,
  appName
);
```
<strong>customerKey</strong> - a string to identify specific customer account. Different keys shall be used for development / debug versus production environment. Find your keys on the account info page in Pulse.

<strong>appName</strong> - a string value used to distinguish your applications. Simple values that are unique across all of your integrated platforms work best here.


## Set the user id (viewer id)
```js
tracker.setSubjectData({userId?: string});

let viewerId = "testuserid@test.com"
tracker.setSubjectData({userId: viewerId});
```

## Report PageView Events for tracking in-app page navigations.
```js
tracker.trackPageViewEvent({pageUrl: string, pageTitle?: string, referrer?: string});

let pageViewEvent = {'pageUrl' : 'https://allpopulated.com',
      'pageTitle' : 'some title',
      'referrer' : 'http://refr.com'};
tracker.trackPageViewEvent(pageViewEvent);
```

## Auto detect button clicks.
Auto detection of button clicks is supported. Add below plugin code to .bablerc or babel.config.js as below.
```js
"plugins": ["add-react-displayname",
      "./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js"
     ]

```

## Auto detect ScreenView Events for tracking screen navigation.
For React Navigation versions 5 and above, to autocapture screenviews, wrap withReactNavigationAutotrack(autocaptureNavigationTrack) around the NavigationContainer:

```js

import {
  withReactNavigationAutotrack,
  autocaptureNavigationTrack
} from '@convivainc/conviva-react-native-appanalytics';


const ConvivaNavigationContainer = 
withReactNavigationAutotrack(autocaptureNavigationTrack)(NavigationContainer);


<ConvivaNavigationContainer>
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen}/> 
    </Tab.Navigator>
</ConvivaNavigationContainer>
```

For React Navigation versions below 5, wrap the AppContainer (the result of a call to React Navigation’s createAppContainer() method) with withReactNavigationAutotrack(autocaptureNavigationTrack)
```js

let AppNavigator = createStackNavigator(
  {
    Home: { screen: HomeScreen },
    Settings: { screen: SettingsScreen }
  },
  {
    initialRouteName: 'HomeScreen'
  }
)

let App = withReactNavigationAutotrack(autocaptureNavigationTrack)(AppNavigator);

```


## Custom event tracking to track your application specific events and state changes
Use trackCustomEvent() API to track all kinds of events. This API provides 2 fields to describe the tracked events.

eventName - Name of the custom event. (Mandatory)

eventData - Any JSON Object.

The following example shows the implementation of the 'onClick' event listener to any element.
```js
tracker.trackCustomEvent(eventName: string, eventData?: any);

let eventName = "custom_event_name";
let eventData = {"tagKey1" : "tagValue1", "tagKey2" : 100, "tagKey3" : true};
tracker.trackCustomEvent(eventName, eventData);
```

## Setting / Clear Custom tags to report your application specific data.
Use setCustomTags() API to set all kinds of tags (key value pairs). This API provides 1 argument to describe the tags.

data - Any JSON Object.

The following example shows the implementation of the 'onClick' event listener to any element.

```js
tracker.setCustomTags(customTagsToSet: any);

let customTagsToSet = {"tagKey1" : "tagValue1", "tagKey2" : 100, "tagKey3" : true};
tracker.setCustomTags(customTagsToSet);
```

Use clearCustomTags() API to remove that are set prior. This API provides 1 argument to describe an array of tag keys to be removed.

keys - Array of strings representing tag keys.

The following example shows the implementation of the 'onClick' event listener to any element.
```js
tracker.clearCustomTags(tagKeys: string[]);

let customTagKeysToClear = ['tagKey2', 'tagKey3'];
tracker.clearCustomTags(customTagKeysToClear);
```

Use clearAllCustomTags() API to remove all the custom tags that are set prior.

The following example shows the implementation of the 'onClick' event listener to any element.
```js
tracker.clearAllCustomTags();
```
