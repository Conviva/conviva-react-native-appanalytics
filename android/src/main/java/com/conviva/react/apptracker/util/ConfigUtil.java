package com.conviva.react.apptracker.util;

import com.conviva.apptracker.configuration.EmitterConfiguration;
import com.conviva.apptracker.configuration.GdprConfiguration;
import com.conviva.apptracker.configuration.GlobalContextsConfiguration;
import com.conviva.apptracker.configuration.SessionConfiguration;
import com.conviva.apptracker.configuration.SessionReplayConfiguration;
import com.conviva.apptracker.configuration.SubjectConfiguration;
import com.conviva.apptracker.configuration.TrackerConfiguration;
import com.conviva.apptracker.internal.tracker.ClidSyncConfiguration;
import com.conviva.apptracker.emitter.BufferOption;
import com.conviva.apptracker.globalcontexts.GlobalContext;
import com.conviva.apptracker.payload.SelfDescribingJson;
import com.conviva.apptracker.tracker.DevicePlatform;
import com.conviva.apptracker.tracker.LogLevel;
import com.conviva.apptracker.util.Basis;
import com.conviva.apptracker.util.Size;
import com.conviva.apptracker.util.TimeMeasure;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class ConfigUtil {

    public static DevicePlatform mkDevicePlatform(String devPlatform) {

        DevicePlatform devicePlatform = DevicePlatform.Mobile;
        if (devPlatform.equals("web")) {
            devicePlatform = DevicePlatform.Web;
        } else if (devPlatform.equals("srv")) {
            devicePlatform = DevicePlatform.ServerSideApp;
        } else if (devPlatform.equals("pc")) {
            devicePlatform = DevicePlatform.Desktop;
        } else if (devPlatform.equals("app")) {
            devicePlatform = DevicePlatform.General;
        } else if (devPlatform.equals("tv")) {
            devicePlatform = DevicePlatform.ConnectedTV;
        } else if (devPlatform.equals("cnsl")) {
            devicePlatform = DevicePlatform.GameConsole;
        } else if (devPlatform.equals("iot")) {
            devicePlatform = DevicePlatform.InternetOfThings;
        }

        return devicePlatform;
    }

    public static LogLevel mkLogLevel(String logLvl) {

        LogLevel logLevel = LogLevel.OFF;
        if (logLvl.equals("error")) {
            logLevel = LogLevel.ERROR;
        } else if (logLvl.equals("debug")) {
            logLevel = LogLevel.DEBUG;
        } else if (logLvl.equals("verbose")) {
            logLevel = LogLevel.VERBOSE;
        }

        return logLevel;
    }

    public static BufferOption mkBufferOption(String bufferOpt) {

        BufferOption bufferOption = BufferOption.Single;
        if (bufferOpt.equals("default")) {
            bufferOption = BufferOption.DefaultGroup;
        } else if (bufferOpt.equals("heavy")) {
            bufferOption = BufferOption.HeavyGroup;
        }

        return bufferOption;
    }

    public static Basis mkBasis(String basis) {

        Basis basisForProcessing = Basis.CONSENT;
        if (basis.equals("contract")) {
            basisForProcessing = Basis.CONTRACT;
        }
        if (basis.equals("legal_obligation")) {
            basisForProcessing = Basis.LEGAL_OBLIGATION;
        }
        if (basis.equals("legitimate_interests")) {
            basisForProcessing = Basis.LEGITIMATE_INTERESTS;
        }
        if (basis.equals("public_task")) {
            basisForProcessing = Basis.PUBLIC_TASK;
        }
        if (basis.equals("vital_interests")) {
            basisForProcessing = Basis.VITAL_INTERESTS;
        }

        return basisForProcessing;
    }

    public static TrackerConfiguration mkTrackerConfiguration(ReadableMap trackerConfig, String appName,
                                                              ReactApplicationContext context) {
        TrackerConfiguration trackerConfiguration = new TrackerConfiguration(appName)
                .trackerVersionSuffix(TrackerVersion.RN_CONVIVA_TRACKER_VERSION);

        if (trackerConfig != null) {
            if (trackerConfig.hasKey("devicePlatform")) {
                DevicePlatform devicePlatform = mkDevicePlatform(trackerConfig.getString("devicePlatform"));
                trackerConfiguration.devicePlatform(devicePlatform);
            }
            if (trackerConfig.hasKey("logLevel")) {
                LogLevel logLevel = mkLogLevel(trackerConfig.getString("logLevel"));
                trackerConfiguration.logLevel(logLevel);
            }
            if (trackerConfig.hasKey("base64Encoding")) {
                trackerConfiguration.base64encoding(trackerConfig.getBoolean("base64Encoding"));
            }
            if (trackerConfig.hasKey("applicationContext")) {
                trackerConfiguration.applicationContext(trackerConfig.getBoolean("applicationContext"));
            }
            if (trackerConfig.hasKey("platformContext")) {
                trackerConfiguration.platformContext(trackerConfig.getBoolean("platformContext"));
            }
            if (trackerConfig.hasKey("geoLocationContext")) {
                trackerConfiguration.geoLocationContext(trackerConfig.getBoolean("geoLocationContext"));
            }
            if (trackerConfig.hasKey("sessionContext")) {
                trackerConfiguration.sessionContext(trackerConfig.getBoolean("sessionContext"));
            }
            if (trackerConfig.hasKey("screenContext")) {
                trackerConfiguration.screenContext(trackerConfig.getBoolean("screenContext"));
            }
            if (trackerConfig.hasKey("screenViewAutotracking")) {
                trackerConfiguration.screenViewAutotracking(trackerConfig.getBoolean("screenViewAutotracking"));
            }
            if (trackerConfig.hasKey("lifecycleAutotracking")) {
                trackerConfiguration.lifecycleAutotracking(trackerConfig.getBoolean("lifecycleAutotracking"));
            }
            if (trackerConfig.hasKey("installAutotracking")) {
                trackerConfiguration.installAutotracking(trackerConfig.getBoolean("installAutotracking"));
            }
            if (trackerConfig.hasKey("exceptionAutotracking")) {
                trackerConfiguration.exceptionAutotracking(trackerConfig.getBoolean("exceptionAutotracking"));
            }
            if (trackerConfig.hasKey("diagnosticAutotracking")) {
                trackerConfiguration.diagnosticAutotracking(trackerConfig.getBoolean("diagnosticAutotracking"));
            }
            if (trackerConfig.hasKey("deepLinkContext")) {
                trackerConfiguration.deepLinkContext(trackerConfig.getBoolean("deepLinkContext"));
            }
            if (trackerConfig.hasKey("userAnonymisation")) {
                trackerConfiguration.userAnonymisation(trackerConfig.getBoolean("userAnonymisation"));
            }
            if (trackerConfig.hasKey("bundleInfoAutotracking")) {
                trackerConfiguration.bundleInfoAutotracking(trackerConfig.getBoolean("bundleInfoAutotracking"));
            }
            if (trackerConfig.hasKey("enablePeriodicHeartbeat")) {
                trackerConfiguration.enablePeriodicHeartbeat(trackerConfig.getBoolean("enablePeriodicHeartbeat"));
            }
            if (trackerConfig.hasKey("periodicHeartbeatIntervalInSec")) {
                trackerConfiguration.periodicHeartbeatIntervalInSec(trackerConfig.getInt("periodicHeartbeatIntervalInSec"));
            }
            if (trackerConfig.hasKey("periodicHeartbeatDelayInSec")) {
                trackerConfiguration.periodicHeartbeatDelayInSec(trackerConfig.getInt("periodicHeartbeatDelayInSec"));
            }
            if (trackerConfig.hasKey("userClickAutotracking")) {
                trackerConfiguration.userClickAutotracking(trackerConfig.getBoolean("userClickAutotracking"));
            }
            if (trackerConfig.hasKey("deepLinkAutotracking")) {
                trackerConfiguration.deepLinkAutotracking(trackerConfig.getBoolean("deepLinkAutotracking"));
            }
        }

        return trackerConfiguration;
    }

    public static SessionConfiguration mkSessionConfiguration(ReadableMap sessionConfig) {
        long foregroundTimeout = (long) sessionConfig.getDouble("foregroundTimeout");

        long backgroundTimeout = (long) sessionConfig.getDouble("backgroundTimeout");

        SessionConfiguration sessionConfiguration = new SessionConfiguration(
                new TimeMeasure(foregroundTimeout, TimeUnit.SECONDS),
                new TimeMeasure(backgroundTimeout, TimeUnit.SECONDS));

        return sessionConfiguration;
    }

    public static EmitterConfiguration mkEmitterConfiguration(ReadableMap emitterConfig) {
        EmitterConfiguration emitterConfiguration = new EmitterConfiguration();

        if (emitterConfig.hasKey("bufferOption")) {
            BufferOption bufferOption = mkBufferOption(emitterConfig.getString("bufferOption"));
            emitterConfiguration.bufferOption(bufferOption);
        }
        if (emitterConfig.hasKey("emitRange")) {
            int emitRange = (int) emitterConfig.getDouble("emitRange");
            emitterConfiguration.emitRange(emitRange);
        }
        if (emitterConfig.hasKey("threadPoolSize")) {
            int threadPoolSize = (int) emitterConfig.getDouble("threadPoolSize");
            emitterConfiguration.threadPoolSize(threadPoolSize);
        }
        if (emitterConfig.hasKey("byteLimitPost")) {
            int byteLimitPost = (int) emitterConfig.getDouble("byteLimitPost");
            emitterConfiguration.byteLimitPost(byteLimitPost);
        }
        if (emitterConfig.hasKey("byteLimitGet")) {
            int byteLimitGet = (int) emitterConfig.getDouble("byteLimitGet");
            emitterConfiguration.byteLimitGet(byteLimitGet);
        }
        if (emitterConfig.hasKey("serverAnonymisation")) {
            emitterConfiguration.serverAnonymisation(emitterConfig.getBoolean("serverAnonymisation"));
        }
        if (emitterConfig.hasKey("disableEventCaching")) {
            emitterConfiguration.disableEventCaching(emitterConfig.getBoolean("disableEventCaching"));
        }
        return emitterConfiguration;
    }

    public static SubjectConfiguration mkSubjectConfiguration(ReadableMap subjectConfig) {
        SubjectConfiguration subjectConfiguration = new SubjectConfiguration();

        if (subjectConfig.hasKey("userId")) {
            if (subjectConfig.isNull("userId")) {
                subjectConfiguration.userId(null);
            } else {
                subjectConfiguration.userId(subjectConfig.getString("userId"));
            }
        }
        if (subjectConfig.hasKey("networkUserId")) {
            if (subjectConfig.isNull("networkUserId")) {
                subjectConfiguration.networkUserId(null);
            } else {
                subjectConfiguration.networkUserId(subjectConfig.getString("networkUserId"));
            }
        }
        if (subjectConfig.hasKey("domainUserId")) {
            if (subjectConfig.isNull("domainUserId")) {
                subjectConfiguration.domainUserId(null);
            } else {
                subjectConfiguration.domainUserId(subjectConfig.getString("domainUserId"));
            }
        }
        if (subjectConfig.hasKey("useragent")) {
            if (subjectConfig.isNull("useragent")) {
                subjectConfiguration.useragent(null);
            } else {
                subjectConfiguration.useragent(subjectConfig.getString("useragent"));
            }
        }
        if (subjectConfig.hasKey("ipAddress")) {
            if (subjectConfig.isNull("ipAddress")) {
                subjectConfiguration.ipAddress(null);
            } else {
                subjectConfiguration.ipAddress(subjectConfig.getString("ipAddress"));
            }
        }
        if (subjectConfig.hasKey("timezone")) {
            if (subjectConfig.isNull("timezone")) {
                subjectConfiguration.timezone(null);
            } else {
                subjectConfiguration.timezone(subjectConfig.getString("timezone"));
            }
        }
        if (subjectConfig.hasKey("language")) {
            if (subjectConfig.isNull("language")) {
                subjectConfiguration.language(null);
            } else {
                subjectConfiguration.language(subjectConfig.getString("language"));
            }
        }
        if (subjectConfig.hasKey("screenResolution")) {
            if (subjectConfig.isNull("screenResolution")) {
                subjectConfiguration.screenResolution(null);
            } else {
                ReadableArray screenRes = subjectConfig.getArray("screenResolution");
                int screenWidth = (int) screenRes.getDouble(0);
                int screenHeight = (int) screenRes.getDouble(1);

                Size screenResolution = new Size(screenWidth, screenHeight);
                subjectConfiguration.screenResolution(screenResolution);
            }
        }
        if (subjectConfig.hasKey("screenViewport")) {
            if (subjectConfig.isNull("screenViewport")) {
                subjectConfiguration.screenViewPort(null);
            } else {
                ReadableArray screenVP = subjectConfig.getArray("screenViewport");
                int screenVPWidth = (int) screenVP.getDouble(0);
                int screenVPHeight = (int) screenVP.getDouble(1);

                Size screenViewport = new Size(screenVPWidth, screenVPHeight);
                subjectConfiguration.screenViewPort(screenViewport);
            }
        }
        if (subjectConfig.hasKey("colorDepth")) {
            if (subjectConfig.isNull("colorDepth")) {
                subjectConfiguration.colorDepth(null);
            } else {
                int colorDepth = (int) subjectConfig.getDouble("colorDepth");
                subjectConfiguration.colorDepth(colorDepth);
            }
        }

        return subjectConfiguration;
    }

    public static GdprConfiguration mkGdprConfiguration(ReadableMap gdprConfig) {
        Basis basis = mkBasis(gdprConfig.getString("basisForProcessing"));
        String docId = gdprConfig.getString("documentId");
        String docVer = gdprConfig.getString("documentVersion");
        String docDesc = gdprConfig.getString("documentDescription");

        GdprConfiguration gdprConfiguration = new GdprConfiguration(basis,
                docId,
                docVer,
                docDesc);

        return gdprConfiguration;
    }

    public static ClidSyncConfiguration mkClidSyncConfiguration(ReadableMap clidSyncConfig) {
        ClidSyncConfiguration config = new ClidSyncConfiguration();
        if (clidSyncConfig.hasKey("webViewCookie") && !clidSyncConfig.isNull("webViewCookie")) {
            ReadableMap wvCke = clidSyncConfig.getMap("webViewCookie");
            if (wvCke != null && wvCke.hasKey("domains") && !wvCke.isNull("domains")) {
                ReadableArray domainsArray = wvCke.getArray("domains");
                List<String> domains = new ArrayList<>();
                for (int i = 0; i < domainsArray.size(); i++) {
                    domains.add(domainsArray.getString(i));
                }
                config.domains(domains);
            }
        }
        return config;
    }

    public static GlobalContextsConfiguration mkGCConfiguration(ReadableArray gcConfig) {

        HashMap contextGens = new HashMap<>();
        for (int i = 0; i < gcConfig.size(); i++) {
            ReadableMap gcMap = gcConfig.getMap(i);

            String itag = gcMap.getString("tag");
            ReadableArray globalContexts = gcMap.getArray("globalContexts");

            List<SelfDescribingJson> staticContexts = new ArrayList<>();
            for (int x = 0; x < globalContexts.size(); x++) {
                SelfDescribingJson gContext = EventUtil.createSelfDescribingJson(globalContexts.getMap(x));
                staticContexts.add(gContext);
            }

            GlobalContext gcStatic = new GlobalContext(staticContexts);

            if (!contextGens.containsKey(itag)) {
                contextGens.put(itag, gcStatic);
            }
        }

        GlobalContextsConfiguration gcConfiguration = new GlobalContextsConfiguration(contextGens);

        return gcConfiguration;
    }

    /**
     * Builds a SessionReplayConfiguration from the JS sessionReplayConfig map.
     * Each known key is read explicitly, mirroring the pattern used by all other mk* factories.
     * Sub-config blocks are delegated to private helpers to keep cyclomatic complexity low.
     */
    public static SessionReplayConfiguration mkSessionReplayConfiguration(ReadableMap src) throws Exception {
        JSONObject json = new JSONObject();

        if (src.hasKey("enabled")) json.put("enabled", src.getBoolean("enabled"));
        if (src.hasKey("logging")) json.put("logging", src.getBoolean("logging"));
        if (src.hasKey("sampling")) json.put("sampling", buildReplaySamplingJson(src.getMap("sampling")));
        if (src.hasKey("networkConfiguration")) json.put("networkConfiguration", buildReplayNetworkJson(src.getMap("networkConfiguration")));
        if (src.hasKey("emitterConfiguration")) json.put("emitterConfiguration", buildReplayEmitterJson(src.getMap("emitterConfiguration")));
        if (src.hasKey("mobRecorderConfiguration")) json.put("mobRecorderConfiguration", buildReplayRecorderJson(src.getMap("mobRecorderConfiguration")));

        // Skip if no keys were recognised (empty config) or if enabled is explicitly false.
        if (json.length() == 0) return null;
        if (json.has("enabled") && !json.optBoolean("enabled")) return null;
        return new SessionReplayConfiguration(json);
    }

    private static JSONObject buildReplaySamplingJson(ReadableMap sampling) throws Exception {
        JSONObject samplingJson = new JSONObject();
        if (sampling != null && sampling.hasKey("pct")) samplingJson.put("pct", (int) sampling.getDouble("pct"));
        return samplingJson;
    }

    private static JSONObject buildReplayNetworkJson(ReadableMap networkConfig) throws Exception {
        JSONObject networkJson = new JSONObject();
        if (networkConfig != null && networkConfig.hasKey("endpoint")) networkJson.put("endpoint", networkConfig.getString("endpoint"));
        return networkJson;
    }

    private static JSONObject buildReplayEmitterJson(ReadableMap cfg) throws Exception {
        JSONObject j = new JSONObject();
        if (cfg == null) return j;
        copyStrKey(j, cfg, "dataMode");
        copyIntKey(j, cfg, "uploadInterval");
        copyIntKey(j, cfg, "policyExpiryTime");
        copyIntKey(j, cfg, "flushAt");
        copyIntKey(j, cfg, "maxBatchSize");
        copyIntKey(j, cfg, "maxQueueSize");
        return j;
    }

    private static JSONObject buildReplayRecorderJson(ReadableMap cfg) throws Exception {
        JSONObject j = new JSONObject();
        if (cfg == null) return j;
        copyBoolKey(j, cfg, "maskAllInputs");
        copyBoolKey(j, cfg, "maskAllImages");
        copyBoolKey(j, cfg, "maskAllSystemViews");
        copyBoolKey(j, cfg, "maskSandboxedSystemViews");
        copyIntKey(j, cfg, "throttleDelayMs");
        copyIntKey(j, cfg, "compressionQuality");
        if (cfg.hasKey("maskInputOptions")) j.put("maskInputOptions", buildMaskInputOptionsJson(cfg.getArray("maskInputOptions")));
        return j;
    }

    private static JSONArray buildMaskInputOptionsJson(ReadableArray options) {
        JSONArray optionsJson = new JSONArray();
        if (options != null) {
            for (int i = 0; i < options.size(); i++) optionsJson.put(options.getString(i));
        }
        return optionsJson;
    }

    private static void copyBoolKey(JSONObject dest, ReadableMap src, String key) throws Exception {
        if (src.hasKey(key)) dest.put(key, src.getBoolean(key));
    }

    private static void copyIntKey(JSONObject dest, ReadableMap src, String key) throws Exception {
        if (src.hasKey(key)) dest.put(key, (int) src.getDouble(key));
    }

    private static void copyStrKey(JSONObject dest, ReadableMap src, String key) throws Exception {
        if (src.hasKey(key)) dest.put(key, src.getString(key));
    }
}
