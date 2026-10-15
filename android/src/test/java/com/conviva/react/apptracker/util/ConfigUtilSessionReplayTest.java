package com.conviva.react.apptracker.util;

import com.conviva.apptracker.configuration.SessionReplayConfiguration;

import org.junit.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

/**
 * Unit tests for ConfigUtil.mkSessionReplayConfiguration.
 *
 * Focus: the bridge-layer guard logic added to align Android and iOS platforms:
 *
 *   Guard 1 - Empty ReadableMap:
 *       No recognised keys -> JSONObject is empty -> return null.
 *       Mirrors Android ReplayIntegration.startIfFeasible `configuration == null` check.
 *
 *   Guard 2 - enabled:false:
 *       Explicit disabled flag -> return null.
 *       Mirrors Android ReplayIntegration.startIfFeasible `!configuration.isEnabled()` check
 *       and fills the iOS gap where CATTracker had no such check.
 *
 *   Guard 3 - Partial config (enabled key absent):
 *       Non-empty map without enabled key -> SessionReplayConfiguration created.
 *       Rationale: remote config may activate replay even when JS omits enabled:true.
 *
 * ReadableMapStub is used so tests run without a live Android / React Native runtime.
 */
public class ConfigUtilSessionReplayTest {

    // -----------------------------------------------------------------
    // Guard 1: empty ReadableMap -> null (no recognized keys)
    // -----------------------------------------------------------------

    @Test
    public void emptyMap_returnsNull() throws Exception {
        ReadableMapStub src = new ReadableMapStub(Collections.emptyMap());
        SessionReplayConfiguration result = ConfigUtil.mkSessionReplayConfiguration(src);
        assertNull("Empty ReadableMap must return null - no config to register", result);
    }

    // -----------------------------------------------------------------
    // Guard 2: enabled:false -> null
    // -----------------------------------------------------------------

    @Test
    public void enabledFalseOnly_returnsNull() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("enabled", false);
        ReadableMapStub src = new ReadableMapStub(map);
        SessionReplayConfiguration result = ConfigUtil.mkSessionReplayConfiguration(src);
        assertNull("enabled:false alone must return null", result);
    }

    @Test
    public void enabledFalseWithExtraKeys_returnsNull() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("enabled", false);
        map.put("logging", true);
        Map<String, Object> sampling = new HashMap<>();
        sampling.put("pct", 100.0);
        map.put("sampling", new ReadableMapStub(sampling));
        ReadableMapStub src = new ReadableMapStub(map);
        SessionReplayConfiguration result = ConfigUtil.mkSessionReplayConfiguration(src);
        assertNull("enabled:false with other keys must still return null", result);
    }

    // -----------------------------------------------------------------
    // Guard 3: enabled absent - passed through (remote config use case)
    // -----------------------------------------------------------------

    @Test
    public void partialConfig_noEnabledKey_returnsNonNull() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("logging", true);
        Map<String, Object> sampling = new HashMap<>();
        sampling.put("pct", 50.0);
        map.put("sampling", new ReadableMapStub(sampling));
        ReadableMapStub src = new ReadableMapStub(map);
        SessionReplayConfiguration result = ConfigUtil.mkSessionReplayConfiguration(src);
        assertNotNull("Partial config without enabled key must not be discarded", result);
    }

    // -----------------------------------------------------------------
    // Guard 3: enabled:true - normal activation path
    // -----------------------------------------------------------------

    @Test
    public void enabledTrue_returnsNonNull() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("enabled", true);
        ReadableMapStub src = new ReadableMapStub(map);
        SessionReplayConfiguration result = ConfigUtil.mkSessionReplayConfiguration(src);
        assertNotNull("enabled:true must produce a SessionReplayConfiguration", result);
    }

    @Test
    public void fullConfig_returnsNonNull() throws Exception {
        Map<String, Object> emitter = new HashMap<>();
        emitter.put("dataMode", "wifi");
        emitter.put("uploadInterval", 30.0);
        emitter.put("flushAt", 20.0);
        emitter.put("maxBatchSize", 50.0);
        emitter.put("maxQueueSize", 1000.0);

        Map<String, Object> network = new HashMap<>();
        network.put("endpoint", "https://rcg.conviva.com");

        Map<String, Object> sampling = new HashMap<>();
        sampling.put("pct", 80.0);

        Map<String, Object> recorder = new HashMap<>();
        recorder.put("maskAllInputs", true);
        recorder.put("maskAllImages", true);
        recorder.put("maskAllSystemViews", true);
        recorder.put("throttleDelayMs", 1000.0);
        recorder.put("compressionQuality", 10.0);

        Map<String, Object> map = new HashMap<>();
        map.put("enabled", true);
        map.put("logging", true);
        map.put("sampling", new ReadableMapStub(sampling));
        map.put("networkConfiguration", new ReadableMapStub(network));
        map.put("emitterConfiguration", new ReadableMapStub(emitter));
        map.put("mobRecorderConfiguration", new ReadableMapStub(recorder));

        ReadableMapStub src = new ReadableMapStub(map);
        SessionReplayConfiguration result = ConfigUtil.mkSessionReplayConfiguration(src);
        assertNotNull("Full config must produce a SessionReplayConfiguration", result);
    }

    // -----------------------------------------------------------------
    // emitterConfiguration with all numeric fields
    // -----------------------------------------------------------------

    @Test
    public void emitterConfigDoubles_areDowncastToInt_returnsNonNull() throws Exception {
        Map<String, Object> emitter = new HashMap<>();
        emitter.put("uploadInterval", 30.0);
        emitter.put("policyExpiryTime", 3600.0);
        emitter.put("flushAt", 20.0);
        emitter.put("maxBatchSize", 120.0);
        emitter.put("maxQueueSize", 1000.0);

        Map<String, Object> map = new HashMap<>();
        map.put("emitterConfiguration", new ReadableMapStub(emitter));

        ReadableMapStub src = new ReadableMapStub(map);
        // Guard 3 applies (enabled absent) - must not be discarded
        SessionReplayConfiguration result = ConfigUtil.mkSessionReplayConfiguration(src);
        assertNotNull("emitterConfiguration without enabled must be passed through", result);
    }

    // -----------------------------------------------------------------
    // mobRecorderConfiguration - maskInputOptions array
    // -----------------------------------------------------------------

    @Test
    public void maskInputOptions_stringArray_returnsNonNull() throws Exception {
        ReadableArrayStub options = new ReadableArrayStub(
                Arrays.asList("emailAddress", "password", "telephoneNumber"));

        Map<String, Object> recorder = new HashMap<>();
        recorder.put("maskAllInputs", true);
        recorder.put("maskInputOptions", options);

        Map<String, Object> map = new HashMap<>();
        map.put("enabled", true);
        map.put("mobRecorderConfiguration", new ReadableMapStub(recorder));

        ReadableMapStub src = new ReadableMapStub(map);
        SessionReplayConfiguration result = ConfigUtil.mkSessionReplayConfiguration(src);
        assertNotNull("maskInputOptions array must be accepted and config returned", result);
    }
}
