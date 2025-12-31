
# Changelog

## 0.2.7 (31/Dec/2025)
- Supports network request url query params tracking.
- Enhanced the remote configuration feature to support instant updates.
- Using latest android(v1.2.6) and ios(v1.8.0) native packages.

## 0.2.6 (16/Dec/2025)
- Improves App Load Time metric by collecting more data. 
- Using latest android(v1.2.6) and ios(v1.7.0) native packages.

## 0.2.5 (25/Nov/2025)
- Improved crash reporting and ANRs to deliver deeper insights and faster fixes for a more stable app experience. Applicable for:
- Android 11 (API 30) and above
- iOS 14 and above

## 0.2.4 (16/Oct/2025)
- Using latest android(v1.2.3) and ios(v1.5.0) native packages.

## 0.2.3 (23/Sep/2025)
- Resolved an issue where certain network requests on Apple mobile platforms were not being captured by the DPI module.

## 0.2.2 (27/Mar/2025)
- Exposing getClientId and setClientId methods for ts.

## 0.2.1 (21/Mar/2025)
- Using latest native android(1.2.1) and ios(1.0.3) libs

## 0.2.0 (06/SEP/2024)
- Introduces API for setting the conviva identifier
- Internal enhancements for the Android Bridge
*This feature needs the Android App SDK version of [0.9.5](https://github.com/Conviva/conviva-android-appanalytics)*
*This feature needs the iOS App SDK version of [0.2.30](https://github.com/Conviva/conviva-ios-appanalytics)*

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
