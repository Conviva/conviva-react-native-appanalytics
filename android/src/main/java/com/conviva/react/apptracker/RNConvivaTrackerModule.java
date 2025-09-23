package com.conviva.react.apptracker;

import com.conviva.apptracker.ConvivaAppAnalytics;
import com.conviva.apptracker.configuration.Configuration;
import com.conviva.apptracker.configuration.EmitterConfiguration;
import com.conviva.apptracker.configuration.GdprConfiguration;
import com.conviva.apptracker.configuration.GlobalContextsConfiguration;
import com.conviva.apptracker.configuration.NetworkConfiguration;
import com.conviva.apptracker.configuration.RemoteConfiguration;
import com.conviva.apptracker.configuration.SessionConfiguration;
import com.conviva.apptracker.configuration.SubjectConfiguration;
import com.conviva.apptracker.configuration.TrackerConfiguration;
import com.conviva.apptracker.controller.TrackerController;
import com.conviva.apptracker.event.ButtonClick;
import com.conviva.apptracker.event.ConsentGranted;
import com.conviva.apptracker.event.ConsentWithdrawn;
import com.conviva.apptracker.event.DeepLinkReceived;
import com.conviva.apptracker.event.EcommerceTransaction;
import com.conviva.apptracker.event.MessageNotification;
import com.conviva.apptracker.event.PageView;
import com.conviva.apptracker.event.ScreenView;
import com.conviva.apptracker.event.SelfDescribing;
import com.conviva.apptracker.event.Structured;
import com.conviva.apptracker.event.Timing;
import com.conviva.apptracker.internal.constants.TrackerConstants;
import com.conviva.apptracker.network.CollectorCookieJar;
import com.conviva.apptracker.network.HttpMethod;
import com.conviva.apptracker.payload.SelfDescribingJson;
import com.conviva.apptracker.util.Size;
import com.conviva.react.apptracker.util.ConfigUtil;
import com.conviva.react.apptracker.util.EventUtil;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import org.json.simple.JSONValue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;

public class RNConvivaTrackerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public RNConvivaTrackerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNConvivaTracker";
    }

    @ReactMethod
    public void createTracker(ReadableMap argmap, Promise promise) {
        try {
            String appName = argmap.getString("appName");
            String customerKey = argmap.getString("customerKey");

            // Configurations
            List<Configuration> controllers = new ArrayList<Configuration>();

            // NetworkConfiguration
            NetworkConfiguration networkConfiguration;
            if (argmap.hasKey("networkConfig")) {
                ReadableMap networkConfig = argmap.getMap("networkConfig");
                String endpoint = TrackerConstants.CONVIVA_PRODUCTION_ENDPOINT;
                if (networkConfig.hasKey("endpoint") && !networkConfig.isNull("endpoint")) {
                    endpoint = networkConfig.getString("endpoint");
                }
                if (networkConfig.hasKey("method") && !networkConfig.isNull("method")) {
                    String method = networkConfig.getString("method");
                    networkConfiguration = new NetworkConfiguration(endpoint, ("get".equalsIgnoreCase(method) ? HttpMethod.GET : HttpMethod.POST));
                } else {
                    networkConfiguration = new NetworkConfiguration(networkConfig.getString("endpoint"));
                }
                if (networkConfig.hasKey("customPostPath") && !networkConfig.isNull("customPostPath")) {
                    String customPostPath = networkConfig.getString("customPostPath");
                    networkConfiguration.customPostPath = customPostPath;
                }
                if (networkConfig.hasKey("requestHeaders") && !networkConfig.isNull("requestHeaders")) {
                    ReadableMap requestHeaders = networkConfig.getMap("requestHeaders");
                    if (requestHeaders != null) {
                        OkHttpClient client = new OkHttpClient.Builder().connectTimeout(15, TimeUnit.SECONDS).readTimeout(15, TimeUnit.SECONDS).cookieJar(new CollectorCookieJar(reactContext)).addInterceptor(chain -> {
                            Request.Builder requestBuilder = chain.request().newBuilder();
                            ReadableMapKeySetIterator it = requestHeaders.keySetIterator();
                            while (it.hasNextKey()) {
                                String key = it.nextKey();
                                String value = requestHeaders.getString(key);
                                if (value != null) {
                                    requestBuilder.header(key, value);
                                }
                            }
                            return chain.proceed(requestBuilder.build());
                        }).build();
                        networkConfiguration.okHttpClient(client);
                    }
                }
                controllers.add(networkConfiguration);
            }

            // TrackerConfiguration
            // Need to create the TrackerConfiguration to update the postfix for the tracker version
            ReadableMap trackerConfig = null;
            if (argmap.hasKey("trackerConfig")) {
                trackerConfig = argmap.getMap("trackerConfig");
            }
            TrackerConfiguration trackerConfiguration = ConfigUtil.mkTrackerConfiguration(trackerConfig, appName, this.reactContext);
            controllers.add(trackerConfiguration);

            // SessionConfiguration
            if (argmap.hasKey("sessionConfig")) {
                ReadableMap sessionConfig = argmap.getMap("sessionConfig");
                SessionConfiguration sessionConfiguration = ConfigUtil.mkSessionConfiguration(sessionConfig);
                controllers.add(sessionConfiguration);
            }

            // EmitterConfiguration
            if (argmap.hasKey("emitterConfig")) {
                ReadableMap emitterConfig = argmap.getMap("emitterConfig");
                EmitterConfiguration emitterConfiguration = ConfigUtil.mkEmitterConfiguration(emitterConfig);
                controllers.add(emitterConfiguration);
            }

            // SubjectConfiguration
            if (argmap.hasKey("subjectConfig")) {
                ReadableMap subjectConfig = argmap.getMap("subjectConfig");
                SubjectConfiguration subjectConfiguration = ConfigUtil.mkSubjectConfiguration(subjectConfig);
                controllers.add(subjectConfiguration);
            }

            // GdprConfiguration
            if (argmap.hasKey("gdprConfig")) {
                ReadableMap gdprConfig = argmap.getMap("gdprConfig");
                GdprConfiguration gdprConfiguration = ConfigUtil.mkGdprConfiguration(gdprConfig);
                controllers.add(gdprConfiguration);
            }

            // GCConfiguration
            if (argmap.hasKey("gcConfig")) {
                ReadableArray gcConfig = argmap.getArray("gcConfig");
                GlobalContextsConfiguration gcConfiguration = ConfigUtil.mkGCConfiguration(gcConfig);
                controllers.add(gcConfiguration);
            }

            String remoteConfigUrl = RemoteConfiguration.DEFAULT_ENDPOINT;
            if (argmap.hasKey("remoteConfiguration")) {
                ReadableMap remoteConfig = argmap.getMap("remoteConfiguration");
                if (remoteConfig.hasKey("endpoint")) {
                    remoteConfigUrl = remoteConfig.getString("endpoint");
                }
            }

            // create the tracker
            ConvivaAppAnalytics.createTracker(this.reactContext, customerKey, appName, controllers.toArray(new Configuration[controllers.size()]));

            promise.resolve(true);

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void removeTracker(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                promise.resolve(ConvivaAppAnalytics.removeTracker(trackerController));
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void cleanup(Promise promise) {
        try {
            // commented out deprecated methods
            promise.resolve(true);

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }
    @ReactMethod
    public void removeAllTrackers(Promise promise) {
        try {
            // commented out deprecated methods
            // ConvivaAppAnalytics.removeAllTrackers();
            promise.resolve(true);

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setClientId(ReadableMap argmap, Promise promise) {
        try {
            promise.resolve(ConvivaAppAnalytics.setClientId(this.reactContext, argmap.getString("clientId")));
        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void getClientId(Promise promise) {
        try {
            promise.resolve(ConvivaAppAnalytics.getClientId(this.reactContext));
        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackSelfDescribingEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                SelfDescribingJson sdj = EventUtil.createSelfDescribingJson(argmap);
                SelfDescribing event = new SelfDescribing(sdj);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackStructuredEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                Structured event = EventUtil.createStructuredEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackScreenViewEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                ScreenView event = EventUtil.createScreenViewEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackPageView(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                PageView event = EventUtil.createPageViewEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackTimingEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");

                Timing event = EventUtil.createTimingEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackConsentGrantedEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                ConsentGranted event = EventUtil.createConsentGrantedEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackConsentWithdrawnEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                ConsentWithdrawn event = EventUtil.createConsentWithdrawnEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackEcommerceTransactionEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                EcommerceTransaction event = EventUtil.createEcommerceTransactionEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackDeepLinkReceivedEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                DeepLinkReceived event = EventUtil.createDeepLinkReceivedEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackMessageNotificationEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("eventData");
                ReadableArray contexts = details.getArray("contexts");


                MessageNotification event = EventUtil.createMessageNotificationEvent(argmap);

                List<SelfDescribingJson> evCtxts = EventUtil.createContexts(contexts);
                event.customContexts.addAll(evCtxts);

                trackerController.track(event);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackCustomEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                String eventName = details.getString("eventName");
                ReadableMap argmap = details.getMap("eventData");

                HashMap<String, Object> eventData = argmap.toHashMap();

                trackerController.trackCustomEvent(eventName, JSONValue.toJSONString(eventData));
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setCustomTags(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap argmap = details.getMap("tags");

                HashMap<String, Object> tags = argmap.toHashMap();

                trackerController.setCustomTags(tags);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void clearCustomTags(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableArray argArray = details.getArray("tagKeys");


                List<String> tagKeys = EventUtil.createStrings(argArray);
                trackerController.clearCustomTags(new HashSet<>(tagKeys));
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void clearAllCustomTags(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                trackerController.clearAllCustomTags();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void trackClickEvent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {
                ReadableMap eventMap = details.getMap("eventData");


                ButtonClick event = EventUtil.createButtonClickEvent(eventMap);
                trackerController.track(event);

                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void removeGlobalContexts(ReadableMap details, Promise promise) {
        try {
            // commented out deprecated methods            
            // String namespace = details.getString("tracker");
            // String tag = details.getString("removeTag");

            // TrackerController trackerController = getTracker(namespace);

            // trackerController.getGlobalContexts().remove(tag);
            promise.resolve(true);

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void addGlobalContexts(ReadableMap details, Promise promise) {
        try {
            // commented out deprecated methods   
            // String namespace = details.getString("tracker");
            // ReadableMap gcArg = details.getMap("addGlobalContext");

            // String tag = gcArg.getString("tag");
            // ReadableArray globalContexts = gcArg.getArray("globalContexts");

            // List<SelfDescribingJson> staticContexts = new ArrayList<>();
            // for (int i = 0; i < globalContexts.size(); i++) {
            //     SelfDescribingJson gContext = EventUtil.createSelfDescribingJson(globalContexts.getMap(i));
            //     staticContexts.add(gContext);
            // }
            // GlobalContext gcStatic = new GlobalContext(staticContexts);

            // TrackerController trackerController = getTracker(namespace);

            // trackerController.getGlobalContexts().add(tag, gcStatic);
            promise.resolve(true);

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setUserId(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("userId")) {
                    trackerController.getSubject().setUserId(null);
                } else {
                    trackerController.getSubject().setUserId(details.getString("userId"));
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setNetworkUserId(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("networkUserId")) {
                    trackerController.getSubject().setNetworkUserId(null);
                } else {
                    trackerController.getSubject().setNetworkUserId(details.getString("networkUserId"));
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setDomainUserId(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("domainUserId")) {
                    trackerController.getSubject().setDomainUserId(null);
                } else {
                    trackerController.getSubject().setDomainUserId(details.getString("domainUserId"));
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setIpAddress(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("ipAddress")) {
                    trackerController.getSubject().setIpAddress(null);
                } else {
                    trackerController.getSubject().setIpAddress(details.getString("ipAddress"));
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setUseragent(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("useragent")) {
                    trackerController.getSubject().setUseragent(null);
                } else {
                    trackerController.getSubject().setUseragent(details.getString("useragent"));
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setTimezone(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("timezone")) {
                    trackerController.getSubject().setTimezone(null);
                } else {
                    trackerController.getSubject().setTimezone(details.getString("timezone"));
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setLanguage(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("language")) {
                    trackerController.getSubject().setLanguage(null);
                } else {
                    trackerController.getSubject().setLanguage(details.getString("language"));
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setScreenResolution(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("screenResolution")) {
                    trackerController.getSubject().setScreenResolution(null);
                } else {
                    ReadableArray screenRes = details.getArray("screenResolution");
                    int width = screenRes.getInt(0);
                    int height = screenRes.getInt(1);
                    Size screenR = new Size(width, height);

                    trackerController.getSubject().setScreenResolution(screenR);
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setScreenViewport(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("screenViewport")) {
                    trackerController.getSubject().setScreenViewPort(null);
                } else {
                    ReadableArray screenView = details.getArray("screenViewport");
                    int width = screenView.getInt(0);
                    int height = screenView.getInt(1);
                    Size screenVP = new Size(width, height);

                    trackerController.getSubject().setScreenViewPort(screenVP);
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void setColorDepth(ReadableMap details, Promise promise) {
        try {
            String namespace = details.getString("tracker");
            TrackerController trackerController = getTracker(namespace);
            if (trackerController != null) {

                if (details.isNull("colorDepth")) {
                    trackerController.getSubject().setColorDepth(null);
                } else {
                    trackerController.getSubject().setColorDepth(details.getInt("colorDepth"));
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "TrackerController is null");
            }

        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void getSessionUserId(ReadableMap details, Promise promise) {
        try {
            // commented out deprecated methods
            // String namespace = details.getString("tracker");
            // TrackerController trackerController = getTracker(namespace);

            // String suid = trackerController.getSession().getUserId();
            // promise.resolve(suid);
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void getSessionId(ReadableMap details, Promise promise) {
        try {
            // commented out deprecated methods
            // String namespace = details.getString("tracker");
            // TrackerController trackerController = getTracker(namespace);

            // String sid = trackerController.getSession().getSessionId();
            // promise.resolve(sid);
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void getSessionIndex(ReadableMap details, Promise promise) {
        try {
            // commented out deprecated methods
            // String namespace = details.getString("tracker");
            // TrackerController trackerController = getTracker(namespace);

            // int sidx = trackerController.getSession().getSessionIndex();
            // promise.resolve(sidx);
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void getIsInBackground(ReadableMap details, Promise promise) {
        try {
            // commented out deprecated methods
            // String namespace = details.getString("tracker");
            // TrackerController trackerController = getTracker(namespace);

            // boolean isInBg = trackerController.getSession().isInBackground();
            // promise.resolve(isInBg);
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void getBackgroundIndex(ReadableMap details, Promise promise) {
        try {
            // commented out deprecated methods
            // String namespace = details.getString("tracker");
            // TrackerController trackerController = getTracker(namespace);

            // int bgIdx = trackerController.getSession().getBackgroundIndex();
            // promise.resolve(bgIdx);
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void getForegroundIndex(ReadableMap details, Promise promise) {
        try {
            // commented out deprecated methods
            // String namespace = details.getString("tracker");
            // TrackerController trackerController = getTracker(namespace);

            // int fgIdx = trackerController.getSession().getForegroundIndex();
            // promise.resolve(fgIdx);
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("ERROR", t.getMessage());
        }
    }

    private TrackerController getTracker(String namespace) {
        return namespace == null ? ConvivaAppAnalytics.getDefaultTracker() : ConvivaAppAnalytics.getTracker(namespace);
    }
}
