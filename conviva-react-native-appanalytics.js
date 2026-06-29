import { NativeModules, TurboModuleRegistry, AppState } from 'react-native';
import * as React from 'react';
import React__default from 'react';
import hoistNonReactStatic from 'hoist-non-react-statics';
import * as _ from 'lodash';

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
/**
 * Returns a function that accepts a side-effect function as its argument and subscribes
 * that function to aPromise's fullfillment,
 * and errHandle to aPromise's rejection.
 *
 * @param aPromise - A void Promise
 * @param errHandle - A function to handle the promise being rejected
 * @returns - A function subscribed to the Promise's fullfillment
 */
function safeWait(aPromise, errHandle) {
    return ((func) => {
        return (...args) => {
            return aPromise.then(() => func(...args)).catch((err) => errHandle(err));
        };
    });
}
/**
 * Returns a function that accepts a callback function as its argument and subscribes
 * that function to aPromise's fullfillment,
 * and errHandle to aPromise's rejection.
 *
 * @param aPromise - A void Promise
 * @param errHandle - A function to handle the promise being rejected
 * @returns - A function subscribed to the Promise's fullfillment
 */
function safeWaitCallback(callPromise, errHandle) {
    return ((func) => {
        return (...args) => {
            return callPromise.then(() => func(...args)).catch((err) => errHandle(err));
        };
    });
}
/**
 * Handles an error.
 *
 * @param err - The error to be handled.
 * @param alwaysLog - When true, the error is logged regardless of the __DEV__ flag.
 */
function errorHandler(err, alwaysLog = false) {
    if (__DEV__ || alwaysLog) {
        console.warn('ConvivaTracker:' + err.message);
    }
    return undefined;
}
/**
 * Helper to check whether its argument is of object type
 *
 * @param x - The argument to check.
 * @returns - A boolean
 */
function isObject$1(x) {
    return Object.prototype.toString.call(x) === '[object Object]';
}

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
const isAvailable = NativeModules.RNConvivaTracker != null;
if (!isAvailable) {
    errorHandler(new Error('Unable to access the native iOS/Android Conviva tracker, a tracker implementation with very limited functionality is used.'));
}
const RNConvivaTracker = NativeModules.RNConvivaTracker;

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Payload size limits aligned with the Conviva JS web tracker
 * (JS_DPI_ERROR_REPORTING_AND_CONFIG §4). Cross-platform parity ensures
 * consistent backend schema validation and payload cap enforcement.
 */
/** Max error message length. Matches the Conviva JS tracker limit. */
const MAX_MESSAGE_LENGTH = 2048;
/**
 * Max stack trace length. Matches the Conviva JS tracker limit.
 * Minified RN bundles can produce longer stacks, but parity simplifies backend
 * schema validation.
 */
const MAX_STACK_TRACE_LENGTH = 8192;
const MAX_COMPONENT_STACK_LENGTH = 4096;
/**
 * Default rate limiter: 20 events per 1-second window, matching the Conviva JS
 * horizontal tracker defaults (JS_DPI_ERROR_REPORTING_AND_CONFIG §2.2).
 */
const DEFAULT_MAX_EVENTS_PER_WINDOW = 20;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 1000;
/**
 * Circuit-breaker cooldown. After maxEvents is exceeded within the window,
 * the circuit OPENS and stays open for this duration. Matches the Conviva JS
 * horizontal tracker `disconnectDuration` parameter.
 */
const DEFAULT_DISCONNECT_DURATION_MS = 2000;
/**
 * Schema URI for the Conviva application-error self-describing event.
 * Used for fatal JS errors via TrackerController.track(SelfDescribing(...)).
 * Mirrors the native ExceptionHandler pipeline (sp/ae/1-0-2).
 */
const APPLICATION_ERROR_SCHEMA = 'sp/ae/1-0-2';
/**
 * Event name for non-fatal RN errors (custom event, own metric surface).
 * Fatal RN errors use APPLICATION_ERROR_SCHEMA via track() instead.
 * Web / Horizontal JS errors remain `conviva_application_error` — unchanged.
 */
const NON_FATAL_ERROR_EVENT_NAME = 'conviva_non_fatal_error';
/**
 * Installed-state sentinel placed on `globalThis`. The slot's VALUE is a
 * `TrackerInstallState` record (`{ cleanups: Array<() => void> }`) rather
 * than a bare boolean — colocating the plugin cleanup handles with the
 * flag is required so a JS hot-reload / Fast Refresh cycle that replaces
 * the `ConvivaErrorTracker` singleton can still find and run the prior
 * cleanups (the new instance starts with `pluginCleanups: []`). Without
 * this, every reload chains a fresh Conviva handler on top of the old
 * one, causing duplicate reporting and unbounded handler-chain growth.
 *
 * `_applyHookState` is the single authority that reads/writes the slot;
 * `teardown()` clears it. Any truthy value is treated as "installed" so
 * an older boolean shape (from a prior tracker version still resident
 * after upgrade) is recognised but its cleanups are dropped — the new
 * install will simply replace the previously-registered handlers.
 */
const INSTALL_FLAG = '__conviva_error_tracker_installed__';
/**
 * Attribute keys that are unconditionally dropped at every consumer
 * attribute merge point inside the error-tracking pipeline:
 *  - `errorTracker._dispatch` (globalAttributes + extraAttributes merge),
 *  - `errorTracker.addAttribute` (per-key admission),
 *  - `NativeBridgeAdapter.buildWirePayload` (wire flatten),
 *  - `trackError` non-fatal-fallback custom-event payload.
 *
 * `Object.assign(target, source)` invokes `[[Set]]` on the target, so an
 * own `"__proto__"` property on a JSON-parsed source (e.g.
 * `JSON.parse('{"__proto__":{"polluted":true}}')`) would otherwise hit
 * the `__proto__` setter and pollute `Object.prototype` for the entire
 * realm. `constructor` and `prototype` are dropped for defence-in-depth
 * even on `Object.create(null)` targets so reserved prototype-chain
 * names cannot end up in the wire payload.
 */
const BLOCKED_ATTRIBUTE_KEYS = new Set([
    '__proto__',
    'constructor',
    'prototype',
]);

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
const logMessages = {
    // configuration errors
    customerKey: 'customerKey parameter is required to be set',
    appName: 'appName parameter is required to be set',
    namespace: 'namespace parameter is required to be set fail',
    endpoint: 'endpoint parameter is required to be set',
    network: 'networkConfig is invalid',
    tracker: 'trackerConfig is invalid',
    session: 'sessionConfig is invalid',
    emitter: 'emitterConfig is invalid',
    subject: 'subjectConfig is invalid',
    gdpr: 'gdprConfig is invalid',
    gc: 'gcConfig is invalid',
    remote: 'remoteConfig is invalid',
    clidSync: 'clidSyncConfig is invalid',
    // event errors
    context: 'invalid contexts parameter',
    selfDesc: 'selfDescribing event requires schema and data parameters to be set',
    evType: 'event argument can only be an object',
    screenViewReq: 'screenView event requires name as string parameter to be set',
    structuredReq: 'structured event requires category and action parameters to be set',
    pageviewReq: 'pageView event requires pageUrl parameter to be set',
    timingReq: 'timing event requires category, variable and timing parameters to be set',
    consentGReq: 'consentGranted event requires expiry, documentId and version parameters to be set',
    consentWReq: 'consentWithdrawn event requires all, documentId and version parameters to be set',
    ecomReq: 'ecommerceTransaction event requires orderId, totalValue to be set and items to be an array of valid ecommerceItems',
    deepLinkReq: 'deepLinkReceived event requires the url parameter to be set',
    messageNotificationReq: 'messageNotification event requires title, body, and trigger parameters to be set',
    trackCustomEvent: 'trackCustomEvent event requires name and data',
    revenueEventNullEvent: 'event is null. Event not sent.',
    revenueEventInvalidTotalOrderAmount: 'Must be a finite number. Event not sent.',
    revenueEventInvalidTransactionId: 'Must be a non-empty string. Event not sent.',
    revenueEventInvalidCurrency: 'Must be a non-empty string. Event not sent.',
    trackClickEvent: 'click event requires atleast one attribute',
    trackError: 'trackError event requires message as string parameter to be set',
    // custom tags contexts
    setCustomTags: 'setCustomTags requires tags',
    clearCustomTags: 'clearCustomTags requires tag keys',
    clearAllCustomTags: 'clearAllCustomTags requires earlier set tags',
    // global contexts errors
    gcTagType: 'tag argument is required to be a string',
    gcType: 'global context argument is invalid',
    // api error prefix
    createTracker: 'createTracker:',
    removeTracker: 'removeTracker: trackerNamespace can only be a string',
    getClientId: 'getClientId: failed fetching client id',
    setClientId: 'setClientId: clientId is invalid',
    // methods
    trackSelfDesc: 'trackSelfDescribingEvent:',
    trackScreenView: 'trackScreenViewEvent:',
    trackStructured: 'trackStructuredEvent:',
    trackPageView: 'trackPageView:',
    trackTiming: 'trackTimingEvent:',
    trackConsentGranted: 'trackConsentGranted:',
    trackConsentWithdrawn: 'trackConsentWithdrawn:',
    trackEcommerceTransaction: 'trackEcommerceTransaction:',
    trackDeepLinkReceived: 'trackDeepLinkReceivedEvent:',
    trackMessageNotification: 'trackMessageNotificationEvent:',
    trackRevenueEvent: 'trackRevenueEvent:',
    removeGlobalContexts: 'removeGlobalContexts:',
    addGlobalContexts: 'addGlobalContexts:',
    // setters
    setUserId: 'setUserId: userId can only be a string or null',
    setNetworkUserId: 'setNetworkUserId: networkUserId can only be a string(UUID) or null',
    setDomainUserId: 'setDomainUserId: domainUserId can only be a string(UUID) or null',
    setIpAddress: 'setIpAddress: ipAddress can only be a string or null',
    setUseragent: 'setUseragent: useragent can only be a string or null',
    setTimezone: 'setTimezone: timezone can only be a string or null',
    setLanguage: 'setLanguage: language can only be a string or null',
    setScreenResolution: 'setScreenResolution: screenResolution can only be of ScreenSize type or null',
    setScreenViewport: 'setScreenViewport: screenViewport can only be of ScreenSize type or null',
    setColorDepth: 'setColorDepth: colorDepth can only be a number(integer) or null',
    setSubjectData: 'setSubjectData:',
    createTrackerNotSet: 'createTracker not invoked prior:',
    // error tracking
    trackErrorEvent: 'trackError:'
};

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Returns a rejected Promise when `argmap` is not an object, or null when it
 * is. Centralises the repeated isObject guard that opens every validate*
 * function — kept as a shared helper so validate* functions stay one-line.
 */
function rejectIfNotObject(argmap) {
    return !isObject$1(argmap)
        ? Promise.reject(new Error(logMessages.evType))
        : null;
}
/**
 * Validates a manual error event.
 *
 * The only required field is `message`. All others are optional: the tracker
 * fills in sensible defaults (isFatal=false, isHandled=true) when omitted.
 */
function validateErrorEvent(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    if (typeof argmap.message !== 'string' || argmap.message.length === 0) {
        return Promise.reject(new Error(logMessages.trackError));
    }
    return Promise.resolve(true);
}

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
/**
 * Validates whether an object is valid self-describing
 *
 * @param sd {Object} - the object to validate
 * @returns - boolean
 */
function isValidSD(sd) {
    return isObject$1(sd)
        && typeof sd.schema === 'string'
        && isObject$1(sd.data);
}
/**
 * Validates whether an object is a valid array of contexts
 *
 * @param contexts {Object} - the object to validate
 * @returns - boolean promise
 */
function validateContexts(contexts) {
    const isValid = Object.prototype.toString.call(contexts) === '[object Array]'
        && contexts
            .map((c) => isValidSD(c))
            .reduce((acc, curr) => acc !== false && curr, true);
    if (!isValid) {
        return Promise.reject(new Error(logMessages.context));
    }
    return Promise.resolve(true);
}
/**
 * Validates whether an object is valid self describing
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateSelfDesc(argmap) {
    if (!isValidSD(argmap)) {
        return Promise.reject(new Error(logMessages.selfDesc));
    }
    return Promise.resolve(true);
}
/**
 * Validates a screen view event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateScreenView(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr !== null) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.name !== 'string') {
        return Promise.reject(new Error(logMessages.screenViewReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates a structured event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateStructured(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.category !== 'string'
        || typeof argmap.action !== 'string') {
        return Promise.reject(new Error(logMessages.structuredReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates a page-view event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validatePageView(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.pageUrl !== 'string') {
        return Promise.reject(new Error(logMessages.pageviewReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates a timing event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateTiming(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.category !== 'string'
        || typeof argmap.variable !== 'string'
        || typeof argmap.timing !== 'number') {
        return Promise.reject(new Error(logMessages.timingReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates a consent-granted event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateConsentGranted(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.expiry !== 'string'
        || typeof argmap.documentId !== 'string'
        || typeof argmap.version !== 'string') {
        return Promise.reject(new Error(logMessages.consentGReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates a consent-withdrawn event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateConsentWithdrawn(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.all !== 'boolean'
        || typeof argmap.documentId !== 'string'
        || typeof argmap.version !== 'string') {
        return Promise.reject(new Error(logMessages.consentWReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates a deep link received event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateDeepLinkReceived(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.url !== 'string') {
        return Promise.reject(new Error(logMessages.deepLinkReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates a message notification event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateMessageNotification(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.title !== 'string'
        || typeof argmap.body !== 'string'
        || typeof argmap.trigger !== 'string'
        || !['push', 'location', 'calendar', 'timeInterval', 'other'].includes(argmap.trigger)) {
        return Promise.reject(new Error(logMessages.messageNotificationReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates whether an object is valid ecommerce-item
 *
 * @param item {Object} - the object to validate
 * @returns - boolean
 */
function isValidEcomItem(item) {
    if (isObject$1(item)
        && typeof item.sku === 'string'
        && typeof item.price === 'number'
        && typeof item.quantity === 'number') {
        return true;
    }
    return false;
}
/**
 * Validates an array of ecommerce-items
 *
 * @param items {Object} - the object to validate
 * @returns - boolean promise
 */
function validItemsArg(items) {
    return Object.prototype.toString.call(items) === '[object Array]'
        && items
            .map((i) => isValidEcomItem(i))
            .reduce((acc, curr) => acc !== false && curr, true);
}
/**
 * Validates an ecommerce-transaction event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateEcommerceTransaction(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    // validate required props
    if (typeof argmap.orderId !== 'string'
        || typeof argmap.totalValue !== 'number'
        || !validItemsArg(argmap.items)) {
        return Promise.reject(new Error(logMessages.ecomReq));
    }
    return Promise.resolve(true);
}
/**
 * Validates a revenue event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateRevenueEvent(argmap) {
    if (!isObject$1(argmap)) {
        return Promise.reject(new Error(logMessages.revenueEventNullEvent));
    }
    if (typeof argmap.totalOrderAmount !== 'number' || !Number.isFinite(argmap.totalOrderAmount)) {
        return Promise.reject(new Error(`invalid totalOrderAmount "${argmap.totalOrderAmount}". ${logMessages.revenueEventInvalidTotalOrderAmount}`));
    }
    if (typeof argmap.transactionId !== 'string' || argmap.transactionId.trim() === '') {
        return Promise.reject(new Error(`invalid transactionId "${argmap.transactionId}". ${logMessages.revenueEventInvalidTransactionId}`));
    }
    if (typeof argmap.currency !== 'string' || argmap.currency.trim() === '') {
        return Promise.reject(new Error(`invalid currency "${argmap.currency}". ${logMessages.revenueEventInvalidCurrency}`));
    }
    return Promise.resolve(true);
}
function validateCustomEvent(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    return Promise.resolve(true);
}
function validateCustomTags(argmap) {
    const typeErr = rejectIfNotObject(argmap);
    if (typeErr) {
        return typeErr;
    }
    return Promise.resolve(true);
}
function validateClearCustomTags(tagKeys) {
    // validate type
    if (Object.prototype.toString.call(tagKeys) !== '[object Array]') {
        return Promise.reject(new Error(logMessages.evType));
    }
    return Promise.resolve(true);
}

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
/**
 * Configuration properties
 */
const networkProps = [
    'endpoint',
    'method',
    'customPostPath',
    'requestHeaders',
];
const trackerProps = [
    'devicePlatform',
    'base64Encoding',
    'logLevel',
    'applicationContext',
    'platformContext',
    'geoLocationContext',
    'sessionContext',
    'deepLinkContext',
    'screenContext',
    'screenViewAutotracking',
    'lifecycleAutotracking',
    'installAutotracking',
    'exceptionAutotracking',
    'diagnosticAutotracking',
    'userAnonymisation'
    // TODO: add all the features included by Conviva
];
const sessionProps = [
    'foregroundTimeout',
    'backgroundTimeout'
];
const emitterProps = [
    'bufferOption',
    'emitRange',
    'threadPoolSize',
    'byteLimitPost',
    'byteLimitGet',
    'serverAnonymisation',
];
const subjectProps = [
    'userId',
    'networkUserId',
    'domainUserId',
    'useragent',
    'ipAddress',
    'timezone',
    'language',
    'screenResolution',
    'screenViewport',
    'colorDepth'
];
const gdprProps = [
    'basisForProcessing',
    'documentId',
    'documentVersion',
    'documentDescription'
];
const gcProps = [
    'tag',
    'globalContexts'
];
const remoteProps = [
    'endpoint',
    'method'
];
const clidSyncProps = [
    'webViewCookie',
    'webViewBridge'
];
/**
 * Validates whether an object is of valid configuration given its default keys
 *
 * @param config {Object} - the object to validate
 * @param defaultKeys {Array} - the default keys to validate against
 * @returns - boolean
 */
function isValidConfig(config, defaultKeys) {
    return Object.keys(config).every(key => defaultKeys.includes(key));
}
/**
 * Validates the networkConfig
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidNetworkConf(config) {
    if (!isObject$1(config)
        || !isValidConfig(config, networkProps)
        || typeof config.endpoint !== 'string'
        || !config.endpoint) {
        return false;
    }
    return true;
}
/**
 * Validates the trackerConfig
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidTrackerConf(config) {
    if (!isObject$1(config) || !isValidConfig(config, trackerProps)) {
        return false;
    }
    return true;
}
/**
 * Validates the sessionConfig
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidSessionConf(config) {
    if (!isObject$1(config)
        || !isValidConfig(config, sessionProps)
        || !sessionProps.every(key => Object.keys(config).includes(key))) {
        return false;
    }
    return true;
}
/**
 * Validates the emitterConfig
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidEmitterConf(config) {
    if (!isObject$1(config) || !isValidConfig(config, emitterProps)) {
        return false;
    }
    return true;
}
/**
 * Validates whether an object is of ScreenSize type
 *
 * @param arr {Object} - the object to validate
 * @returns - boolean
 */
function isScreenSize(arr) {
    return Array.isArray(arr)
        && arr.length === 2
        && arr.every((n) => typeof n === 'number');
}
/**
 * Validates the subjectConfig
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidSubjectConf(config) {
    if (!isObject$1(config) || !isValidConfig(config, subjectProps)) {
        return false;
    }
    // validating ScreenSize here to simplify array handling in bridge
    if (Object.prototype.hasOwnProperty.call(config, 'screenResolution')
        && config.screenResolution !== null
        && !isScreenSize(config.screenResolution)) {
        return false;
    }
    if (Object.prototype.hasOwnProperty.call(config, 'screenViewport')
        && config.screenViewport !== null
        && !isScreenSize(config.screenViewport)) {
        return false;
    }
    return true;
}
/**
 * Validates the gdprConfig
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidGdprConf(config) {
    if (!isObject$1(config)
        || !isValidConfig(config, gdprProps)
        || !gdprProps.every(key => Object.keys(config).includes(key))
        || !['consent', 'contract', 'legal_obligation', 'legitimate_interests', 'public_task', 'vital_interests'].includes(config.basisForProcessing)) {
        return false;
    }
    return true;
}
/**
 * Validates whether an object is of GlobalContext type
 *
 * @param gc {Object} - the object to validate
 * @returns - boolean
 */
function isValidGC(gc) {
    return isObject$1(gc)
        && isValidConfig(gc, gcProps)
        && typeof gc.tag === 'string'
        && Array.isArray(gc.globalContexts)
        && gc.globalContexts.every(c => isValidSD(c));
}
/**
 * Validates the GCConfig (global contexts)
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidGCConf(config) {
    if (!Array.isArray(config)) {
        return false;
    }
    if (!config.every(gc => isValidGC(gc))) {
        return false;
    }
    return true;
}
/**
 * Validates the ClidSyncConfig
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidClidSyncConf(config) {
    if (!isObject$1(config) || !isValidConfig(config, clidSyncProps)) {
        return false;
    }
    if (Object.prototype.hasOwnProperty.call(config, 'webViewCookie') && config.webViewCookie != null) {
        if (!isObject$1(config.webViewCookie)) {
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(config.webViewCookie, 'domains')
            && config.webViewCookie.domains != null
            && (!Array.isArray(config.webViewCookie.domains)
                || !config.webViewCookie.domains.every(d => typeof d === 'string'))) {
            return false;
        }
    }
    return true;
}
/**
 * Validates the RemoteConfig (remote config)
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidRemoteConf(config) {
    if (!isObject$1(config)
        || !isValidConfig(config, remoteProps)
        || typeof config.endpoint !== 'string'
        || !config.endpoint) {
        return false;
    }
    return true;
}
/**
 * Validates the initTrackerConfiguration
 *
 * @param init {Object} - the config to validate
 * @returns - boolean promise
 */
function initValidate(init) {
    if (typeof init.customerKey !== 'string' || !init.customerKey || init.customerKey === "") {
        return Promise.reject(new Error(logMessages.customerKey));
    }
    if (typeof init.appName !== 'string' || !init.appName || init.appName === "") {
        return Promise.reject(new Error(logMessages.appName));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'networkConfig')
        && !isValidNetworkConf(init.networkConfig)) {
        return Promise.reject(new Error(logMessages.network));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'trackerConfig')
        && !isValidTrackerConf(init.trackerConfig)) {
        return Promise.reject(new Error(logMessages.tracker));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'sessionConfig')
        && (!isValidSessionConf(init.sessionConfig))) {
        return Promise.reject(new Error(logMessages.session));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'emitterConfig')
        && !isValidEmitterConf(init.emitterConfig)) {
        return Promise.reject(new Error(logMessages.emitter));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'subjectConfig')
        && !isValidSubjectConf(init.subjectConfig)) {
        return Promise.reject(new Error(logMessages.subject));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'gdprConfig')
        && !isValidGdprConf(init.gdprConfig)) {
        return Promise.reject(new Error(logMessages.gdpr));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'gcConfig')
        && !isValidGCConf(init.gcConfig)) {
        return Promise.reject(new Error(logMessages.gc));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'remoteConfig')
        && !isValidRemoteConf(init.remoteConfig)) {
        return Promise.reject(new Error(logMessages.remote));
    }
    if (Object.prototype.hasOwnProperty.call(init, 'clidSyncConfig')
        && !isValidClidSyncConf(init.clidSyncConfig)) {
        return Promise.reject(new Error(logMessages.clidSync));
    }
    return Promise.resolve(true);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Copies non-blocked, defined entries from `src` into `target`. */
function copyInto(target, src) {
    for (const k of Object.keys(src)) {
        if (BLOCKED_ATTRIBUTE_KEYS.has(k)) {
            continue;
        }
        const v = src[k];
        if (v !== undefined) {
            target[k] = v;
        }
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Owns the tracker's global attribute bag plus the propagated userId, and
 * builds the per-dispatch merged attribute set.
 *
 * Prototype-pollution defence: the backing object uses a null prototype so a
 * consumer-supplied `__proto__` key cannot reach `Object.prototype`'s setter,
 * and BLOCKED_ATTRIBUTE_KEYS are dropped on every read/write path as
 * defence-in-depth so they never leak into the wire payload.
 */
class AttributeStore {
    globalAttributes = Object.create(null);
    userId = null;
    add(key, value) {
        if (key.length === 0 || BLOCKED_ATTRIBUTE_KEYS.has(key)) {
            return;
        }
        this.globalAttributes[key] = value;
    }
    remove(key) {
        if (BLOCKED_ATTRIBUTE_KEYS.has(key)) {
            return;
        }
        delete this.globalAttributes[key];
    }
    setUserId(id) {
        this.userId = typeof id === 'string' ? id : null;
    }
    /**
     * Builds the merged attribute bag from globalAttributes, `extraAttributes`,
     * and userId. Returns undefined when the resulting bag is empty.
     */
    build(extraAttributes) {
        const attrs = Object.create(null);
        copyInto(attrs, this.globalAttributes);
        if (extraAttributes !== undefined) {
            copyInto(attrs, extraAttributes);
        }
        if (this.userId !== null) {
            attrs.userId = this.userId;
        }
        return Object.keys(attrs).length > 0 ? attrs : undefined;
    }
    /** Resets to a null-prototype object and clears the userId. */
    reset() {
        this.globalAttributes = Object.create(null);
        this.userId = null;
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Fail-silent execution helpers.
 *
 * The error-tracking subsystem must NEVER throw out of its own reporting paths
 * (design constraint D7). Historically every such path wrapped its body in an
 * inline `try { ... } catch { /* fail-silent *\/ }`. Routing those through these
 * two helpers keeps the exact same fail-silent behaviour while removing the
 * per-call `catch` branch from each caller — concentrating it in one place.
 */
/**
 * Runs `fn`, swallowing any thrown error. Drop-in replacement for an inline
 * `try { fn(); } catch { /* fail-silent *\/ }` void block.
 */
function runSafely(fn) {
    try {
        fn();
    }
    catch {
        /* fail-silent */
    }
}
/**
 * Runs `fn` and returns its result; returns `fallback` if `fn` throws.
 * Drop-in replacement for a `try { return fn(); } catch { return fallback; }`
 * block whose catch yields a fixed value.
 */
function safeCall(fn, fallback) {
    try {
        return fn();
    }
    catch {
        return fallback;
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Returns `v` when it is a positive finite number, otherwise `fallback`. */
function positiveOr(v, fallback) {
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback;
}
/** Reports whether the bundle is running in a dev build. Never throws. */
function isDevMode() {
    return safeCall(() => typeof __DEV__ !== 'undefined' && !!__DEV__, false);
}
/**
 * Attempts to locate a build-time-injected bundle hash. Consumers can set
 * `global.__CONVIVA_BUNDLE_ID__` via a Metro transformer or Babel plugin.
 * Runtime override via ErrorTrackingConfiguration.bundleId wins over this.
 */
function readBundleIdFromGlobal$1() {
    const g = globalThis;
    const v = g.__CONVIVA_BUNDLE_ID__;
    return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Boolean flags whose default is `true` — set false only if the consumer
 *  explicitly passed `false`. */
const DEFAULT_TRUE_FLAGS = [
    'enabled',
    'captureGlobalErrors',
    'captureUnhandledRejections',
    'enableRateLimiting',
];
/** Boolean flags whose default is `false` — set true only if the consumer
 *  explicitly passed `true`. */
const DEFAULT_FALSE_FLAGS = [
    'suppressInDev',
    'promiseRejectionsAsHandled',
];
/** Numeric rate-limit fields and their fallbacks; applied via positiveOr. */
const NUMERIC_DEFAULTS = [
    ['maxEventsPerWindow', DEFAULT_MAX_EVENTS_PER_WINDOW],
    ['rateLimitWindowMs', DEFAULT_RATE_LIMIT_WINDOW_MS],
    ['disconnectDurationMs', DEFAULT_DISCONNECT_DURATION_MS],
];
/** Applies the four DEFAULT_TRUE_FLAGS — anything not strictly false wins. */
function applyTrueFlags(c, out) {
    for (const key of DEFAULT_TRUE_FLAGS) {
        out[key] = c[key] !== false;
    }
}
/** Applies the two DEFAULT_FALSE_FLAGS — only strictly true enables them. */
function applyFalseFlags(c, out) {
    for (const key of DEFAULT_FALSE_FLAGS) {
        out[key] = c[key] === true;
    }
}
/** Applies the three NUMERIC_DEFAULTS via positiveOr. */
function applyNumericDefaults(c, out) {
    for (const [key, fallback] of NUMERIC_DEFAULTS) {
        out[key] = positiveOr(c[key], fallback);
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Applies the per-payload defaults that `_initFromTracker` lifts out of the
 * consumer-facing ErrorTrackingConfiguration. Flag tables avoid repeating one
 * ternary per field — see ./flagTables.
 */
function applyConfigDefaults(cfg) {
    const c = cfg ?? {};
    const out = {};
    applyTrueFlags(c, out);
    applyFalseFlags(c, out);
    applyNumericDefaults(c, out);
    out.beforeCapture = c.beforeCapture;
    out.bundleId = c.bundleId ?? readBundleIdFromGlobal$1();
    out.bridgeAdapter = c.bridgeAdapter;
    return out;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * True when `err` is a non-null object or function — the kinds of values that
 * can be tracked via WeakSet. Acts as a type guard so callers don't need an
 * `err as object` cast on the WeakSet add/has side.
 */
function isObjectKey(err) {
    return err !== null && (typeof err === 'object' || typeof err === 'function');
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Stable key for a non-object thrown value (primitives, undefined, null). */
function primitiveKey(err) {
    if (err === undefined) {
        return '__undef__';
    }
    if (err === null) {
        return '__null__';
    }
    return `${typeof err}:${String(err)}`;
}
/**
 * Bounded TTL store for thrown primitives. Primitives cannot be WeakSet keys,
 * so we key by their string serialisation and expire entries after `ttlMs`,
 * dropping the oldest insertion when the store is full.
 */
class PrimitiveDedupStore {
    ttlMs;
    max;
    seen = new Map();
    constructor(ttlMs, max) {
        this.ttlMs = ttlMs;
        this.max = max;
    }
    isDuplicate(err) {
        this.evictExpired();
        const prev = this.seen.get(primitiveKey(err));
        return prev !== undefined && Date.now() - prev < this.ttlMs;
    }
    markSeen(err) {
        if (this.seen.size >= this.max) {
            const oldest = this.seen.keys().next().value;
            if (oldest !== undefined) {
                this.seen.delete(oldest);
            }
        }
        this.seen.set(primitiveKey(err), Date.now());
    }
    reset() {
        this.seen.clear();
    }
    evictExpired() {
        const now = Date.now();
        for (const [k, v] of this.seen) {
            if (now - v >= this.ttlMs) {
                this.seen.delete(k);
            }
        }
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Prevents the same Error object from being reported twice when captured by
 * multiple hooks (e.g. ErrorUtils.setGlobalHandler runs, then a parent
 * ErrorBoundary's componentDidCatch runs for the same throw).
 *
 * Strategy:
 *  - Error instances tracked via WeakSet so GC is automatic (no leak).
 *  - Non-Error thrown primitives delegated to PrimitiveDedupStore, since
 *    primitives cannot be WeakSet keys.
 */
class DedupGuard {
    seenObjects = new WeakSet();
    primitives;
    constructor(primitiveTtlMs = 500, maxPrimitives = 256) {
        this.primitives = new PrimitiveDedupStore(primitiveTtlMs, maxPrimitives);
    }
    /** true if this thrown value was already seen within the TTL window. */
    isDuplicate(err) {
        return isObjectKey(err)
            ? this.seenObjects.has(err)
            : this.primitives.isDuplicate(err);
    }
    /** Call after dispatching so subsequent captures of the same throw are suppressed. */
    markSeen(err) {
        if (isObjectKey(err)) {
            this.seenObjects.add(err);
            return;
        }
        this.primitives.markSeen(err);
    }
    /** Test hook — clears all seen state. Not part of the public API. */
    _reset() {
        this.primitives.reset();
        // WeakSet has no .clear() method; reassigning is the only way to reset it.
        this.seenObjects = new WeakSet();
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Reads the current install state from the global slot. Returns the modern
 * `{ cleanups }` shape, the sentinel `'legacy'` when a truthy-but-unknown value
 * is present, or `null` when nothing is installed.
 */
function readInstallState() {
    const g = globalThis;
    const v = g[INSTALL_FLAG];
    if (v === undefined || v === null || v === false) {
        return null;
    }
    if (typeof v === 'object' && Array.isArray(v.cleanups)) {
        return v;
    }
    // Truthy but not the modern shape (e.g. legacy `true`). Treat as installed
    // for "previous install detected" purposes, but no recoverable cleanups.
    return 'legacy';
}
/** Writes (or, when passed null, clears) the install state on the global slot. */
function writeInstallState(state) {
    const g = globalThis;
    if (state === null) {
        delete g[INSTALL_FLAG];
    }
    else {
        g[INSTALL_FLAG] = state;
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Detects the active JavaScript engine. Hermes exposes the marker global
 * `HermesInternal`; JSC / browser do not.
 */
function detectJsEngine() {
    const g = globalThis;
    if (g.HermesInternal != null) {
        return 'hermes';
    }
    // If a browser-style `window` is present but no Hermes, treat as JSC/browser.
    if (typeof g.navigator !== 'undefined') {
        return 'jsc';
    }
    return 'unknown';
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Stack-frame patterns probed in order; the first match wins. Driven as a
 * table so `matchFrame` loops over them instead of cascading near-identical
 * `if (m === null)` blocks.
 *   Pattern 1 (V8/Hermes):           "at ... (FILE:LINE:COL)"
 *   Pattern 2 (V8 no-parens / anon): "at FILE:LINE:COL"
 *   Pattern 3 (JSC/Safari):          "funcName@FILE:LINE:COL"
 */
const FRAME_PATTERNS = [
    /\(([^()]+):(\d+):(\d+)\)\s*$/,
    /at\s+([^\s]+):(\d+):(\d+)\s*$/,
    /@([^@\s]+):(\d+):(\d+)\s*$/,
];
/** Returns the first regex match against `line`, or null if none match. */
function matchFrame(line) {
    for (const re of FRAME_PATTERNS) {
        const m = line.match(re);
        if (m !== null) {
            return m;
        }
    }
    return null;
}
/**
 * True when `line` is the top "ErrorType: message" summary line that should be
 * skipped before searching for stack frames. Only relevant at index 0 — interior
 * lines are always treated as candidate frames.
 */
function isSummaryLine(i, line) {
    return i === 0 && !/^\s*at\s/.test(line) && !/@/.test(line);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Reads the first frame of an Error.stack string and extracts file/line/col.
 * Handles the common V8/Hermes/JSC shapes:
 *   "at funcName (file:///path/to/index.bundle:123:45)"
 *   "funcName@file:///path/to/index.bundle:123:45"
 *   "at file:///path/to/index.bundle:123:45"
 */
function parseFirstFrame(stack) {
    if (stack == null) {
        return {};
    }
    const lines = stack.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line == null) {
            continue;
        }
        if (isSummaryLine(i, line)) {
            continue;
        }
        const m = matchFrame(line.trim());
        if (m !== null) {
            return {
                fileName: m[1],
                lineNumber: parseInt(m[2], 10),
                lineColumn: parseInt(m[3], 10),
            };
        }
    }
    return {};
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Truncates `s` to at most `max` characters. */
function truncate(s, max) {
    if (s.length <= max) {
        return s;
    }
    return s.slice(0, max);
}
/** Renders a non-Error primitive into a string suitable for `message`. */
function primitiveMessage(error) {
    if (error === undefined) {
        return 'undefined';
    }
    if (error === null) {
        return 'null';
    }
    return String(error);
}
/**
 * Extracts message, errorType, and stackTrace from a thrown value. Handles both
 * Error instances and arbitrary primitives.
 */
function normalizeError(error, errorSource) {
    if (error instanceof Error) {
        return {
            message: error.message || String(error),
            errorType: error.name || 'Error',
            stackTrace: typeof error.stack === 'string' ? error.stack : '',
        };
    }
    return {
        message: primitiveMessage(error),
        errorType: errorSource === 'unhandledRejection' ? 'UnhandledRejection' : 'Error',
        stackTrace: '',
    };
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Default severity per error source. `unhandledRejection` is resolved
 * separately because it depends on the `promiseRejectionsAsHandled` flag, and
 * `isFatal` short-circuits to 'fatal' before this lookup. Unmapped sources fall
 * back to 'info'.
 */
const SEVERITY_BY_SOURCE = {
    errorBoundary: 'error',
    globalHandler: 'error',
    manual: 'info',
};
/** Default severity mapping — can be overridden per-call by the tracker. */
function computeSeverity(source, isFatal, promiseRejectionsAsHandled) {
    if (isFatal) {
        return 'fatal';
    }
    if (source === 'unhandledRejection') {
        return promiseRejectionsAsHandled ? 'warning' : 'error';
    }
    return SEVERITY_BY_SOURCE[source] ?? 'info';
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Assembles the final JsErrorPayload from pre-computed parts. */
function buildPayload(parts) {
    const { args, norm, severity, attributes, bundleId } = parts;
    const { fileName, lineNumber, lineColumn } = parseFirstFrame(norm.stackTrace);
    return {
        timestamp: Date.now(),
        message: truncate(norm.message, MAX_MESSAGE_LENGTH),
        errorType: truncate(norm.errorType, MAX_MESSAGE_LENGTH),
        stackTrace: truncate(norm.stackTrace, MAX_STACK_TRACE_LENGTH),
        isFatal: !!args.isFatal,
        isHandled: !!args.isHandled,
        errorSource: args.errorSource,
        severity,
        componentStack: args.componentStack !== undefined
            ? truncate(args.componentStack, MAX_COMPONENT_STACK_LENGTH)
            : undefined,
        lineNumber,
        lineColumn,
        fileName,
        bundleId,
        jsEngine: detectJsEngine(),
        attributes,
    };
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Dispatches `err` to the tracker on the global-handler path, after marking
 *  it seen in the dedup guard so chained handlers (e.g. ErrorBoundary
 *  re-throw) can't double-report the same throw. */
function dispatchGlobalError(tracker, err, isFatal) {
    const dedup = tracker._getDedupGuard();
    if (dedup.isDuplicate(err)) {
        return;
    }
    dedup.markSeen(err);
    tracker._dispatch({
        error: err,
        errorSource: 'globalHandler',
        isFatal: isFatal ?? false,
        isHandled: false,
    });
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
const NOOP_CLEANUP = () => { };
/**
 * Reads `globalThis.ErrorUtils` defensively. Returns null when the global is
 * absent or lacks the required `setGlobalHandler` accessor — the only entry
 * point this plugin needs. Caller treats null as "ErrorUtils unavailable".
 */
function resolveErrorUtils() {
    const g = globalThis;
    const errorUtils = g.ErrorUtils;
    return errorUtils != null && typeof errorUtils.setGlobalHandler === 'function'
        ? errorUtils
        : null;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Installs a chained handler on RN's ErrorUtils so uncaught JS errors are
 * forwarded to the error tracker. Always calls the previously-registered
 * handler afterwards so coexistence with Sentry / Bugsnag / Crashlytics /
 * RN's red-box keeps working.
 *
 * Returns a cleanup function that restores the previous handler, or a no-op
 * if ErrorUtils was unavailable.
 */
function installGlobalErrorHandler(tracker) {
    return safeCall(() => {
        const errorUtils = resolveErrorUtils();
        if (errorUtils === null) {
            return NOOP_CLEANUP;
        }
        const previous = typeof errorUtils.getGlobalHandler === 'function'
            ? errorUtils.getGlobalHandler()
            : undefined;
        const handler = (err, isFatal) => {
            runSafely(() => dispatchGlobalError(tracker, err, isFatal));
            // Chain to the previous handler so the red-box, Sentry, Crashlytics,
            // Bugsnag, etc. keep working unchanged.
            if (typeof previous === 'function') {
                runSafely(() => previous(err, isFatal));
            }
        };
        errorUtils.setGlobalHandler(handler);
        return () => runSafely(() => errorUtils.setGlobalHandler(previous ?? NOOP_CLEANUP));
    }, NOOP_CLEANUP);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Shared no-op teardown / callback placeholder — avoids duplicate closures. */
const NOOP$1 = () => { };
/** Shared fail-silent teardown returned when an install attempt fails. */
const FAIL_SILENT = () => { };
/**
 * Runs `fn` and returns its teardown. Returns FAIL_SILENT when `fn` throws,
 * eliminating the repetitive `try { return fn(); } catch { return () => {} }`
 * pattern inside each install* function.
 */
function safeInstall(fn) {
    return safeCall(fn, FAIL_SILENT);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
function stringify(v) {
    if (v === undefined) {
        return 'undefined';
    }
    if (v === null) {
        return 'null';
    }
    return safeCall(() => (typeof v === 'string' ? v : JSON.stringify(v)), String(v));
}
/**
 * Wraps a non-Error rejection reason into an Error whose name reads
 * "UnhandledRejection", so downstream consumers can distinguish wrapped
 * primitives from genuine throw-errors. Error instances pass through unchanged.
 */
function toRejectionError(reason) {
    if (reason instanceof Error) {
        return reason;
    }
    const err = new Error(stringify(reason));
    err.name = 'UnhandledRejection';
    return err;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Normalises a rejection reason into an Error and forwards it to the tracker as
 * an `unhandledRejection`. Deduplicated via the tracker's dedup guard.
 */
function dispatchRejection(tracker, reason) {
    const dedup = tracker._getDedupGuard();
    if (dedup.isDuplicate(reason)) {
        return;
    }
    dedup.markSeen(reason);
    const asHandled = tracker._getConfig().promiseRejectionsAsHandled === true;
    tracker._dispatch({
        error: toRejectionError(reason),
        errorSource: 'unhandledRejection',
        isFatal: false,
        isHandled: asHandled,
    });
}
/** Builds the `{ allRejections, onUnhandled, onHandled }` object shared by the
 *  Hermes and JSC-polyfill `enablePromiseRejectionTracker` / `enable` APIs. */
function makeRejectionTrackerOptions(tracker) {
    return {
        allRejections: true,
        onUnhandled: (_id, error) => runSafely(() => dispatchRejection(tracker, error)),
        onHandled: NOOP$1,
    };
}
/** No-op rejection-tracker options used during teardown to replace any
 *  previously-installed Conviva callbacks with closures that drop rejections. */
const NOOP_REJECTION_TRACKER_OPTIONS = {
    allRejections: true,
    onUnhandled: NOOP$1,
    onHandled: NOOP$1,
};

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
function installHermes(tracker, g) {
    const hermesG = g;
    return safeInstall(() => {
        hermesG.HermesInternal.enablePromiseRejectionTracker(makeRejectionTrackerOptions(tracker));
        // HermesInternal has no un-enable API, so teardown re-installs the tracker
        // with no-op callbacks — replacing the previous closure so subsequent
        // rejections are silently dropped, matching removeEventListener semantics
        // on browser engines.
        return () => runSafely(() => {
            hermesG.HermesInternal.enablePromiseRejectionTracker(NOOP_REJECTION_TRACKER_OPTIONS);
        });
    });
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Reads `evt.reason` defensively — `evt` may be the reason itself in non-spec engines. */
function unwrapRejectionEvent(evt) {
    return evt !== null && typeof evt === 'object'
        ? evt.reason
        : evt;
}
function installBrowser(tracker, g) {
    const browserG = g;
    const listener = (evt) => runSafely(() => {
        dispatchRejection(tracker, unwrapRejectionEvent(evt));
    });
    return safeInstall(() => {
        browserG.addEventListener('unhandledrejection', listener);
        return () => runSafely(() => browserG.removeEventListener('unhandledrejection', listener));
    });
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Resolves the `rejection-tracking` polyfill if it is available (it ships with
 * RN's `InitializeCore` on non-Hermes engines). Returns null on require failure
 * or when the resolved module does not expose the expected `enable` accessor.
 */
function resolvePromisePolyfill() {
    let mod;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        mod = require('promise/setimmediate/rejection-tracking');
    }
    catch {
        return null;
    }
    if (mod == null || typeof mod.enable !== 'function') {
        return null;
    }
    return mod;
}
function installJscPolyfill(tracker) {
    const polyfill = resolvePromisePolyfill();
    if (polyfill === null) {
        return FAIL_SILENT;
    }
    return safeInstall(() => {
        polyfill.enable(makeRejectionTrackerOptions(tracker));
        return () => runSafely(() => {
            if (typeof polyfill.disable === 'function') {
                polyfill.disable();
            }
        });
    });
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------
/**
 * Unhandled promise-rejection capture.
 *
 * Each JS engine exposes a different API, so we branch (engine implementations
 * live in `promiseEngines.ts`):
 *   Hermes (default RN JS engine 0.70+) — HermesInternal.enablePromiseRejectionTracker
 *     with an options object: { allRejections: true, onUnhandled: cb, onHandled: cb }.
 *     Hermes ships its own Promise implementation, so the `promise` polyfill
 *     is NOT installed and `global.addEventListener('unhandledrejection')`
 *     does NOT fire on RN/Hermes.
 *     KNOWN LIMITATION (G3 fix): this API is last-one-wins — if another SDK
 *     (Sentry, Bugsnag) calls enablePromiseRejectionTracker AFTER us, our
 *     `onUnhandled` is replaced. Consumers who need coexistence with such
 *     SDKs should disable Conviva's handler via captureUnhandledRejections:
 *     false and call tracker.trackError manually from their SDK's hook.
 *     Teardown re-enables the tracker with no-op callbacks to release the
 *     previous closure, since Hermes exposes no un-install API.
 *
 *   JSC / RN pre-0.70 — the `promise/setimmediate/rejection-tracking` polyfill
 *     shipped with React Native's metro preset. Import via CommonJS require
 *     so this file still compiles when the polyfill is absent.
 *
 *   Browser / RN Web — `window.addEventListener('unhandledrejection', ...)`.
 */
function installPromiseRejectionHandler(tracker) {
    return safeInstall(() => {
        const g = globalThis;
        const hi = g.HermesInternal;
        if (hi != null && typeof hi.enablePromiseRejectionTracker === 'function') {
            return installHermes(tracker, g);
        }
        if (typeof g.addEventListener === 'function' && typeof g.removeEventListener === 'function') {
            return installBrowser(tracker, g);
        }
        return installJscPolyfill(tracker);
    });
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Per-session sliding-window + circuit-breaker rate limiter.
 *
 * Two-phase design (mirrors the Conviva JS horizontal tracker):
 *  - CLOSED : up to `maxEvents` events allowed in any rolling `windowMs` window.
 *  - OPEN   : once the window limit is exceeded, the circuit opens for
 *             `disconnectMs` and all subsequent events are dropped — even if
 *             the sliding window would otherwise allow them. This prevents
 *             a storm of duplicates from resuming immediately after the
 *             window slides.
 */
class RateLimiter {
    ringBuffer;
    windowStart = 0;
    maxEvents;
    windowMs;
    disconnectMs;
    circuitOpenUntil = 0;
    constructor(maxEvents, windowMs, disconnectMs) {
        this.maxEvents = this.sanitizeMaxEvents(maxEvents);
        this.windowMs = this.sanitizePositive(windowMs, DEFAULT_RATE_LIMIT_WINDOW_MS);
        this.disconnectMs = this.sanitizePositive(disconnectMs, DEFAULT_DISCONNECT_DURATION_MS);
        this.ringBuffer = new Array(this.maxEvents).fill(0);
    }
    /**
     * Returns true when an event is allowed to proceed. Consumes a slot on
     * allow. Caller must NOT consume a slot if the event is filtered out by a
     * beforeCapture hook.
     */
    tryAcquire(now = Date.now()) {
        if (now < this.circuitOpenUntil) {
            return false;
        }
        const oldestIdx = this.windowStart % this.maxEvents;
        const oldestTs = this.ringBuffer[oldestIdx];
        if (oldestTs !== 0 && now - oldestTs < this.windowMs) {
            // Filling the buffer within `windowMs` → open the circuit.
            this.circuitOpenUntil = now + this.disconnectMs;
            return false;
        }
        this.ringBuffer[oldestIdx] = now;
        this.windowStart += 1;
        return true;
    }
    /**
     * Live update from remote config. Preserves in-flight state sensibly:
     *  - Resets the window start only when maxEvents changes (buffer is resized).
     *  - Does NOT close an already-open circuit early: new disconnectMs applies
     *    from the next time the circuit opens.
     */
    updateConfig(maxEvents, windowMs, disconnectMs) {
        const newMax = this.sanitizeMaxEvents(maxEvents);
        if (newMax !== this.maxEvents) {
            this.maxEvents = newMax;
            this.ringBuffer = new Array(this.maxEvents).fill(0);
            this.windowStart = 0;
        }
        this.windowMs = this.sanitizePositive(windowMs, this.windowMs);
        this.disconnectMs = this.sanitizePositive(disconnectMs, this.disconnectMs);
    }
    /** true when the circuit is currently OPEN (i.e. all events dropped). */
    isOpen(now = Date.now()) {
        return now < this.circuitOpenUntil;
    }
    /** Test hook — clears all state. Not part of the public API. */
    _reset() {
        this.ringBuffer = new Array(this.maxEvents).fill(0);
        this.windowStart = 0;
        this.circuitOpenUntil = 0;
    }
    sanitizeMaxEvents(v) {
        if (!Number.isFinite(v) || v < 1) {
            return 1;
        }
        return Math.floor(v);
    }
    sanitizePositive(v, fallback) {
        if (!Number.isFinite(v) || v <= 0) {
            return fallback;
        }
        return v;
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Boolean config keys whose remote-config change must trigger a hook
 * reinstall. Driven as a table so `_updateFromRemoteConfig` applies them in
 * one loop instead of three near-identical `if` blocks.
 */
const HOOK_BOOLEAN_KEYS = [
    'enabled',
    'captureGlobalErrors',
    'captureUnhandledRejections',
];
/** Positive-number rate-limit config keys applied from a remote-config patch. */
const RATE_LIMIT_KEYS = [
    'maxEventsPerWindow',
    'rateLimitWindowMs',
    'disconnectDurationMs',
];
/**
 * Per-source capture-flag mapping. Driven as a table so `_dispatch` honours
 * runtime toggles with a single lookup instead of two near-identical guard
 * branches per source. A source whose flag is absent is always permitted.
 */
const SOURCE_CAPTURE_FLAG = {
    globalHandler: 'captureGlobalErrors',
    unhandledRejection: 'captureUnhandledRejections',
};
/**
 * Singleton error tracker. Owns all capture plugins, rate limiting,
 * deduplication, user-id propagation, and bridge dispatch.
 *
 * Lifetime:
 *  - Constructed as an ES module singleton (`export const errorTracker = ...`)
 *    so it can be imported by plugins and the ErrorBoundary without having a
 *    reference threaded through props.
 *  - `_initFromTracker()` is called by the SDK init code path. Subsequent
 *    re-calls apply the new config and reinstall hooks via `_applyHookState`,
 *    so capture-flag changes (captureGlobalErrors, captureUnhandledRejections)
 *    and enable/disable transitions take effect immediately.
 *  - `setEnabled()` and `_updateFromRemoteConfig()` route through the same
 *    `_applyHookState` helper so runtime toggles match init semantics.
 *  - `teardown()` uninstalls hooks and is called on SDK cleanup/removeAll.
 */
class ConvivaErrorTracker {
    config = applyConfigDefaults({});
    bridge = null;
    rateLimiter;
    dedup = new DedupGuard();
    pluginCleanups = [];
    installed = false;
    // Owns the global attribute bag + userId and builds the per-dispatch merged
    // attribute set, with prototype-pollution defence (see AttributeStore).
    attributes = new AttributeStore();
    // Listeners notified whenever `config.enabled` may have changed (init,
    // setEnabled, remote-config update, teardown). Used by ConvivaErrorBoundary
    // to re-render and pass through (stop intercepting) when disabled.
    enabledListeners = new Set();
    constructor() {
        this.rateLimiter = new RateLimiter(this.config.maxEventsPerWindow, this.config.rateLimitWindowMs, this.config.disconnectDurationMs);
    }
    /**
     * Called from src/api.ts on createTracker(). Wires the consumer config and
     * installs all capture hooks. Safe to call multiple times — config always
     * reflects the latest call, and capture-hook flags (captureGlobalErrors,
     * captureUnhandledRejections, enabled) are applied on every call by
     * tearing down the existing hooks and reinstalling them with the updated
     * flags via `_applyHookState`.
     */
    _initFromTracker(cfg) {
        // D7: initialisation MUST NOT throw. A failure here silently disables
        // error tracking but leaves the rest of the SDK functional.
        runSafely(() => {
            this.config = applyConfigDefaults(cfg);
            this.rateLimiter.updateConfig(this.config.maxEventsPerWindow, this.config.rateLimitWindowMs, this.config.disconnectDurationMs);
            this.bridge = this.config.bridgeAdapter ?? null;
            this._applyHookState();
        });
    }
    /**
     * Aligns plugin install state with the current `config.enabled` /
     * captureGlobalErrors / captureUnhandledRejections flags. Always tears
     * down existing hooks first so flag changes take effect immediately:
     *  - enabled:false → uninstall all plugins, clear INSTALL_FLAG.
     *  - enabled:true  → uninstall + reinstall per current capture flags.
     *
     * HMR / hot-reload safety: cleanup handles are read from
     * `globalThis[INSTALL_FLAG]` rather than only from `this.pluginCleanups`,
     * so a new tracker instance constructed by a re-evaluated module (Fast
     * Refresh, dev-server reload) still tears down the previous instance's
     * handlers instead of chaining a new one on top of the old one.
     *
     * Plugin installation is deferred until initialisation via
     * `installPlugins()`, but the plugin modules themselves are imported when
     * this tracker module is loaded.
     */
    _applyHookState() {
        if (readInstallState() !== null || this.installed) {
            this._drainPluginCleanups();
        }
        if (!this.config.enabled) {
            this._notifyEnabledChange();
            return;
        }
        this.installPlugins();
        // Share the same array reference so subsequent `installPlugins` mutations
        // (none today, but a future `installPlugins` could push a third cleanup)
        // remain reachable through the global slot.
        writeInstallState({ cleanups: this.pluginCleanups });
        this.installed = true;
        this._notifyEnabledChange();
    }
    /**
     * Runs every plugin cleanup (preferring the global-slot copy over
     * `this.pluginCleanups` so an HMR-swapped instance can still tear down the
     * previous incarnation's handlers), then clears local state and the global
     * install slot. Used by both `_applyHookState` (before reinstall) and
     * `teardown` (final shutdown).
     */
    _drainPluginCleanups() {
        const prior = readInstallState();
        const cleanups = prior !== null && prior !== 'legacy'
            ? prior.cleanups
            : this.pluginCleanups;
        for (const fn of cleanups) {
            runSafely(fn);
        }
        this.pluginCleanups = [];
        writeInstallState(null);
        this.installed = false;
    }
    /**
     * Current master enable state. Read by ConvivaErrorBoundary to decide whether
     * to intercept (enabled) or pass the error through (disabled).
     */
    isEnabled() {
        return this.config.enabled;
    }
    /**
     * Subscribe to master enable-state changes. The listener is invoked with the
     * current `enabled` value whenever it may have changed. Returns an
     * unsubscribe function. Never throws.
     */
    onEnabledChange(listener) {
        runSafely(() => this.enabledListeners.add(listener));
        return () => runSafely(() => this.enabledListeners.delete(listener));
    }
    /** Notifies enable-state listeners with the current value. Fail-silent. */
    _notifyEnabledChange() {
        const enabled = this.config.enabled;
        for (const listener of this.enabledListeners) {
            // a listener must not break others
            runSafely(() => listener(enabled));
        }
    }
    /**
     * Uninstalls every capture hook and clears internal state. Idempotent.
     * Called from src/api.ts on removeAllTrackers() / cleanup().
     *
     * Drains cleanups from BOTH `this.pluginCleanups` and the global install
     * slot so an HMR-swapped instance can still tear down handlers that were
     * registered by a previous incarnation of this module.
     */
    teardown() {
        runSafely(() => {
            this._drainPluginCleanups();
            this.dedup._reset();
            this.rateLimiter._reset();
            this.config.enabled = false;
            this.bridge = null;
            // Resets to a null-prototype bag + clears userId (see AttributeStore).
            this.attributes.reset();
            this._notifyEnabledChange();
        });
    }
    /**
     * Public toggle used by consumer API + remote config. Routes through
     * `_applyHookState` so transitions in either direction are observable:
     * enabled:false uninstalls plugins and clears INSTALL_FLAG, while
     * enabled:true installs them per current capture flags.
     */
    setEnabled(enabled) {
        // fail-silent — toggling must not throw.
        runSafely(() => {
            const next = !!enabled;
            if (next === this.config.enabled) {
                return;
            }
            this.config.enabled = next;
            this._applyHookState();
        });
    }
    setRateLimitingEnabled(enabled) {
        this.config.enableRateLimiting = !!enabled;
    }
    addAttribute(key, value) {
        this.attributes.add(key, value);
    }
    removeAttribute(key) {
        this.attributes.remove(key);
    }
    /** Called from src/subject.ts when setUserId runs. Kept internal. */
    _setUserId(id) {
        this.attributes.setUserId(id);
    }
    /**
     * Remote-config update point. Not yet wired to a backend, but in place for
     * future milestones. All fields optional; only provided ones override.
     *
     * If any of `enabled`, `captureGlobalErrors`, or `captureUnhandledRejections`
     * actually change, `_applyHookState` is invoked so plugin install state
     * matches the new config. This keeps remote-driven enable/disable and
     * capture toggles observable at the hook layer (not just at dispatch).
     */
    _updateFromRemoteConfig(patch) {
        runSafely(() => {
            if (patch == null || typeof patch !== 'object') {
                return;
            }
            const hookStateDirty = this._applyHookBooleanPatch(patch);
            if (typeof patch.enableRateLimiting === 'boolean') {
                this.config.enableRateLimiting = patch.enableRateLimiting;
            }
            this._applyRateLimitPatch(patch);
            if (hookStateDirty) {
                this._applyHookState();
            }
        });
    }
    /**
     * Applies the three hook-affecting boolean flags from a remote-config patch
     * via the `HOOK_BOOLEAN_KEYS` table. Returns true when any flag actually
     * changed so the caller can decide whether to reinstall plugin hooks.
     */
    _applyHookBooleanPatch(patch) {
        let dirty = false;
        for (const key of HOOK_BOOLEAN_KEYS) {
            const next = patch[key];
            if (typeof next === 'boolean' && next !== this.config[key]) {
                this.config[key] = next;
                dirty = true;
            }
        }
        return dirty;
    }
    /**
     * Applies the rate-limit subset of a remote-config patch to the internal
     * config and updates the RateLimiter when any value changed.
     */
    _applyRateLimitPatch(patch) {
        let dirty = false;
        for (const key of RATE_LIMIT_KEYS) {
            const v = patch[key];
            if (typeof v === 'number' && v > 0) {
                this.config[key] = v;
                dirty = true;
            }
        }
        if (dirty) {
            this.rateLimiter.updateConfig(this.config.maxEventsPerWindow, this.config.rateLimitWindowMs, this.config.disconnectDurationMs);
        }
    }
    /**
     * Internal entry point called from each plugin. Responsibilities:
     *  1. Honour dev-suppression and `enabled`.
     *  2. Honour per-source capture flags so runtime toggles work even when a
     *     plugin's teardown is best-effort (e.g. Hermes).
     *  3. Build + truncate the payload via private helpers.
     *  4. Run beforeCapture hook (fail-open).
     *  5. Bridge availability check.
     *  6. Rate-limit (after hook & bridge check — filtered / undeliverable
     *     events don't consume tokens).
     *  7. Forward to bridge adapter.
     *
     * NEVER throws. The pre-payload gates and the post-payload pipeline are
     * extracted into `_acquireBridge` and `_passesDispatchPipeline` so this
     * method's cyclomatic complexity stays low.
     */
    _dispatch(args) {
        // D7 — reporting path MUST NOT throw. Swallow and move on.
        runSafely(() => {
            const bridge = this._acquireBridge(args.errorSource);
            if (bridge === null) {
                return;
            }
            const norm = normalizeError(args.error, args.errorSource);
            const severity = args.severityOverride
                ?? computeSeverity(args.errorSource, args.isFatal, this.config.promiseRejectionsAsHandled);
            const attributes = this.attributes.build(args.extraAttributes);
            const payload = buildPayload({
                args, norm, severity, attributes, bundleId: this.config.bundleId,
            });
            if (!this._passesDispatchPipeline(payload, bridge)) {
                return;
            }
            this._forwardToBridge(payload);
        });
    }
    /**
     * Consolidates the pre-payload gates (enabled / dev-suppression / per-source
     * capture flag / bridge presence) into a single check. Returns the captured
     * bridge reference when dispatch should proceed, or `null` to short-circuit.
     *
     * Capturing the bridge here means the dispatch path is stable against
     * re-entrant mutation (e.g. a beforeCapture hook calling `_setBridge`) and
     * TypeScript can narrow `bridge` to `BridgeAdapter` for the rest of `_dispatch`.
     */
    _acquireBridge(source) {
        if (!this.config.enabled) {
            return null;
        }
        if (this.config.suppressInDev && isDevMode()) {
            return null;
        }
        const captureKey = SOURCE_CAPTURE_FLAG[source];
        if (captureKey !== undefined && this.config[captureKey] === false) {
            return null;
        }
        return this.bridge;
    }
    /**
     * Final post-payload gating: runs the beforeCapture hook (fail-open per D8),
     * confirms the bridge is still available, and consumes a rate-limit slot.
     * Returns `true` when the payload should be forwarded, `false` when dropped.
     *
     * Filtered / undeliverable events never consume a rate-limit token —
     * `tryAcquire` is the LAST gate before forwarding.
     */
    _passesDispatchPipeline(payload, bridge) {
        if (this.config.beforeCapture !== undefined) {
            const keep = safeCall(() => this.config.beforeCapture(payload), true);
            if (keep === false) {
                return false;
            }
        }
        if (!bridge.isAvailable()) {
            return false;
        }
        if (this.config.enableRateLimiting && !this.rateLimiter.tryAcquire()) {
            return false;
        }
        return true;
    }
    /**
     * Final hop to the native bridge. No session/subject enrichment happens
     * here: session linkage is owned by the native Conviva/Snowplow tracker,
     * which attaches a `client_session` context entity to every event emitted
     * from `trackCustomEvent` / `track(SelfDescribing(...))` when
     * `sessionContext: true` (the default). Adding a JS-side session fetch
     * would either duplicate that entity or produce a stale value across
     * native session rollovers, so the JS pipeline deliberately stays out
     * of it. Kept as a separate method purely as a test seam.
     */
    _forwardToBridge(payload) {
        const bridge = this.bridge;
        if (bridge === null || !bridge.isAvailable()) {
            return;
        }
        runSafely(() => bridge.reportJsError(payload));
    }
    /** @internal — test/introspection accessor. */
    _getConfig() {
        return this.config;
    }
    /** @internal — test/introspection accessor. */
    _getBridge() {
        return this.bridge;
    }
    /** @internal — test/introspection accessor. */
    _getDedupGuard() {
        return this.dedup;
    }
    /** @internal — test/introspection accessor. */
    _getRateLimiter() {
        return this.rateLimiter;
    }
    /** @internal — Bridge replacement (tests only). */
    _setBridge(bridge) {
        this.bridge = bridge;
    }
    /** @internal — hook install seam. See installPlugins. */
    get installedState() {
        return this.installed;
    }
    /**
     * Installs global-error-handler + promise-rejection plugins. Lazy-required
     * so unit tests do not pull in RN / ErrorUtils side effects at module load.
     *
     * The ErrorBoundary component is NOT installed here — it is a React
     * component the consumer wraps around their tree.
     */
    installPlugins() {
        // Plugin install failure MUST NOT break the SDK. Fail-silent.
        runSafely(() => {
            if (this.config.captureGlobalErrors) {
                const cleanup = installGlobalErrorHandler(this);
                if (typeof cleanup === 'function') {
                    this.pluginCleanups.push(cleanup);
                }
            }
            if (this.config.captureUnhandledRejections) {
                const cleanup = installPromiseRejectionHandler(this);
                if (typeof cleanup === 'function') {
                    this.pluginCleanups.push(cleanup);
                }
            }
        });
    }
    /** @internal — resolves once any pending install completes (test helper). */
    _waitForInstall() {
        return Promise.resolve();
    }
}
/** Module-level singleton shared by api.ts, subject.ts, and plugins. */
const errorTracker = new ConvivaErrorTracker();

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Fabricates an Error instance from the consumer-provided `argmap` so the
 * tracker's stack / parseFirstFrame logic runs uniformly against automatic
 * captures (which receive real Errors from RN's ErrorUtils / Promise hooks).
 */
function buildErrorInstance(argmap) {
    const e = new Error(argmap.message);
    if (argmap.errorType !== undefined) {
        e.name = argmap.errorType;
    }
    if (argmap.stackTrace !== undefined) {
        e.stack = argmap.stackTrace;
    }
    return e;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Dispatches the manual error through the error-tracking pipeline (dedup +
 * rate-limit + beforeCapture hook + bridge adapter). Fail-silent (D7) so a
 * malformed argmap can never reject the caller's track* promise.
 */
function dispatchManualError(argmap) {
    try {
        errorTracker._dispatch({
            error: buildErrorInstance(argmap),
            errorSource: 'manual',
            isFatal: argmap.isFatal === true,
            isHandled: argmap.isHandled !== false,
            componentStack: argmap.componentStack,
            extraAttributes: argmap.attributes,
        });
    }
    catch {
        // D7 — fail silent
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Builds the sp/ae/1-0-2 SelfDescribing data payload from `argmap`. */
function buildApplicationErrorData(argmap) {
    return {
        message: argmap.message,
        stackTrace: argmap.stackTrace ?? '',
        exceptionName: argmap.errorType ?? 'Error',
        programmingLanguage: 'JAVASCRIPT',
        isFatal: true,
        threadName: 'js',
    };
}
/** Copies consumer attributes onto `eventData`, dropping blocked keys and any
 *  collisions with reserved fields already written by buildNonFatalEventData. */
function mergeAttributes(eventData, attributes) {
    for (const k of Object.keys(attributes)) {
        if (!BLOCKED_ATTRIBUTE_KEYS.has(k) && !(k in eventData)) {
            eventData[k] = attributes[k];
        }
    }
}
/** Builds the non-fatal-error custom-event payload. */
function buildNonFatalEventData(argmap) {
    // Null-prototype target preserves prototype-pollution safety while keeping
    // `Object.assign` typed as `Record<string, unknown>` (not `any`).
    const eventData = Object.assign(Object.create(null), {
        message: argmap.message,
        errorType: argmap.errorType ?? 'Error',
        stackTrace: argmap.stackTrace ?? '',
        timestamp: Date.now(),
        isFatal: false,
        isHandled: argmap.isHandled !== false,
    });
    if (argmap.componentStack !== undefined) {
        eventData.componentStack = argmap.componentStack;
    }
    if (argmap.attributes !== undefined) {
        mergeAttributes(eventData, argmap.attributes);
    }
    return eventData;
}
/** Forwards `argmap` as the fatal sp/ae/1-0-2 SelfDescribing event. */
function emitFatal(namespace, argmap, contexts) {
    return RNConvivaTracker.trackSelfDescribingEvent({
        tracker: namespace,
        eventData: { schema: APPLICATION_ERROR_SCHEMA, data: buildApplicationErrorData(argmap) },
        contexts,
    });
}
/** Forwards `argmap` as the non-fatal custom event. */
function emitNonFatal(namespace, argmap, contexts) {
    return RNConvivaTracker.trackCustomEvent({
        tracker: namespace,
        eventName: NON_FATAL_ERROR_EVENT_NAME,
        eventData: buildNonFatalEventData(argmap),
        contexts,
    });
}
/**
 * Legacy fallback emit used when the bridge cannot deliver the canonical
 * `reportJsError` payload. Routing depends on `isFatal`:
 *  - true  → sp/ae/1-0-2 SelfDescribing event with CRASH classification
 *  - false → `conviva_non_fatal_error` custom event
 */
function emitLegacyFallback(namespace, argmap, contexts) {
    return (argmap.isFatal ?? false)
        ? emitFatal(namespace, argmap, contexts)
        : emitNonFatal(namespace, argmap, contexts);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
function isBridgeReady() {
    const cfg = errorTracker._getConfig();
    const bridge = errorTracker._getBridge();
    return cfg.enabled === true && bridge !== null && bridge.isAvailable();
}
function isDevSuppressed() {
    const cfg = errorTracker._getConfig();
    const isDev = typeof __DEV__ !== 'undefined' && !!__DEV__;
    return cfg.suppressInDev === true && isDev;
}
/**
 * Single-emit guarantee: when the error-tracking pipeline already produced the
 * authoritative native event (bridge enabled + reachable) — or `suppressInDev`
 * dropped the dispatch — the legacy track*Event fallback must NOT re-emit.
 *
 * Returns true to skip the legacy fallback, false to fall through to it.
 * Never throws; on internal error it returns false (legacy fallback runs).
 */
function shouldSkipLegacyFallback() {
    try {
        return isBridgeReady() || isDevSuppressed();
    }
    catch {
        return false;
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
function reThrowTrackErrorEvent(error) {
    throw new Error(`${logMessages.trackErrorEvent} ${error.message}`);
}
/**
 * Manual error-reporting entry point.
 *
 * Routing strategy (single-emit guarantee):
 *   1. Always dispatch through the error-tracking pipeline (dedup +
 *      rate-limit + beforeCapture hook + bridge adapter). Fail-silent (D7).
 *   2. If the bridge adapter is enabled AND can deliver to native, step 1 has
 *      already produced the canonical native event. We therefore RETURN EARLY
 *      so the same error is not re-emitted via the legacy fallback.
 *   3. If error tracking is disabled OR the bridge cannot deliver, we fall
 *      back to the legacy track*Event path so consumer events still reach the
 *      native SDK. See `legacyFallback.ts` for the fatal vs non-fatal routing.
 */
function trackError$2(namespace, argmap, contexts = []) {
    return validateErrorEvent(argmap)
        .then(() => validateContexts(contexts))
        .then(() => {
        dispatchManualError(argmap);
        if (shouldSkipLegacyFallback()) {
            return Promise.resolve();
        }
        return emitLegacyFallback(namespace, argmap, contexts);
    })
        .catch(reThrowTrackErrorEvent);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
function reThrowSetJsBundleInfoError(error) {
    throw new Error(`setJsBundleInfo: ${error.message}`);
}
/**
 * Passes JS bundle identity fields to the native SDK.
 *
 * @param namespace - the tracker namespace
 * @param info - map of JS bundle fields
 */
function setJsBundleInfo$1(namespace, info) {
    return RNConvivaTracker.setJsBundleInfo({
        tracker: namespace,
        info,
    }).catch(reThrowSetJsBundleInfoError);
}

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
/**
 * Tracks a self-describing event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackSelfDescribingEvent$1(namespace, argmap, contexts = []) {
    return validateSelfDesc(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackSelfDescribingEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackSelfDesc} ${error.message}`);
    });
}
/**
 * Tracks a screen-view event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackScreenViewEvent$1(namespace, argmap, contexts = []) {
    return validateScreenView(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackScreenViewEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`Conviva ${logMessages.trackScreenView} ${error.message}`);
    });
}
/**
 * Tracks a structured event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackStructuredEvent$1(namespace, argmap, contexts = []) {
    return validateStructured(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackStructuredEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackStructured} ${error.message}`);
    });
}
/**
 * Tracks a page-view event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackPageView$1(namespace, argmap, contexts = []) {
    return validatePageView(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackPageView({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackPageView} ${error.message}`);
    });
}
/**
 * Tracks a timing event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackTimingEvent$1(namespace, argmap, contexts = []) {
    return validateTiming(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackTimingEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackTiming} ${error.message}`);
    });
}
/**
 * Tracks a consent-granted event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackConsentGrantedEvent$1(namespace, argmap, contexts = []) {
    return validateConsentGranted(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackConsentGrantedEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackConsentGranted} ${error.message}`);
    });
}
/**
 * Tracks a consent-withdrawn event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackConsentWithdrawnEvent$1(namespace, argmap, contexts = []) {
    return validateConsentWithdrawn(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackConsentWithdrawnEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackConsentWithdrawn} ${error.message}`);
    });
}
/**
 * Tracks an ecommerce-transaction event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackEcommerceTransactionEvent$1(namespace, argmap, contexts = []) {
    return validateEcommerceTransaction(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackEcommerceTransactionEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackEcommerceTransaction} ${error.message}`);
    });
}
/**
 * Tracks a deep link received event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackDeepLinkReceivedEvent$1(namespace, argmap, contexts = []) {
    return validateDeepLinkReceived(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackDeepLinkReceivedEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackDeepLinkReceived} ${error.message}`);
    });
}
/**
 * Tracks a message notification event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackMessageNotificationEvent$1(namespace, argmap, contexts = []) {
    return validateMessageNotification(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackMessageNotificationEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackMessageNotification} ${error.message}`);
    });
}
/**
 * Tracks a Custom Event
 *
 * @param namespace {string} - the tracker namespace
 * @param name {string} - the custom event name
 * @param arg {any} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackCustomEvent$1(namespace, name, arg, contexts = []) {
    return validateCustomEvent(arg)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackCustomEvent({
        tracker: namespace,
        eventName: name,
        eventData: arg,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackCustomEvent} ${error.message}`);
    });
}
/**
 * Tracks a revenue event
 *
 * @param namespace {string} - the tracker namespace
 * @param argmap {Object} - the event data
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function trackRevenueEvent$1(namespace, argmap, contexts = []) {
    return validateRevenueEvent(argmap)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.trackRevenueEvent({
        tracker: namespace,
        eventData: argmap,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.trackRevenueEvent} ${error.message}`);
    });
}
/**
 * Sets custom tags
 *
 * @param namespace {string} - the tracker namespace
 * @param arg {any} - the custom tags
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function setCustomTags$1(namespace, arg, contexts = []) {
    return validateCustomTags(arg)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.setCustomTags({
        tracker: namespace,
        tags: arg,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.setCustomTags} ${error.message}`);
    });
}
/**
 * Sets custom tags
 *
 * @param namespace {string} - the tracker namespace
 * @param category {string} - category
 * @param arg {any} - the custom tags
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function setCustomTagsWithCategory$1(namespace, category, arg, contexts = []) {
    return validateCustomTags(arg)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.setCustomTagsWithCategory({
        tracker: namespace,
        category: category,
        tags: arg,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.setCustomTags} ${error.message}`);
    });
}
/**
 * Clears few of the Custom Tags which are set previously
 *
 * @param namespace {string} - the tracker namespace
 * @param argArray {string []} - the custom tag keys to be deleted
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function clearCustomTags$1(namespace, argArray, contexts = []) {
    return validateClearCustomTags(argArray)
        .then(() => validateContexts(contexts))
        .then(() => RNConvivaTracker.clearCustomTags({
        tracker: namespace,
        tagKeys: argArray,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.clearCustomTags} ${error.message}`);
    });
}
/**
 * Clears all the previously set Custom Tags
 *
 * @param namespace {string} - the tracker namespace
 * @param contexts {Array}- the event contexts
 * @returns {Promise}
 */
function clearAllCustomTags$1(namespace, contexts = []) {
    return validateContexts(contexts)
        .then(() => RNConvivaTracker.clearAllCustomTags({
        tracker: namespace,
        contexts: contexts
    }))
        .catch((error) => {
        throw new Error(`${logMessages.clearAllCustomTags} ${error.message}`);
    });
}
/**
 * Track user click event
 *
 * @param namespace {string} - the tracker namespace
 * @param eventData {any}- the user click data
 * @returns {Promise}
 */
function trackClickEvent$1(namespace, eventData) {
    return RNConvivaTracker.trackClickEvent({
        tracker: namespace,
        eventData: eventData
    })
        .catch((error) => {
        throw new Error(`${logMessages.trackClickEvent} ${error.message}`);
    });
}

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
/**
 * Sets the userId of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newUid {string | null} - the new userId
 * @returns - Promise
 */
function setUserId$1(namespace, newUid) {
    if (!(newUid === null || typeof newUid === 'string')) {
        return Promise.reject(new Error(logMessages.setUserId));
    }
    // Wait for the native call to resolve before forwarding to the error
    // tracker. If the native promise rejects, the SDK promise rejects and
    // the error tracker's userId is left untouched — keeping JS error
    // payloads aligned with the native subject state. Fail-silent (D7):
    // a propagation failure here must not surface to consumers.
    return Promise.resolve(RNConvivaTracker.setUserId({
        tracker: namespace,
        userId: newUid
    })).then(() => {
        try {
            errorTracker._setUserId(newUid);
        }
        catch {
            /* D7 */
        }
        // Explicit return so promise/always-return is satisfied without
        // changing the resolved value (still Promise<void> from the consumer
        // perspective).
        return undefined;
    });
}
/**
 * Sets the networkUserId of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newNuid {string | null} - the new networkUserId
 * @returns - Promise
 */
function setNetworkUserId$1(namespace, newNuid) {
    if (!(newNuid === null || typeof newNuid === 'string')) {
        return Promise.reject(new Error(logMessages.setNetworkUserId));
    }
    return Promise.resolve(RNConvivaTracker.setNetworkUserId({
        tracker: namespace,
        networkUserId: newNuid
    }));
}
/**
 * Sets the domainUserId of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newDuid {string | null} - the new domainUserId
 * @returns - Promise
 */
function setDomainUserId$1(namespace, newDuid) {
    if (!(newDuid === null || typeof newDuid === 'string')) {
        return Promise.reject(new Error(logMessages.setDomainUserId));
    }
    return Promise.resolve(RNConvivaTracker.setDomainUserId({
        tracker: namespace,
        domainUserId: newDuid
    }));
}
/**
 * Sets the ipAddress of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newIp {string | null} - the new ipAddress
 * @returns - Promise
 */
function setIpAddress$1(namespace, newIp) {
    if (!(newIp === null || typeof newIp === 'string')) {
        return Promise.reject(new Error(logMessages.setIpAddress));
    }
    return Promise.resolve(RNConvivaTracker.setIpAddress({
        tracker: namespace,
        ipAddress: newIp
    }));
}
/**
 * Sets the useragent of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newUagent {string | null} - the new useragent
 * @returns - Promise
 */
function setUseragent$1(namespace, newUagent) {
    if (!(newUagent === null || typeof newUagent === 'string')) {
        return Promise.reject(new Error(logMessages.setUseragent));
    }
    return Promise.resolve(RNConvivaTracker.setUseragent({
        tracker: namespace,
        useragent: newUagent
    }));
}
/**
 * Sets the timezone of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newTz {string | null} - the new timezone
 * @returns - Promise
 */
function setTimezone$1(namespace, newTz) {
    if (!(newTz === null || typeof newTz === 'string')) {
        return Promise.reject(new Error(logMessages.setTimezone));
    }
    return Promise.resolve(RNConvivaTracker.setTimezone({
        tracker: namespace,
        timezone: newTz
    }));
}
/**
 * Sets the language of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newLang {string | null} - the new language
 * @returns - Promise
 */
function setLanguage$1(namespace, newLang) {
    if (!(newLang === null || typeof newLang === 'string')) {
        return Promise.reject(new Error(logMessages.setLanguage));
    }
    return Promise.resolve(RNConvivaTracker.setLanguage({
        tracker: namespace,
        language: newLang
    }));
}
/**
 * Sets the screenResolution of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newRes {ScreenSize | null} - the new screenResolution
 * @returns - Promise
 */
function setScreenResolution$1(namespace, newRes) {
    if (!(newRes === null || isScreenSize(newRes))) {
        return Promise.reject(new Error(logMessages.setScreenResolution));
    }
    return Promise.resolve(RNConvivaTracker.setScreenResolution({
        tracker: namespace,
        screenResolution: newRes
    }));
}
/**
 * Sets the screenViewport of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newView {ScreenSize | null} - the new screenViewport
 * @returns - Promise
 */
function setScreenViewport$1(namespace, newView) {
    if (!(newView === null || isScreenSize(newView))) {
        return Promise.reject(new Error(logMessages.setScreenViewport));
    }
    return Promise.resolve(RNConvivaTracker.setScreenViewport({
        tracker: namespace,
        screenViewport: newView
    }));
}
/**
 * Sets the colorDepth of the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param newColorD {number | null} - the new colorDepth
 * @returns - Promise
 */
function setColorDepth$1(namespace, newColorD) {
    if (!(newColorD === null || typeof newColorD === 'number')) {
        return Promise.reject(new Error(logMessages.setColorDepth));
    }
    return Promise.resolve(RNConvivaTracker.setColorDepth({
        tracker: namespace,
        colorDepth: newColorD
    }));
}
const setterMap = {
    userId: setUserId$1,
    networkUserId: setNetworkUserId$1,
    domainUserId: setDomainUserId$1,
    ipAddress: setIpAddress$1,
    useragent: setUseragent$1,
    timezone: setTimezone$1,
    language: setLanguage$1,
    screenResolution: setScreenResolution$1,
    screenViewport: setScreenViewport$1,
    colorDepth: setColorDepth$1
};
/**
 * Sets the tracker subject
 *
 * @param namespace {string} - the tracker namespace
 * @param config {SubjectConfiguration} - the new subject data
 * @returns - Promise
 */
function setSubjectData$1(namespace, config) {
    if (!isValidSubjectConf(config)) {
        return Promise.reject(new Error(`${logMessages.setSubjectData} ${logMessages.subject}`));
    }
    const promises = Object.keys(config)
        .map((k) => {
        const fun = setterMap[k];
        return fun ? fun(namespace, config[k]) : undefined;
    })
        .filter((f) => f !== undefined);
    // to use Promise.all (Promise.allSettled not supported in all RN versions)
    const safePromises = promises
        .map((p) => p
        .then((x) => Object.assign({
        status: 'fulfilled',
        value: x
    }))
        .catch((err) => Object.assign({
        status: 'rejected',
        reason: err.message
    })));
    return Promise.all(safePromises).then((outcomes) => {
        const anyReasons = outcomes.filter((res) => res.status === 'rejected');
        if (anyReasons.length > 0) {
            const allReasons = anyReasons
                .reduce((acc, curr) => acc + ':' + curr.reason, logMessages.setSubjectData);
            throw new Error(allReasons);
        }
        return true;
    });
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
// Module-level state for the public api.ts surface. Centralised here so the
// per-category wrapper files can share the init flag and remote-config cleanup
// handle without growing api.ts's cyclomatic complexity.
let isTrackerInitialised = false;
let stopRemoteConfigSync = null;
function getIsInitialised() {
    return isTrackerInitialised;
}
function setIsInitialised(value) {
    isTrackerInitialised = value;
}
function setRemoteConfigCleanup(fn) {
    stopRemoteConfigSync = fn;
}
/** Stops any active remote-config sync. Idempotent, fail-silent. */
function teardownRemoteConfigSync() {
    try {
        const fn = stopRemoteConfigSync;
        if (fn !== null) {
            fn();
            stopRemoteConfigSync = null;
        }
    }
    catch {
        // D7 — teardown must not throw.
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
function isObject(v) {
    return typeof v === 'object' && v !== null;
}
function positiveNumber(v) {
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Maps each native `collectionRateLimit.exceptionAutotracking` field to its
 * `RemoteConfigPatch` counterpart. Driven as a table so the three fields are
 * applied in one loop instead of three near-identical assignments.
 */
const RATE_LIMIT_FIELD_MAP = [
    ['maxEvents', 'maxEventsPerWindow'],
    ['timeWindow', 'rateLimitWindowMs'],
    ['disconnectDuration', 'disconnectDurationMs'],
];
/**
 * Reads `collectionRateLimit.exceptionAutotracking` from a bundle and writes
 * each positive-number rate-limit field onto `patch`. Absent / non-positive
 * values are silently skipped, leaving the JS-side defaults in place.
 */
function applyCollectionRateLimit(bundle, patch) {
    const collectionRateLimit = bundle.collectionRateLimit;
    if (!isObject(collectionRateLimit)) {
        return;
    }
    const rl = collectionRateLimit.exceptionAutotracking;
    if (!isObject(rl)) {
        return;
    }
    for (const [srcKey, patchKey] of RATE_LIMIT_FIELD_MAP) {
        const value = positiveNumber(rl[srcKey]);
        if (value !== undefined) {
            patch[patchKey] = value;
        }
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Reads `trackerConfiguration.exceptionAutotracking` from a bundle and writes
 * the `enabled` field onto `patch` when the trackerConfiguration node exists.
 * Present-and-boolean wins; a bundle that omits the key is treated as enabled
 * (true), matching the native TrackerConfiguration default and the JS-web
 * DEFAULT_REMOTE_CONFIG.exceptionAutotracking default.
 */
function applyTrackerConfiguration(bundle, patch) {
    const trackerConfiguration = bundle.trackerConfiguration;
    if (!isObject(trackerConfiguration)) {
        return;
    }
    const ea = trackerConfiguration.exceptionAutotracking;
    patch.enabled = typeof ea === 'boolean' ? ea : true;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Default tracker namespace used by the RN tracker (see src/tracker.ts). */
const DEFAULT_NAMESPACE = 'CAT';
/**
 * Selects the configuration bundle for the RN tracker. Prefers an exact
 * `namespace === "CAT"` match (mirrors how the native SDK keys bundles) and
 * falls back to the first bundle, matching the JS-web tracker's
 * `configurationBundle[0]` behaviour.
 */
function selectBundle(bundles) {
    if (!Array.isArray(bundles) || bundles.length === 0) {
        return undefined;
    }
    for (const b of bundles) {
        if (isObject(b) && b.namespace === DEFAULT_NAMESPACE) {
            return b;
        }
    }
    const first = bundles[0];
    return isObject(first) ? first : undefined;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Parses the verbatim native remote-config JSON string into a `RemoteConfigPatch`.
 * Reads the same fields as the Conviva JS horizontal tracker:
 *  - `configurationBundle[].trackerConfiguration.exceptionAutotracking`
 *    → `enabled` (defaults to `true` when the key is absent but a bundle
 *    exists, matching the native/JS-web default).
 *  - `configurationBundle[].collectionRateLimit.exceptionAutotracking`
 *    `{ maxEvents, timeWindow, disconnectDuration }` →
 *    `{ maxEventsPerWindow, rateLimitWindowMs, disconnectDurationMs }`
 *    (each omitted from the patch when absent, so JS defaults stand).
 *
 * Fully defensive (D7): a null / empty / malformed input, a missing bundle, or
 * any unexpected shape yields an empty patch (no config change). Never throws.
 */
function parseRemoteConfig(json) {
    const patch = {};
    try {
        if (typeof json !== 'string' || json.length === 0) {
            return patch;
        }
        const root = JSON.parse(json);
        if (!isObject(root)) {
            return patch;
        }
        const bundle = selectBundle(root.configurationBundle);
        if (bundle === undefined) {
            return patch;
        }
        applyTrackerConfiguration(bundle, patch);
        applyCollectionRateLimit(bundle, patch);
    }
    catch {
        // D7 — schema drift / malformed JSON must never throw. Return whatever was
        // resolved before the failure (typically the empty patch).
    }
    return patch;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Probes TurboModuleRegistry (New Architecture / RN 0.76+) first, then falls
 * back to NativeModules (Legacy Architecture) for a module that satisfies the
 * supplied `validate` predicate. Returns null when neither registry yields a
 * passing module — typical in Node / Jest / web environments. Never throws:
 * a registry access that itself throws is caught and treated as absence.
 *
 * `validate` lets callers assert that a specific accessor is present on the
 * resolved module (e.g. `reportJsError`, `getRemoteConfig`) so a stub that
 * happens to be registered under the same name does not pass.
 *
 * Replaces two near-identical inline implementations that previously lived in
 * NativeBridgeAdapter (resolveNativeModule) and RemoteConfigSync
 * (resolveRemoteConfigSource).
 */
function resolveTurboOrLegacy(moduleName, validate) {
    const tm = safeCall(() => {
        const mod = TurboModuleRegistry.get(moduleName);
        return mod !== null && validate(mod) ? mod : null;
    }, null);
    if (tm !== null) {
        return tm;
    }
    return safeCall(() => {
        const mods = NativeModules;
        const legacy = mods[moduleName];
        return legacy !== undefined && validate(legacy) ? legacy : null;
    }, null);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Probes TurboModuleRegistry first, then falls back to NativeModules, for an
 * RNConvivaTracker module that exposes a callable `getRemoteConfig`. Returns
 * a thunk that invokes the resolved accessor, or null when neither registry
 * yields a passing module (test / Node / web environments).
 */
function resolveRemoteConfigSource() {
    const mod = resolveTurboOrLegacy('RNConvivaTracker', (m) => typeof m.getRemoteConfig === 'function');
    return mod !== null ? () => mod.getRemoteConfig() : null;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Fetches the verbatim remote-config JSON from native, parses it, and forwards
 * the resulting patch to the supplied `onPatch` callback. Fully fail-silent
 * (D7): a missing native accessor, a rejected promise, or a malformed payload
 * leaves the current config untouched. The callback is only invoked when the
 * patch is non-empty.
 */
async function fetchAndApplyRemoteConfig(source, onPatch) {
    try {
        const getter = source ?? resolveRemoteConfigSource();
        if (getter === null) {
            return;
        }
        const json = await getter();
        const patch = parseRemoteConfig(json);
        if (Object.keys(patch).length > 0) {
            onPatch?.(patch);
        }
    }
    catch {
        // D7 — remote-config sync must never throw.
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
const NOOP = () => { };
/**
 * Subscribes to AppState `change` events and re-pulls remote-config on every
 * transition INTO the foreground. Returns a cleanup function that removes the
 * subscription. Returns NOOP when AppState.addEventListener is unavailable.
 */
function subscribeForegroundRefresh(source, onPatch) {
    if (typeof AppState.addEventListener !== 'function') {
        return NOOP;
    }
    let lastState = typeof AppState.currentState === 'string'
        ? AppState.currentState
        : 'unknown';
    const onChange = (nextState) => {
        // Only re-pull on a real transition INTO the foreground, not on every
        // change (e.g. active -> inactive -> active produces one re-pull).
        if (nextState === 'active' && lastState !== 'active') {
            fetchAndApplyRemoteConfig(source, onPatch).catch(() => { });
        }
        lastState = nextState;
    };
    // RN >= 0.65 returns a subscription with `.remove()`. Older RN (peerDep is
    // `x.x`) returned void and required `AppState.removeEventListener`. Support
    // both shapes so the listener is genuinely cleaned up on every RN version.
    const subscription = AppState.addEventListener('change', onChange);
    return () => runSafely(() => {
        if (subscription && typeof subscription.remove === 'function') {
            subscription.remove();
            return;
        }
        const legacyRemove = AppState.removeEventListener;
        if (typeof legacyRemove === 'function') {
            legacyRemove.call(AppState, 'change', onChange);
        }
    });
}
/**
 * Starts remote-config synchronisation:
 *  1. Performs an immediate fetch+apply (init reconcile).
 *  2. Re-fetches on every transition to the `active` AppState, capturing
 *     mid-session remote-config flips.
 *
 * Returns a cleanup function that removes the AppState subscription. Safe to
 * call in environments without AppState (returns a no-op cleanup). Never throws.
 */
function startRemoteConfigSync(source, onPatch) {
    // Fire the initial reconcile as early as possible; do not await so tracker
    // setup is never delayed.
    fetchAndApplyRemoteConfig(source, onPatch).catch(() => { });
    return safeCall(() => subscribeForegroundRefresh(source, onPatch), NOOP);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * List of reserved keys — anything NOT in this set inside `payload.attributes`
 * is flattened to a top-level key on the wire payload. Keep this in sync with
 * the reserved-key list on the Android/iOS side.
 */
const RESERVED_KEYS = new Set([
    'timestamp',
    'message',
    'errorType',
    'stackTrace',
    'isFatal',
    'isHandled',
    'errorSource',
    'severity',
    'componentStack',
    'lineNumber',
    'lineColumn',
    'fileName',
    'bundleId',
    'jsEngine',
]);
/**
 * Reserved payload fields that are ALWAYS forwarded across the wire (never
 * undefined on a well-formed JsErrorPayload).
 */
const REQUIRED_PAYLOAD_KEYS = [
    'timestamp',
    'message',
    'errorType',
    'stackTrace',
    'isFatal',
    'isHandled',
    'errorSource',
    'severity',
    'jsEngine',
];
/**
 * Reserved payload fields that are optional — copied to the wire object ONLY
 * when defined, so the wire stays small.
 */
const OPTIONAL_PAYLOAD_KEYS = [
    'componentStack',
    'lineNumber',
    'lineColumn',
    'fileName',
    'bundleId',
];
function isReservedOrBlocked(k) {
    return RESERVED_KEYS.has(k) || BLOCKED_ATTRIBUTE_KEYS.has(k);
}
/** Unconditionally copies each key from `src` into `out`. */
function copyFields(out, src, keys) {
    for (const key of keys) {
        out[key] = src[key];
    }
}
/** Copies each key only when the source value is not `undefined`. */
function copyDefinedFields(out, src, keys) {
    for (const key of keys) {
        const v = src[key];
        if (v !== undefined) {
            out[key] = v;
        }
    }
}
/**
 * Flattens consumer-supplied attributes onto the wire object, dropping any key
 * that collides with a reserved field or matches a prototype-pollution name.
 */
function copyConsumerAttributes(out, attributes) {
    for (const [k, v] of Object.entries(attributes)) {
        if (isReservedOrBlocked(k)) {
            continue;
        }
        out[k] = v;
    }
}
/**
 * Merge reserved fields + attributes into a single flat object. Any
 * attribute key colliding with a reserved key is dropped to avoid the
 * consumer overwriting tracker-owned fields. Prototype-pollution keys
 * (`__proto__`, `constructor`, `prototype`) are dropped unconditionally.
 *
 * The wire object is built with a null prototype (`Object.create(null)`)
 * so that even if an attribute key sneaks past the filter set, direct
 * assignment cannot mutate `Object.prototype` or the wire object's
 * prototype chain.
 */
function buildWirePayload(p) {
    const out = Object.create(null);
    copyFields(out, p, REQUIRED_PAYLOAD_KEYS);
    copyDefinedFields(out, p, OPTIONAL_PAYLOAD_KEYS);
    if (p.attributes !== undefined) {
        copyConsumerAttributes(out, p.attributes);
    }
    return out;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
class NativeBridgeAdapter {
    module;
    constructor() {
        this.module = resolveTurboOrLegacy('RNConvivaTracker', (mod) => typeof mod.reportJsError === 'function');
    }
    isAvailable() {
        return this.module !== null && typeof this.module.reportJsError === 'function';
    }
    reportJsError(payload) {
        const mod = this.module;
        if (mod === null) {
            return;
        }
        // D7 — the reporting path must never throw.
        runSafely(() => {
            const wire = buildWirePayload(payload);
            mod.reportJsError(JSON.stringify(wire));
        });
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Resolves the bridge adapter for error tracking: uses the consumer-supplied
 * adapter when present, otherwise falls back to the production NativeBridgeAdapter.
 * Tests override this by passing `errorTracking.bridgeAdapter` in `initConfig`.
 */
function buildErrorTrackingAdapter(cfg) {
    return cfg.bridgeAdapter ?? new NativeBridgeAdapter();
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Wires the error-tracking singleton after tracker creation. `errorTracking:
 * false` fully opts out; omitting it or passing an object opts in with
 * defaults. After opt-in, an immediate fetch+apply reconciles the
 * consumer-configured enable/rate-limit state against the native
 * remote-config JSON, and an AppState 'active' listener re-pulls on each
 * foreground to capture mid-session flips.
 */
function wireErrorTracking(initConfig) {
    const etConfig = initConfig.errorTracking;
    try {
        if (etConfig === false) {
            teardownRemoteConfigSync();
            errorTracker.teardown();
            return;
        }
        const cfg = etConfig ?? {};
        errorTracker._initFromTracker({
            ...cfg,
            bridgeAdapter: buildErrorTrackingAdapter(cfg),
        });
        teardownRemoteConfigSync();
        setRemoteConfigCleanup(startRemoteConfigSync(undefined, (patch) => errorTracker._updateFromRemoteConfig(patch)));
    }
    catch {
        // D7 — initialisation failure must not break tracker setup.
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Narrow `unknown` to a non-empty string. */
function nonEmptyString(v) {
    return typeof v === 'string' && v.length > 0 ? v : undefined;
}
/**
 * Reads the build-time-injected bundle id from the global slot. Consumers can
 * set `global.__CONVIVA_BUNDLE_ID__` via a Metro transformer or Babel plugin.
 */
function readBundleIdFromGlobal() {
    return safeCall(() => {
        const g = globalThis;
        return nonEmptyString(g.__CONVIVA_BUNDLE_ID__);
    }, undefined);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Reads a constant via the TurboModule getConstants() accessor, when present. */
function readFromGetConstants(mod, key) {
    const getConstants = mod.getConstants;
    if (typeof getConstants !== 'function') {
        return undefined;
    }
    const constants = getConstants.call(mod);
    return constants != null ? nonEmptyString(constants[key]) : undefined;
}
/**
 * Reads a constant off a native module, supporting BOTH the Legacy
 * architecture (direct property access) AND the New Architecture / TurboModules
 * (constants exposed only behind `getConstants()`).
 */
function readNativeConstant(mod, key) {
    if (mod == null) {
        return undefined;
    }
    return safeCall(() => {
        const direct = nonEmptyString(mod[key]);
        return direct !== undefined ? direct : readFromGetConstants(mod, key);
    }, undefined);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Resolves the Expo Updates native module WITHOUT a build-time dependency on
 * `expo-updates`.
 *
 * We deliberately do NOT `require('expo-updates')` (nor import
 * `expo-modules-core`): a static require/import of an OPTIONAL package is
 * resolved by Metro at BUILD time, so it would break the bundle for every
 * consumer app that doesn't have it installed.
 *
 * Instead we read the runtime registries the package populates ONLY when it is
 * actually installed (both are plain `undefined` otherwise, so discovery falls
 * through to the embedded record):
 *
 *   1. `globalThis.expo.modules.ExpoUpdates` — the JSI host object used by
 *      modern `expo-updates`.
 *   2. `NativeModules.ExpoUpdates` — legacy RN-bridge fallback.
 *
 * Never throws.
 */
function getExpoUpdatesModule() {
    const fromExpoModules = safeCall(() => {
        const g = globalThis;
        return g.expo?.modules?.ExpoUpdates ?? undefined;
    }, undefined);
    if (fromExpoModules != null) {
        return fromExpoModules;
    }
    return safeCall(() => NativeModules.ExpoUpdates ?? undefined, undefined);
}
/**
 * Expo Updates / EAS Update. Reads the JSI/global registry first (modern
 * expo-updates), then the legacy bridge — see getExpoUpdatesModule.
 */
function resolveExpoId() {
    const expo = getExpoUpdatesModule();
    const expoUpdateId = readNativeConstant(expo, 'updateId');
    if (expoUpdateId === undefined) {
        return undefined;
    }
    const out = {
        jsBundleId: expoUpdateId,
        jsBundleSource: 'expo',
    };
    const channel = readNativeConstant(expo, 'channel') ?? readNativeConstant(expo, 'releaseChannel');
    if (channel !== undefined) {
        out.jsBundleChannel = channel;
    }
    return out;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Consumer override — treated as a build-time / global id. */
function resolveOverrideId(overrideBundleId) {
    const override = nonEmptyString(overrideBundleId);
    return override !== undefined
        ? { jsBundleId: override, jsBundleSource: 'global' }
        : undefined;
}
/** Build-time injected global. */
function resolveGlobalId() {
    const globalId = readBundleIdFromGlobal();
    return globalId !== undefined
        ? { jsBundleId: globalId, jsBundleSource: 'global' }
        : undefined;
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * CodePush `UpdateState.RUNNING` — the bundle currently executing. This is a
 * stable enum value in the CodePush native module; hard-coded so we never need
 * to import the JS package.
 */
const CODE_PUSH_UPDATE_STATE_RUNNING = 0;
/**
 * Optional CodePush fields that map onto the BundleInfoRecord. Each entry pairs
 * the source field on the LocalPackage with the destination field on the
 * BundleInfoRecord, so the discoverAsync body iterates instead of repeating an
 * `if (nonEmptyString(pkg.X) !== undefined) { record.Y = ... }` pair per field.
 */
const CODE_PUSH_OPTIONAL_FIELDS = [
    ['label', 'jsBundleLabel'],
    ['deploymentKey', 'jsBundleChannel'],
];
/** Awaits the CodePush LocalPackage for the currently-running update, or null
 *  when the module / accessor is unavailable. Caller wraps this in a try/catch. */
async function fetchCodePushRunningPackage() {
    const codePush = NativeModules.CodePush;
    const getUpdateMetadata = codePush?.getUpdateMetadata;
    if (typeof getUpdateMetadata !== 'function') {
        return null;
    }
    return (await getUpdateMetadata.call(codePush, CODE_PUSH_UPDATE_STATE_RUNNING));
}
/**
 * Asynchronous bundle-identity discovery for CodePush (and compatible forks).
 *
 * Reads CodePush via `NativeModules.CodePush` so a static
 * `require('react-native-code-push')` (which Metro would resolve at build time)
 * is avoided — the optional package is simply absent on consumers that don't
 * have it installed.
 *
 * Resolves to a record ONLY when a non-empty `packageHash` is found; otherwise
 * resolves to `null`. Never rejects.
 */
async function discoverAsync() {
    try {
        const pkg = await fetchCodePushRunningPackage();
        const packageHash = nonEmptyString(pkg?.packageHash);
        if (packageHash === undefined) {
            return null;
        }
        const record = {
            jsBundleSource: 'codepush',
            jsEngine: detectJsEngine(),
            jsBundleId: packageHash,
        };
        for (const [srcKey, destKey] of CODE_PUSH_OPTIONAL_FIELDS) {
            const value = nonEmptyString(pkg[srcKey]);
            if (value !== undefined) {
                record[destKey] = value;
            }
        }
        return record;
    }
    catch {
        return null;
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Synchronous bundle-identity discovery. Always returns at least
 * `{ jsBundleSource, jsEngine }`.
 *
 * Priority for `jsBundleId`:
 *   1. Consumer override (`overrideBundleId`) → source 'global'
 *   2. Expo Updates `updateId`                → source 'expo'
 *   3. Build-time global `__CONVIVA_BUNDLE_ID__` → source 'global'
 *   4. None → source 'embedded' (no jsBundleId)
 *
 * Never throws — on any failure it returns the embedded base record.
 */
function discoverSync(overrideBundleId) {
    const record = {
        jsBundleSource: 'embedded',
        jsEngine: detectJsEngine(),
    };
    // First source to resolve a non-empty id wins; otherwise the embedded base
    // record is returned. safeCall keeps the whole resolution fail-silent.
    const resolved = safeCall(() => {
        const sources = [
            () => resolveOverrideId(overrideBundleId),
            resolveExpoId,
            resolveGlobalId,
        ];
        for (const source of sources) {
            const hit = source();
            if (hit !== undefined) {
                return hit;
            }
        }
        return undefined;
    }, undefined);
    if (resolved !== undefined) {
        Object.assign(record, resolved);
    }
    return record;
}
/**
 * True when `discoverSync` resolved a real bundle id (i.e. anything other than
 * the `embedded` fallback). Used by the init wiring to decide whether the async
 * CodePush probe is allowed to write — a higher-priority sync source must not
 * be clobbered by a later CodePush resolution.
 */
function hasResolvedBundleId(record) {
    return record.jsBundleSource !== 'embedded';
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Shared no-op used as a .catch handler so per-call arrow closures don't
 *  inflate this file's cyclomatic complexity (D7 — swallow rejections). */
const swallow = () => { };
/**
 * Phase 2 of `wireJsBundleInfo`: awaits the async CodePush probe and forwards
 * the result. Fully fail-silent (D7).
 */
async function forwardCodePushBundleInfo() {
    try {
        const asyncInfo = await discoverAsync();
        if (asyncInfo !== null) {
            await setJsBundleInfo$1('CAT', asyncInfo);
        }
    }
    catch {
        // D7 — async bundle-info forwarding must never throw.
    }
}
/**
 * Discovers the JS bundle identity (source / id / channel / label / engine) and
 * forwards it to the native SDK via `setJsBundleInfo` so it is attached to the
 * Conviva app-context entity on every subsequent event (D16 / §7A.5).
 *
 * Two-phase, fully fail-silent (D7):
 *  - Phase 1 (synchronous): consumer override → Expo Updates → build-time global
 *    → embedded. Forwarded immediately.
 *  - Phase 2 (async, fire-and-forget): CodePush native module `getUpdateMetadata(0)`.
 *    when Phase 1 did NOT already resolve a higher-priority id, so a later
 *    CodePush resolution cannot clobber a consumer/Expo/global value.
 */
function wireJsBundleInfo(initConfig) {
    try {
        const etConfig = initConfig.errorTracking;
        const overrideId = typeof etConfig === 'object' ? etConfig.bundleId : undefined;
        // Phase 1 — synchronous.
        const syncInfo = discoverSync(overrideId);
        setJsBundleInfo$1('CAT', syncInfo).catch(swallow);
        // Phase 2 — only if Phase 1 didn't already resolve a higher-priority id.
        if (!hasResolvedBundleId(syncInfo)) {
            forwardCodePushBundleInfo().catch(swallow);
        }
    }
    catch {
        // D7 — bundle-info discovery must never break tracker setup.
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Create a tracker from specified initial configuration.
 *
 * @param initConfig - The initial tracker configuration
 * @returns A promise fulfilled if the tracker is initialized
 */
function createTracker$1(initConfig) {
    return initValidate(initConfig)
        .then(() => RNConvivaTracker.createTracker(initConfig))
        .then(() => { setIsInitialised(true); })
        .then(() => wireErrorTracking(initConfig))
        .then(() => wireJsBundleInfo(initConfig))
        .catch((error) => {
        setIsInitialised(false);
        throw new Error(`${logMessages.createTracker} ${error.message}.`);
    });
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
function ensureErrorTrackerTeardown() {
    try {
        errorTracker.teardown();
    }
    catch { /* fail-silent */ }
}
/**
 * Removes the tracker with given namespace.
 *
 * @param trackerNamespace - The tracker namespace
 * @returns A boolean promise
 */
function removeTracker$1(trackerNamespace) {
    if (typeof trackerNamespace !== 'string') {
        return Promise.reject(new Error(logMessages.removeTracker));
    }
    if (!getIsInitialised()) {
        return Promise.reject(new Error(logMessages.createTrackerNotSet));
    }
    setIsInitialised(false);
    return Promise.resolve(RNConvivaTracker.removeTracker({ tracker: trackerNamespace }));
}
/**
 * Removes all existing trackers.
 *
 * @returns A void promise
 */
function removeAllTrackers$1() {
    if (!getIsInitialised()) {
        return Promise.reject(new Error(logMessages.createTrackerNotSet));
    }
    teardownRemoteConfigSync();
    ensureErrorTrackerTeardown();
    return Promise.resolve(RNConvivaTracker.removeAllTrackers());
}
/**
 * Cleanup.
 *
 * @returns A void promise
 */
function cleanup$1() {
    teardownRemoteConfigSync();
    ensureErrorTrackerTeardown();
    return Promise.resolve(RNConvivaTracker.cleanup());
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** True when `part` is a non-empty numeric string. */
function isNumericPart(part) {
    return part !== '' && !isNaN(Number(part));
}
/** True when `clid` is the dot-separated four-numeric-parts format. */
function isValidClientId(clid) {
    if (!clid) {
        return false;
    }
    const parts = clid.split('.');
    if (parts.length !== 4) {
        return false;
    }
    return parts.every(isNumericPart);
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/** Throws an Error tagged with logMessages.getClientId — extracted so the
 *  `.catch` arrow on getClientId stays a single bare expression. */
function reThrowGetClientIdError(error) {
    throw new Error(`${logMessages.getClientId} ${error.message}.`);
}
/**
 * Get the client id which is in prescribed format.
 *
 * @returns A promise string if the client id is available or generated
 */
function getClientId$1() {
    return Promise.resolve(RNConvivaTracker.getClientId())
        .catch(reThrowGetClientIdError);
}
/**
 * Set the client id which is in the prescribed format.
 *
 * @param clid - client id generated for the application in the device
 * @returns A promise fulfilled if the client id is valid
 */
function setClientId$1(clid) {
    if (!isValidClientId(clid)) {
        return Promise.reject(new Error(logMessages.setClientId));
    }
    return Promise.resolve(RNConvivaTracker.setClientId({ clientId: clid }));
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Higher-order wrapper that rejects every call with `createTrackerNotSet`
 * until `getIsInitialised()` returns true. Collapses the duplicate
 * `if (!isTrackerInitialised) return Promise.reject(...)` block that opened
 * every wrapper in the original api.ts.
 */
function requireInit(fn) {
    return (...args) => {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return fn(...args);
    };
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Returns a function to pass JS bundle identity fields to the native SDK.
 *
 * @param namespace - The tracker namespace
 * @returns A function that accepts a bundle-info map and returns a Promise
 */
function setJsBundleInfo(namespace) {
    return requireInit((info) => setJsBundleInfo$1(namespace, info));
}
/**
 * Returns a function to track a manual error event. Mirrors the curry shape
 * of every other track* API for consistency with the createTracker() wiring.
 */
function trackError$1(namespace) {
    return requireInit((argmap, contexts = []) => trackError$2(namespace, argmap, contexts));
}

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
/**
 * Start session replay on the current screen.
 * Call after navigating away from a WebView to start capture.
 *
 * @returns - A void promise
 */
function startReplay$1() {
    // On tvOS the native module does not export startReplay (#if !TARGET_OS_TV),
    // so the method will be undefined. Resolve as a no-op to avoid a runtime throw.
    if (typeof RNConvivaTracker.startReplay !== 'function') {
        return Promise.resolve();
    }
    return Promise.resolve(RNConvivaTracker.startReplay())
        .catch((error) => {
        throw new Error(`startReplay failed: ${error.message}`);
    });
}
/**
 * Stop session replay (e.g. before showing a WebView).
 *
 * @returns - A void promise
 */
function stopReplay$1() {
    // On tvOS the native module does not export stopReplay (#if !TARGET_OS_TV),
    // so the method will be undefined. Resolve as a no-op to avoid a runtime throw.
    if (typeof RNConvivaTracker.stopReplay !== 'function') {
        return Promise.resolve();
    }
    return Promise.resolve(RNConvivaTracker.stopReplay())
        .catch((error) => {
        throw new Error(`stopReplay failed: ${error.message}`);
    });
}
/**
 * Returns a function to track a SelfDescribing event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a SelfDescribing event
 */
function trackSelfDescribingEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackSelfDescribingEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track a ScreenView event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a ScreenView event
 */
function trackScreenViewEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackScreenViewEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track a Structured event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a Structured event
 */
function trackStructuredEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackStructuredEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track a PageView event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a PageView event
 */
function trackPageView(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackPageView$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track a Timing event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a Timing event
 */
function trackTimingEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackTimingEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track a ConsentGranted event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a ConsentGranted event
 */
function trackConsentGrantedEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackConsentGrantedEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track a ConsentWithdrawn event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a ConsentWithdrawn event
 */
function trackConsentWithdrawnEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackConsentWithdrawnEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track an EcommerceTransaction event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track an EcommerceTransaction event
 */
function trackEcommerceTransactionEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackEcommerceTransactionEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track an DeepLinkReceived event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track an DeepLinkReceived event
 */
function trackDeepLinkReceivedEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackDeepLinkReceivedEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track an MessageNotification event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track an MessageNotification event
 */
function trackMessageNotificationEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackMessageNotificationEvent$1(namespace, argmap, contexts);
    };
}
/**
 * Returns a function to track an MessageNotification event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track an MessageNotification event
 */
function trackCustomEvent(namespace) {
    return function (eventName, eventData, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackCustomEvent$1(namespace, eventName, eventData, contexts);
    };
}
/**
 * Returns a function to track a RevenueEvent by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a RevenueEvent
 */
function trackRevenueEvent(namespace) {
    return function (argmap, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackRevenueEvent$1(namespace, argmap, contexts);
    };
}
function setCustomTags(namespace) {
    return function (tags, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return setCustomTags$1(namespace, tags, contexts);
    };
}
function setCustomTagsWithCategory(namespace) {
    return function (category, tags, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return setCustomTagsWithCategory$1(namespace, category, tags, contexts);
    };
}
function clearCustomTags(namespace) {
    return function (tagKeys, contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return clearCustomTags$1(namespace, tagKeys, contexts);
    };
}
function clearAllCustomTags(namespace) {
    return function (contexts = []) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return clearAllCustomTags$1(namespace, contexts);
    };
}
/**
 * Returns a function to remove global contexts by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to remove global contexts
 */
function removeGlobalContexts(namespace) {
    return function (tag) {
        if (typeof tag !== 'string') {
            return Promise.reject(new Error(`${logMessages.removeGlobalContexts} ${logMessages.gcTagType}`));
        }
        return Promise.resolve(RNConvivaTracker.removeGlobalContexts({ tracker: namespace, removeTag: tag }));
    };
}
/**
 * Returns a function to add global contexts by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to add global contexts
 */
function addGlobalContexts(namespace) {
    return function (gc) {
        if (!isValidGC(gc)) {
            return Promise.reject(new Error(`${logMessages.addGlobalContexts} ${logMessages.gcType}`));
        }
        return Promise.resolve(RNConvivaTracker.addGlobalContexts({ tracker: namespace, addGlobalContext: gc }));
    };
}
/**
 * Returns a function to set the subject userId
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the userId
 */
function setUserId(namespace) {
    return function (newUid) {
        return setUserId$1(namespace, newUid);
    };
}
/**
 * Returns a function to set the subject networkUserId
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the networkUserId
 */
function setNetworkUserId(namespace) {
    return function (newNuid) {
        return setNetworkUserId$1(namespace, newNuid);
    };
}
/**
 * Returns a function to set the subject domainUserId
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the domainUserId
 */
function setDomainUserId(namespace) {
    return function (newDuid) {
        return setDomainUserId$1(namespace, newDuid);
    };
}
/**
 * Returns a function to set the subject ipAddress
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the ipAddress
 */
function setIpAddress(namespace) {
    return function (newIp) {
        return setIpAddress$1(namespace, newIp);
    };
}
/**
 * Returns a function to set the subject useragent
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the useragent
 */
function setUseragent(namespace) {
    return function (newUagent) {
        return setUseragent$1(namespace, newUagent);
    };
}
/**
 * Returns a function to set the subject timezone
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the timezone
 */
function setTimezone(namespace) {
    return function (newTz) {
        return setTimezone$1(namespace, newTz);
    };
}
/**
 * Returns a function to set the subject language
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the language
 */
function setLanguage(namespace) {
    return function (newLang) {
        return setLanguage$1(namespace, newLang);
    };
}
/**
 * Returns a function to set the subject screenResolution
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the screenResolution
 */
function setScreenResolution(namespace) {
    return function (newRes) {
        return setScreenResolution$1(namespace, newRes);
    };
}
/**
 * Returns a function to set the subject screenViewport
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the screenViewport
 */
function setScreenViewport(namespace) {
    return function (newView) {
        return setScreenViewport$1(namespace, newView);
    };
}
/**
 * Returns a function to set the subject colorDepth
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set the colorDepth
 */
function setColorDepth(namespace) {
    return function (newColorD) {
        return setColorDepth$1(namespace, newColorD);
    };
}
/**
 * Returns a function to set subject data
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to set subject data
 */
function setSubjectData(namespace) {
    return function (config) {
        return setSubjectData$1(namespace, config);
    };
}
/**
 * Returns a function to get the current session userId
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to get the session userId
 */
function getSessionUserId(namespace) {
    return function () {
        return Promise
            .resolve(RNConvivaTracker.getSessionUserId({ tracker: namespace }));
    };
}
/**
 * Returns a function to get the current sessionId
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to get the sessionId
 */
function getSessionId(namespace) {
    return function () {
        return Promise
            .resolve(RNConvivaTracker.getSessionId({ tracker: namespace }));
    };
}
/**
 * Returns a function to get the current session index
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to get the session index
 */
function getSessionIndex(namespace) {
    return function () {
        return Promise
            .resolve(RNConvivaTracker.getSessionIndex({ tracker: namespace }));
    };
}
/**
 * Returns a function to get whether the app is in background
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to get whether the app isInBackground
 */
function getIsInBackground(namespace) {
    return function () {
        return Promise
            .resolve(RNConvivaTracker.getIsInBackground({ tracker: namespace }));
    };
}
/**
 * Returns a function to get the background index
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to get the backgroundIndex
 */
function getBackgroundIndex(namespace) {
    return function () {
        return Promise
            .resolve(RNConvivaTracker.getBackgroundIndex({ tracker: namespace }));
    };
}
/**
 * Returns a function to get the foreground index
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to get the foregroundIndex
 */
function getForegroundIndex(namespace) {
    return function () {
        return Promise
            .resolve(RNConvivaTracker.getForegroundIndex({ tracker: namespace }));
    };
}
/**
 * Returns a function to track click event.
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track click event
 */
function trackClickEvent(namespace) {
    return function (eventData) {
        if (!getIsInitialised()) {
            return Promise.reject(new Error(logMessages.createTrackerNotSet));
        }
        return trackClickEvent$1(namespace, eventData);
    };
}

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
function forEachTracker(trackers, iterator) {
    if (trackers && trackers.length > 0) {
        trackers.forEach(iterator);
    }
    else {
        iterator(null);
    }
}
/**
 * Enables tracking events from apps rendered in react-native-webview components.
 * The apps need to use the Conviva WebView tracker to track the events.
 *
 * To subscribe for the events, set the `onMessage` attribute:
 * <WebView onMessage={getWebViewCallback()} ... />
 *
 * @returns Callback to subscribe for events from Web views tracked using the Conviva WebView tracker.
 */
function getWebViewCallback() {
    return (message) => {
        const data = JSON.parse(message.nativeEvent.data);
        switch (data.command) {
            case 'trackSelfDescribingEvent':
                forEachTracker(data.trackers, (namespace) => {
                    trackSelfDescribingEvent$1(namespace, data.event, data.context || []).catch((error) => {
                        errorHandler(error);
                    });
                });
                break;
            case 'trackStructEvent':
                forEachTracker(data.trackers, (namespace) => {
                    trackStructuredEvent$1(namespace, data.event, data.context || []).catch((error) => {
                        errorHandler(error);
                    });
                });
                break;
            case 'trackPageView':
                forEachTracker(data.trackers, (namespace) => {
                    const event = data.event;
                    trackPageView$1(namespace, {
                        pageTitle: event.title ?? '',
                        pageUrl: event.url ?? '',
                        referrer: event.referrer,
                    }).catch((error) => {
                        errorHandler(error);
                    });
                });
                break;
            case 'trackScreenView':
                forEachTracker(data.trackers, (namespace) => {
                    trackScreenViewEvent$1(namespace, data.event, data.context || []).catch((error) => {
                        errorHandler(error);
                    });
                });
                break;
        }
    };
}

const logError = (message, error, quiet = false) => {
    const logger = quiet ? console.log : console.warn;
    if (error instanceof Error) {
        // KLUDGE: These properties don't show up if you `console.warn` the error object directly.
        logger(message, {
            name: error.name,
            message: error.message,
            stack: error.stack,
        });
    }
    else {
        logger(message, {
            message: String(error),
        });
    }
};
const handleError = (fn, name = '', quiet = false) => {
    return (...args) => {
        try {
            return fn(...args);
        }
        catch (e) {
            logError(name ? `Conviva: ${name} failed with an error.` : 'Conviva SDK encountered an error while tracking.', e, quiet);
        }
    };
};

const getComponentDisplayName = WrappedComponent => {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
};

const getCompTargetText = (comp) => {
    return getTargetText(getReactInternalFiber(comp));
};
const getReactInternalFiber = (comp) => {
    return comp._reactInternals || comp._reactInternalFiber || comp._fiber || comp._internalFiberInstanceHandleDEV;
};
const getTargetText = fiberNode => {
    if (fiberNode.type === 'RCTText') {
        return fiberNode.memoizedProps.children;
    }
    // In some cases, target text may not be within an 'RCTText' component. This has only been
    // observed in unit tests with Enzyme, but may still be a possibility in real RN apps.
    if (fiberNode.memoizedProps &&
        typeof fiberNode.memoizedProps.children === 'string') {
        return fiberNode.memoizedProps.children;
    }
    if (fiberNode.child === null) {
        return '';
    }
    const children = [];
    let currChild = fiberNode.child;
    while (currChild) {
        children.push(currChild);
        currChild = currChild.sibling;
    }
    let targetText = '';
    children.forEach(child => {
        targetText = (targetText + ' ' + getTargetText(child)).trim();
    });
    return targetText;
};

// @ts-nocheck
var __rest = (undefined) || function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, q = Object.getOwnPropertySymbols(s); i < q.length; i++) {
            if (e.indexOf(q[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, q[i]))
                t[q[i]] = s[q[i]];
        }
    return t;
};
const convivaAutotrackPress = trackHandler => (_eventType, componentThis, _event) => {
    if (componentThis) {
        let data = { "elementId": componentThis.id, "elementClasses": componentThis.displayName, "elementType": componentThis.elementType, "elementText": getCompTargetText(componentThis) };
        // console.log("trackHandler data",data);
        trackHandler(data);
    }
};
const convivaTouchableAutoTrack = (track) => TouchableComponent => {
    class ConvivaTouchableAutoTrack extends React.Component {
        render() {
            const _a = this.props, { forwardedRef, onPress, onLongPress } = _a, rest = __rest(_a, ["forwardedRef", "onPress", "onLongPress"]);
            return (React.createElement(TouchableComponent, Object.assign({ ref: forwardedRef, onPress: e => {
                    handleError(convivaAutotrackPress(track))('touchableHandlePress', this, e);
                    onPress && onPress(e);
                }, onLongPress: e => {
                    handleError(convivaAutotrackPress(track))('touchableHandleLongPress', this, e);
                    onLongPress && onLongPress(e);
                } }, rest), this.props.children));
        }
    }
    ConvivaTouchableAutoTrack.displayName = `convivaTouchableAutoTrack(${getComponentDisplayName(TouchableComponent)})`;
    // console.log("ConvivaTouchableAutoTrack.displayName",ConvivaTouchableAutoTrack.displayName);
    const forwardRefHoc = React.forwardRef((props, ref) => {
        return React.createElement(ConvivaTouchableAutoTrack, Object.assign({}, props, { forwardedRef: ref }));
    });
    hoistNonReactStatic(forwardRefHoc, TouchableComponent);
    return forwardRefHoc;
};

class DisplayNameTest {
    render() { }
}
let warningGiven = false;
const checkDisplayNamePlugin = () => {
    // @ts-ignore
    if (!DisplayNameTest.displayName && !warningGiven) {
        console.warn('Conviva: Display names are not available');
        warningGiven = true;
    }
};

class NavigationUtil {
    // :TODO: (jmtaber129): Add typing for this ref.
    static convivaNavRef;
    static setNavigationRef(ref) {
        this.convivaNavRef = ref;
    }
    static getScreenPropsForCurrentRoute() {
        let rootState = null;
        if (this.convivaNavRef && this.convivaNavRef.state && this.convivaNavRef.state.nav) {
            rootState = this.convivaNavRef.state.nav;
        }
        else if (this.convivaNavRef && this.convivaNavRef.getRootState) {
            rootState = this.convivaNavRef.getRootState();
        }
        if (rootState == null) {
            return null;
        }
        const routeProps = this.getActiveRouteProps(rootState);
        if (routeProps) {
            return routeProps;
        }
        return null;
    }
    static isHocEnabled() {
        return !!this.convivaNavRef;
    }
    // :TODO: (jmtaber129): Add type for navigationState.
    static getActiveRouteProps(navigationState) {
        const paths = this.getActiveRouteNames(navigationState);
        return {
            screen_path: paths.join('::'),
            screen_name: paths[paths.length - 1] ?? '',
        };
    }
    // Returns an array of route names, with the root name first, and the most nested name last.
    static getActiveRouteNames(navigationState) {
        const route = navigationState.routes[navigationState.index];
        // Dive into nested navigators.
        let paths;
        if (route.routes) {
            paths = this.getActiveRouteNames(route);
        }
        else if (route.state && route.state.routes) {
            paths = this.getActiveRouteNames(route.state);
        }
        const routeName = route.routeName || route.name;
        if (paths) {
            return [routeName].concat(paths);
        }
        return [routeName];
    }
}

const version = "0.5.0";

const { Platform } = require('react-native');
let reactNativeVersionString = null;
if (Platform && Platform.constants && Platform.constants.reactNativeVersion) {
    const { major, minor, patch } = Platform.constants.reactNativeVersion;
    reactNativeVersionString = `${major}.${minor}.${patch}`;
}
const getMetadataProps = () => {
    return {
        source_version: version,
        is_using_react_navigation_hoc: NavigationUtil.isHocEnabled(),
        react_native_version: reactNativeVersionString,
    };
};

const getContextualProps = () => {
    return _.merge({}, getMetadataProps(), { name: NavigationUtil.getScreenPropsForCurrentRoute()?.screen_name
        // , id:NavigationUtil.getScreenPropsForCurrentRoute()?.screen_path
    });
};

// const EVENT_TYPE = 'react_navigation_screenview';
// const INITIAL_ROUTE_TYPE = 'Conviva_Navigation/INITIAL';
const withReactNavigationAutotrack = track => AppContainer => {
    const wrapperObject = {};
    const existingWrapper = wrapperObject.__convivaWrapper;
    if (existingWrapper) {
        return existingWrapper;
    }
    const captureOldNavigationStateChange = handleError((prev, next) => {
        const { screen_path: prevScreenRoute } = NavigationUtil.getActiveRouteProps(prev);
        const { screen_path: nextScreenRoute } = NavigationUtil.getActiveRouteProps(next);
        if (prevScreenRoute !== nextScreenRoute) {
            track({
                ...getContextualProps(),
            });
        }
    }, 'Navigation event capture', true);
    class ConvivaNavigationWrapper extends React__default.Component {
        constructor(props) {
            super(props);
            this.topLevelNavigator = null;
            this.currentPath = null;
        }
        setRef(ref, value) {
            if (typeof ref === 'function') {
                ref(value);
            }
            else if (ref !== null) {
                ref.current = value;
            }
        }
        captureStateChange = handleError(state => {
            const { screen_path: nextPath } = NavigationUtil.getActiveRouteProps(state);
            if (nextPath !== this.currentPath) {
                track({
                    previousName: this.currentPath || "",
                    ...getContextualProps()
                });
            }
            this.currentPath = nextPath;
        }, 'Navigation event capture', true);
        captureOnReady = handleError(() => {
            if (this.topLevelNavigator.getRootState) {
                this.trackInitialRouteForState(this.topLevelNavigator.getRootState());
                const { screen_path: currentPath } = NavigationUtil.getActiveRouteProps(this.topLevelNavigator.getRootState());
                this.currentPath = currentPath;
            }
        }, 'Navigation event capture', true);
        trackInitialRouteForState(_) {
            // const { screen_path: initialPageviewPath } = NavigationUtil.getActiveRouteProps(navigationState);
            track({
                ...getContextualProps()
            });
        }
        render() {
            try {
                return this._render();
            }
            catch (e) {
                logError('Conviva: Failed to render React Navigation wrapper.', e);
                const { forwardedRef, ...rest } = this.props;
                return React__default.createElement(AppContainer, { ref: forwardedRef, ...rest });
            }
        }
        _render() {
            const { forwardedRef, onNavigationStateChange, onStateChange, onReady, ...rest } = this.props;
            return React__default.createElement(AppContainer, {
                ref: handleError((navigatorRef) => {
                    this.setRef(forwardedRef, navigatorRef);
                    NavigationUtil.setNavigationRef(navigatorRef);
                    if (this.topLevelNavigator !== navigatorRef &&
                        navigatorRef !== null) {
                        this.topLevelNavigator = navigatorRef;
                        if (this.topLevelNavigator.state) {
                            this.trackInitialRouteForState(this.topLevelNavigator.state.nav);
                        }
                    }
                }, 'Navigation event capture', true),
                onReady: (...args) => {
                    this.captureOnReady();
                    if (typeof onReady === 'function') {
                        onReady(...args);
                    }
                },
                onStateChange: (...args) => {
                    this.captureStateChange(...args);
                    if (typeof onStateChange === 'function') {
                        onStateChange(...args);
                    }
                },
                onNavigationStateChange: (...args) => {
                    captureOldNavigationStateChange(...args);
                    if (typeof onNavigationStateChange === 'function') {
                        onNavigationStateChange(...args);
                    }
                },
                ...rest,
            }, this.props.children);
        }
    }
    ConvivaNavigationWrapper.displayName = `withReactNavigationAutotrack(${getComponentDisplayName(AppContainer)})`;
    wrapperObject.__convivaWrapper = React__default.forwardRef((props, ref) => {
        return React__default.createElement(ConvivaNavigationWrapper, { ...props, forwardedRef: ref });
    });
    return wrapperObject.__convivaWrapper;
};

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * Returns true when any element in `next` has changed relative to `prev`,
 * using same-value-zero equality (Object.is). Length changes also trigger true.
 */
function resetKeysChanged(prev, next) {
    if (prev.length !== next.length) {
        return true;
    }
    for (let i = 0; i < prev.length; i++) {
        if (!Object.is(prev[i], next[i])) {
            return true;
        }
    }
    return false;
}
/**
 * React error boundary that forwards caught render/commit errors to the
 * Conviva error tracker with `errorSource: 'errorBoundary'`.
 *
 * Design notes:
 *  - Marks the error object in the tracker's DedupGuard BEFORE dispatch so
 *    the global handler (if the error re-throws up the tree) does not send
 *    the same error twice.
 *  - Reset keys mirror the well-known react-error-boundary prop contract.
 */
class ConvivaErrorBoundary extends React.Component {
    state = { error: null, enabled: ConvivaErrorBoundary.readEnabled() };
    /** Cleanup for the enable-state subscription; set in componentDidMount. */
    unsubscribeEnabled = null;
    /** Reads the tracker enable flag defensively (never throws). */
    static readEnabled() {
        // Default to enabled so the boundary keeps protecting the tree if the
        // tracker is in an unexpected state.
        return safeCall(() => errorTracker.isEnabled(), true);
    }
    // `getDerivedStateFromError` cannot read instance/tracker state, so it always
    // records the error; the enable gate is applied in render() (pass-through
    // when disabled) and in componentDidCatch (reporting suppressed when disabled).
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidMount() {
        // fail-silent — subscription failure must not break the boundary.
        runSafely(() => {
            // Re-sync in case enable-state changed between field init and mount, then
            // subscribe for runtime (remote-config-driven) toggles.
            const current = ConvivaErrorBoundary.readEnabled();
            if (current !== this.state.enabled) {
                this.setState({ enabled: current });
            }
            this.unsubscribeEnabled = errorTracker.onEnabledChange((enabled) => {
                this.setState({ enabled });
            });
        });
    }
    componentWillUnmount() {
        runSafely(() => {
            if (this.unsubscribeEnabled !== null) {
                this.unsubscribeEnabled();
                this.unsubscribeEnabled = null;
            }
        });
    }
    componentDidCatch(error, info) {
        // When error tracking is disabled, the boundary does not intercept: skip
        // dedup-marking and dispatch entirely (render() rethrows to delegate the
        // error to a parent boundary). The consumer onError hook is still honoured.
        if (ConvivaErrorBoundary.readEnabled()) {
            runSafely(() => {
                const dedup = errorTracker._getDedupGuard();
                dedup.markSeen(error);
                errorTracker._dispatch({
                    error,
                    errorSource: 'errorBoundary',
                    isFatal: false,
                    isHandled: true,
                    componentStack: info.componentStack || undefined,
                    extraAttributes: this.props.name !== undefined ? { boundary: this.props.name } : undefined,
                });
            });
        }
        if (typeof this.props.onError === 'function') {
            // consumer callback threw — swallow
            runSafely(() => this.props.onError(error, info.componentStack));
        }
    }
    componentDidUpdate(prevProps) {
        if (this.state.error === null) {
            return;
        }
        const prevKeys = prevProps.resetKeys;
        const nextKeys = this.props.resetKeys;
        if (prevKeys == null || nextKeys == null) {
            return;
        }
        if (resetKeysChanged(prevKeys, nextKeys)) {
            this.reset();
        }
    }
    reset = () => {
        this.setState({ error: null });
    };
    render() {
        const { error, enabled } = this.state;
        if (error === null) {
            return this.props.children;
        }
        // Disabled (e.g. remote config turned error tracking off): do not intercept.
        // Rethrowing during this boundary's own render delegates the error to the
        // nearest parent boundary, so the boundary behaves as if it were absent.
        // Strict `=== false` so an unset enabled (default true) keeps protecting.
        if (enabled === false) {
            throw error;
        }
        const { fallback } = this.props;
        if (typeof fallback === 'function') {
            return fallback({ error, reset: this.reset });
        }
        if (fallback !== undefined) {
            return fallback;
        }
        return null;
    }
}

/*
 * Copyright (c) 2020-2026 Conviva Inc. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 */
/**
 * In-memory bridge adapter used for unit / integration tests and the DemoApp
 * manual-test harness. Collects every payload the error tracker would have
 * sent to native so tests can assert on structure and ordering.
 */
class MockBridgeAdapter {
    payloads = [];
    isAvailable() {
        return true;
    }
    reportJsError(payload) {
        this.payloads.push(payload);
    }
    /** Clears captured payloads. Useful between tests. */
    clear() {
        this.payloads = [];
    }
}

/*
 * Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
/**
 * Creates a React Native Tracker object
 *
 * @param customerKey {string} - The Conviva customer key for the application
 * @param appName {string} - The application name reported with events
 * @param controllerConfig {TrackerControllerConfiguration} - Optional tracker controller configuration
 * @returns The tracker object
 */
function createTracker(customerKey, appName, 
// networkConfig: NetworkConfiguration,
controllerConfig = {}) {
    // initTrackerPromise
    const initTrackerPromise = Promise.resolve(createTracker$1({
        customerKey,
        appName,
        ...controllerConfig
    }));
    // mkMethod creates methods subscribed to the initTrackerPromise
    const mkMethod = safeWait(initTrackerPromise, errorHandler);
    // mkMethodAlwaysLog creates methods that always log errors, regardless of __DEV__
    const mkMethodAlwaysLog = safeWait(initTrackerPromise, (err) => errorHandler(err, true));
    // mkCallback creates callbacks subscribed to the initTrackerPromise
    const mkCallback = safeWaitCallback(initTrackerPromise, errorHandler);
    // track methods
    const namespace = "CAT"; //default namespace is "CAT"
    const trackSelfDescribingEvent$1 = mkMethod(trackSelfDescribingEvent(namespace));
    const trackScreenViewEvent$1 = mkMethod(trackScreenViewEvent(namespace));
    const trackStructuredEvent$1 = mkMethod(trackStructuredEvent(namespace));
    const trackPageView$1 = mkMethod(trackPageView(namespace));
    const trackTimingEvent$1 = mkMethod(trackTimingEvent(namespace));
    const trackConsentGrantedEvent$1 = mkMethod(trackConsentGrantedEvent(namespace));
    const trackConsentWithdrawnEvent$1 = mkMethod(trackConsentWithdrawnEvent(namespace));
    const trackEcommerceTransactionEvent$1 = mkMethod(trackEcommerceTransactionEvent(namespace));
    const trackDeepLinkReceivedEvent$1 = mkMethod(trackDeepLinkReceivedEvent(namespace));
    const trackMessageNotificationEvent$1 = mkMethod(trackMessageNotificationEvent(namespace));
    const trackCustomEvent$1 = mkMethod(trackCustomEvent(namespace));
    const trackRevenueEvent$1 = mkMethodAlwaysLog(trackRevenueEvent(namespace));
    const trackClickEvent$1 = mkMethod(trackClickEvent(namespace));
    // trackError uses mkMethodAlwaysLog so misconfigured error paths surface
    // even in production builds — the whole point of error reporting.
    const trackError = mkMethodAlwaysLog(trackError$1(namespace));
    const setJsBundleInfo$1 = mkMethod(setJsBundleInfo(namespace));
    // custom tags contexts
    const setCustomTags$1 = mkMethod(setCustomTags(namespace));
    const setCustomTagsWithCategory$1 = mkMethod(setCustomTagsWithCategory(namespace));
    const clearCustomTags$1 = mkMethod(clearCustomTags(namespace));
    const clearAllCustomTags$1 = mkMethod(clearAllCustomTags(namespace));
    // Global Contexts
    const removeGlobalContexts$1 = mkMethod(removeGlobalContexts(namespace));
    const addGlobalContexts$1 = mkMethod(addGlobalContexts(namespace));
    // setters
    const setUserId$1 = mkMethod(setUserId(namespace));
    const setNetworkUserId$1 = mkMethod(setNetworkUserId(namespace));
    const setDomainUserId$1 = mkMethod(setDomainUserId(namespace));
    const setIpAddress$1 = mkMethod(setIpAddress(namespace));
    const setUseragent$1 = mkMethod(setUseragent(namespace));
    const setTimezone$1 = mkMethod(setTimezone(namespace));
    const setLanguage$1 = mkMethod(setLanguage(namespace));
    const setScreenResolution$1 = mkMethod(setScreenResolution(namespace));
    const setScreenViewport$1 = mkMethod(setScreenViewport(namespace));
    const setColorDepth$1 = mkMethod(setColorDepth(namespace));
    const setSubjectData$1 = mkMethod(setSubjectData(namespace));
    // callbacks
    const getSessionUserId$1 = mkCallback(getSessionUserId(namespace));
    const getSessionId$1 = mkCallback(getSessionId(namespace));
    const getSessionIndex$1 = mkCallback(getSessionIndex(namespace));
    const getIsInBackground$1 = mkCallback(getIsInBackground(namespace));
    const getBackgroundIndex$1 = mkCallback(getBackgroundIndex(namespace));
    const getForegroundIndex$1 = mkCallback(getForegroundIndex(namespace));
    return Object.freeze({
        trackSelfDescribingEvent: trackSelfDescribingEvent$1,
        trackScreenViewEvent: trackScreenViewEvent$1,
        trackStructuredEvent: trackStructuredEvent$1,
        trackPageView: trackPageView$1,
        trackTimingEvent: trackTimingEvent$1,
        trackConsentGrantedEvent: trackConsentGrantedEvent$1,
        trackConsentWithdrawnEvent: trackConsentWithdrawnEvent$1,
        trackEcommerceTransactionEvent: trackEcommerceTransactionEvent$1,
        trackDeepLinkReceivedEvent: trackDeepLinkReceivedEvent$1,
        trackMessageNotificationEvent: trackMessageNotificationEvent$1,
        trackCustomEvent: trackCustomEvent$1,
        trackRevenueEvent: trackRevenueEvent$1,
        setCustomTags: setCustomTags$1,
        setCustomTagsWithCategory: setCustomTagsWithCategory$1,
        clearCustomTags: clearCustomTags$1,
        clearAllCustomTags: clearAllCustomTags$1,
        removeGlobalContexts: removeGlobalContexts$1,
        addGlobalContexts: addGlobalContexts$1,
        setUserId: setUserId$1,
        setNetworkUserId: setNetworkUserId$1,
        setDomainUserId: setDomainUserId$1,
        setIpAddress: setIpAddress$1,
        setUseragent: setUseragent$1,
        setTimezone: setTimezone$1,
        setLanguage: setLanguage$1,
        setScreenResolution: setScreenResolution$1,
        setScreenViewport: setScreenViewport$1,
        setColorDepth: setColorDepth$1,
        setSubjectData: setSubjectData$1,
        getSessionUserId: getSessionUserId$1,
        getSessionId: getSessionId$1,
        getSessionIndex: getSessionIndex$1,
        getIsInBackground: getIsInBackground$1,
        getBackgroundIndex: getBackgroundIndex$1,
        getForegroundIndex: getForegroundIndex$1,
        trackClickEvent: trackClickEvent$1,
        trackError,
        setJsBundleInfo: setJsBundleInfo$1,
    });
}
/**
 * Removes a tracker given its namespace
 *
 * @param trackerNamespace {string}
 * @returns - A boolean promise
 */
function removeTracker(trackerNamespace) {
    return removeTracker$1(trackerNamespace)
        .catch((e) => errorHandler(e));
}
/**
 * Removes all trackers
 *
 * @returns - A boolean promise
 */
function removeAllTrackers() {
    return removeAllTrackers$1()
        .catch((e) => errorHandler(e));
}
/**
 * Cleanup
 *
 * @returns - A boolean promise
 */
function cleanup() {
    return cleanup$1()
        .catch((e) => errorHandler(e));
}
/**
 * Gets the cliend id
 *
 * @returns - A string promise
 */
function getClientId() {
    return Promise.resolve(getClientId$1())
        .catch((e) => errorHandler(e));
}
/**
 * Sets the cliend id
 *
 * @param clientId {string}
 * @returns - A boolean promise
 */
function setClientId(clientId) {
    return Promise.resolve(setClientId$1(clientId))
        .catch((e) => errorHandler(e));
}
/**
 * Starts (or resumes) Conviva Session Replay capture for the current session.
 * Useful for resuming capture after it was paused via {@link stopReplay} —
 * for example, after dismissing a WebView, which cannot be captured.
 *
 * @returns - A void promise
 */
function startReplay() {
    return Promise.resolve(startReplay$1())
        .catch((e) => errorHandler(e));
}
/**
 * Pauses Conviva Session Replay capture for the current session.
 * Call before presenting content that should not be captured (e.g. a WebView),
 * then resume with {@link startReplay}.
 *
 * @returns - A void promise
 */
function stopReplay() {
    return Promise.resolve(stopReplay$1())
        .catch((e) => errorHandler(e));
}
const autocaptureNavigationTrack = handleError((payload) => {
    checkDisplayNamePlugin();
    trackScreenViewEvent('CAT')(payload).catch((e) => errorHandler(e));
}, 'Event autocapture', true);
// /**
//  * Returns a function to track click event.
//  *
//  * @param appContainer {AppContainer} - The root NavigationContainer of the application
//  * @returns - A function to track navigation event
//  */
// function withReactNavigationAutotrack(appContainer: any): Promise<any> {
//   return Promise.resolve(withReactNavigationAutotrack(autocaptureNavigationTrack(appContainer)))
//     .catch((error) => errorHandler(error));
// }
/**
 * Standalone top-level trackError that can be imported without a tracker
 * instance reference. Uses the default "CAT" namespace, mirroring the
 * tracker method created inside createTracker().
 *
 * Routing is driven by `argmap.isFatal`: fatal errors are reported through the
 * application-error pipeline (CRASH classification), while non-fatal errors are
 * reported as a dedicated non-fatal error event. Always resolves — failures are
 * swallowed so consumer flow is never disrupted.
 *
 * @param argmap {ErrorEventProps} - The error payload (message, stackTrace, isFatal, attributes, …)
 * @param contexts {EventContext[]} - Optional custom contexts attached to the event
 * @returns - A void promise
 */
function trackError(argmap, contexts = []) {
    return trackError$1('CAT')(argmap, contexts).catch((e) => errorHandler(e));
}
/**
 * Native manual-masking sentinel for Conviva Session Replay.
 *
 * Carried via the React Native `nativeID` prop on both Android and iOS.
 * The iOS replay SDK reads `nativeID` / `nativeId` directly from the view
 * (Paper / Fabric respectively), so no accessibility props are needed.
 * `nativeID` does not collide with E2E selectors (`testID`) or screen
 * readers (`accessibilityLabel`) and blocks view flattening without
 * requiring `collapsable: false`.
 */
const CR_NO_CAPTURE = 'cr-no-capture';
/**
 * Spread on the View or Text that holds sensitive content (Paper + Fabric):
 *   <Text {...crNoCaptureProps}>Secret</Text>
 *   <View {...crNoCaptureProps}><SensitiveBlock /></View>
 */
const crNoCaptureProps = { nativeID: CR_NO_CAPTURE };
const autocaptureTrack = handleError((payload) => {
    checkDisplayNamePlugin();
    trackClickEvent('CAT')(payload).catch((e) => errorHandler(e));
}, 'Event autocapture', true);
var index = {
    convivaTouchableAutoTrack: convivaTouchableAutoTrack(autocaptureTrack),
    withReactNavigationAutotrack: withReactNavigationAutotrack(autocaptureNavigationTrack)
};

export { CR_NO_CAPTURE, ConvivaErrorBoundary, MockBridgeAdapter, autocaptureNavigationTrack, cleanup, crNoCaptureProps, createTracker, index as default, errorTracker, getClientId, getWebViewCallback, removeAllTrackers, removeTracker, setClientId, startReplay, stopReplay, trackError, withReactNavigationAutotrack };
//# sourceMappingURL=conviva-react-native-appanalytics.js.map
