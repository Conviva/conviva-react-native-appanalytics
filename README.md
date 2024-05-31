# conviva-react-native-appanalytics
## Application Analytics for Conviva React Native Sensor
Use Application Analytics to autocollect events, track application specific events and state changes, and track users anonymously. The React Native Bridges are internally built on top of the [Android](https://github.com/Conviva/conviva-android-appanalytics) and [iOS](https://github.com/Conviva/conviva-ios-appanalytics) Native Sensors.

## Installation

### Install via npm:
```js
npm install @convivainc/conviva-react-native-appanalytics --save
npx pod-install
```

## Android Native Sensor dependencies
Add the following line to app's build.gradle file along with the dependencies:
```
dependencies {
    ...
    implementation 'com.conviva.sdk:conviva-android-tracker:<version>'
}
```
Android Plugin should be used for the auto collection of **Button Click** and **OkHttp/Retrofit/HTTPSUrlConnection/HTTPUrlConnection** **NetworkRequest Tracking** features. The following example shows how to include the plugin:
```
// in the root or project-level build.gradle
dependencies {
  ...
  // For Android Gradle Plugin version 8.0 and above, use
  classpath 'com.conviva.sdk:android-plugin:0.3.x'

  // For Android Gradle Plugin version below 8.0, use
  classpath 'com.conviva.sdk:android-plugin:0.2.x'
  ...
}

// in the app, build.gradle at the end of plugins add the
...
apply plugin: 'com.conviva.sdk.android-plugin'

// in the app, build.gradle.kts at the end of plugins add the
plugins {
    id 'com.conviva.sdk.android-plugin'
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
tracker.trackPageView({pageUrl: string, pageTitle?: string, referrer?: string});

let pageViewEvent = {'pageUrl' : 'https://allpopulated.com',
      'pageTitle' : 'some title',
      'referrer' : 'http://refr.com'};
tracker.trackPageView(pageViewEvent);
```

## Auto detect button clicks.
Even though the React Native components can be natively mapped in Android and iOS, for the Auto detection of button clicks for **Button**, **TouchableHighlight**, **TouchableOpacity**, **TouchableWithoutFeedback** and **TouchableNativeFeedback** Components, needs explicit addition of babel transfomation. Add below plugin code in your application .babel.rc or babel.config.js file:

```js

"plugins": ["./node_modules/@convivainc/conviva-react-native-appanalytics/instrumentation/index.js"]

```

## Auto detect ScreenView Events for tracking screen navigation.
To support Conviva to Auto Detect the Screen Name part of the ScreenView Events, add below plugin code in your application .babel.rc or babel.config.js file:
```js

"plugins": ["add-react-displayname"]

```

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
<strong>_*** Note: Supported only in Android right now ***_<br></strong><br>
Use trackCustomEvent() API to track all kinds of events. This API provides 2 fields to describe the tracked events.

eventName - Name of the custom event. (Mandatory)

eventData - Any JSON Object.

The following example shows the implementation of the application using these API's:
```js
tracker.trackCustomEvent(eventName: string, eventData?: any);

let eventName = "custom_event_name";
let eventData = {"tagKey1" : "tagValue1", "tagKey2" : 100, "tagKey3" : true};
tracker.trackCustomEvent(eventName, eventData);
```

## Setting / Clear Custom tags to report your application specific data.
Use setCustomTags() API to set all kinds of tags (key value pairs). This API provides 1 argument to describe the tags.

data - Any JSON Object.

The following example shows the implementation of the application using this API:

```js
tracker.setCustomTags(customTagsToSet: any);

let customTagsToSet = {"tagKey1" : "tagValue1", "tagKey2" : 100, "tagKey3" : true};
tracker.setCustomTags(customTagsToSet);
```

Use clearCustomTags() API to remove that are set prior. This API provides 1 argument to describe an array of tag keys to be removed.

keys - Array of strings representing tag keys.

The following example shows the implementation of the application using this API:
```js
tracker.clearCustomTags(tagKeys: string[]);

let customTagKeysToClear = ['tagKey2', 'tagKey3'];
tracker.clearCustomTags(customTagKeysToClear);
```

Use clearAllCustomTags() API to remove all the custom tags that are set prior.

The following example shows the implementation of the application using this API:
```js
tracker.clearAllCustomTags();
```

<details>
    <summary><b>Auto-collected Events</b></summary>
    
##### Conviva provides a rich set of application performance metrics with the help of autocollected app events, such as _screen_view_ , _button_click_, and _network_request_. 

Event | Occurrence |
------|------------ |
network_request | after receiving the network request response ; auto collected from the Native Sensors, Need android-plugin inclusion for Android|
screen_view | when the screen is interacted on either first launch or relaunch ; auto collected from the Native Sensors + React Native Screens; Need add-react-displayname plugin and wrapping of Navigation Components |
application_error | when an error occurrs in the application ; auto collected from the Native Sensors|
button_click | on the button click callback ; auto collected from the Native Sensors + React Native **Button**, **TouchableHighlight**, **TouchableOpacity**, **TouchableWithoutFeedback** and **TouchableNativeFeedback** Components; Need Conviva index.js from the node_modules folder|
application_background | when the application is taken to the background ; auto collected from the Native Sensors|
application_foreground | when the application is taken to the foreground ; auto collected from the Native Sensors|
application_install | when the application is launched for the first time after it's installed. (It's not the exact installed time.) |
