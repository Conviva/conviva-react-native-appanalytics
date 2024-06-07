
# Changelog

## 0.1.5 (07/JUN/2024)
- Supports trackCustomEvent with JSONObject argument for [iOS Bridge](https://github.com/Conviva/conviva-ios-appanalytics)

## 0.1.4 (05/JAN/2024)
- Supports the Auto Detection of ScreenView navigation if the application uses the [NavigationContainer](https://reactnavigation.org/docs/5.x/hello-react-navigation)(for react native version 5 and above) or [AppNavigator](https://reactnavigation.org/docs/4.x/hello-react-navigation)(for react native version below 5)<br>
 *Note:Please refer to [ScreenView Auto-Detection](https://github.com/Conviva/conviva-react-native-appanalytics?tab=readme-ov-file#auto-detect-screenview-events-for-tracking-screen-navigation) for more details*
  
## 0.1.3 (12/DEC/2023)
* Supports the Auto Detection of "buttonText" style for the User Click of Button, TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback and TouchableNativeFeedback Components<br>
*This feature needs the Android App SDK version of [0.8.0](https://github.com/Conviva/conviva-android-appanalytics)*

## 0.1.2 (01/MAY/2023)
* Supports the inclusion of the latest Android/iOS Native sensor always in the Android/iOS Bridge going forward
* Fixes the issue of App Name being incorrect for iOS Bridge
* Updates related to the default Network and Tracker Config in the iOS Bridge

## 0.1.1 (24/APR/2023)
* Published the Android/iOS folders along with the podspec files

## 0.1.0 (23/APR/2023)
* Production version of Conviva React Native Sensor
* Fixes the issue of optional Network Config argument being mandatory

## 0.0.1 (02/APR/2023)
* Initial version of the Conviva React Native Sensor
