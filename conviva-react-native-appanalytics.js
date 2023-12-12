import { NativeModules } from 'react-native';
import * as React from 'react';
import hoistNonReactStatic from 'hoist-non-react-statics';
import 'lodash';

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
 */
function errorHandler(err) {
    if (__DEV__) {
        console.warn('ConvivaTracker:' + err.message);
        return undefined;
    }
    return undefined;
}
/**
 * Helper to check whether its argument is of object type
 *
 * @param x - The argument to check.
 * @returns - A boolean
 */
function isObject(x) {
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
    trackClickEvent: 'click event requires atleast one attribute',
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
};

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
    return isObject(sd)
        && typeof sd.schema === 'string'
        && isObject(sd.data);
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    if (isObject(item)
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
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
 * Validates a custom event
 *
 * @param argmap {Object} - the object to validate
 * @returns - boolean promise
 */
function validateCustomEvent(argmap) {
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
    }
    return Promise.resolve(true);
}
function validateCustomTags(argmap) {
    // validate type
    if (!isObject(argmap)) {
        return Promise.reject(new Error(logMessages.evType));
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
    if (!isObject(config)
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
    if (!isObject(config) || !isValidConfig(config, trackerProps)) {
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
    if (!isObject(config)
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
    if (!isObject(config) || !isValidConfig(config, emitterProps)) {
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
    if (!isObject(config) || !isValidConfig(config, subjectProps)) {
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
    if (!isObject(config)
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
    return isObject(gc)
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
 * Validates the RemoteConfig (remote config)
 *
 * @param config {Object} - the config to validate
 * @returns - boolean
 */
function isValidRemoteConf(config) {
    if (!isObject(config)
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
        throw new Error(`${logMessages.trackScreenView} ${error.message}`);
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
    return Promise.resolve(RNConvivaTracker.setUserId({
        tracker: namespace,
        userId: newUid
    }));
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
 * Create a tracker from specified initial configuration.
 *
 * @param initConfig {Object} - The initial tracker configuration
 * @returns - A promise fullfilled if the tracker is initialized
 */
function createTracker$1(initConfig) {
    return initValidate(initConfig)
        .then(() => RNConvivaTracker.createTracker(initConfig))
        .catch((error) => {
        throw new Error(`${logMessages.createTracker} ${error.message}.`);
    });
}
/**
 * Removes the tracker with given namespace
 *
 * @param trackerNamespace {string} - The tracker namespace
 * @returns - A boolean promise
 */
function removeTracker$1(trackerNamespace) {
    if (typeof trackerNamespace !== 'string') {
        return Promise.reject(new Error(logMessages.removeTracker));
    }
    return Promise.resolve(RNConvivaTracker.removeTracker({ tracker: trackerNamespace }));
}
/**
 * Removes all existing trackers
 *
 * @returns - A void promise
 */
function removeAllTrackers$1() {
    return Promise.resolve(RNConvivaTracker.removeAllTrackers());
}
/**
 * Returns a function to track a SelfDescribing event by a tracker
 *
 * @param namespace {string} - The tracker namespace
 * @returns - A function to track a SelfDescribing event
 */
function trackSelfDescribingEvent(namespace) {
    return function (argmap, contexts = []) {
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
        return trackCustomEvent$1(namespace, eventName, eventData, contexts);
    };
}
function setCustomTags(namespace) {
    return function (tags, contexts = []) {
        return setCustomTags$1(namespace, tags, contexts);
    };
}
function setCustomTagsWithCategory(namespace) {
    return function (category, tags, contexts = []) {
        return setCustomTagsWithCategory$1(namespace, category, tags, contexts);
    };
}
function clearCustomTags(namespace) {
    return function (tagKeys, contexts = []) {
        return clearCustomTags$1(namespace, tagKeys, contexts);
    };
}
function clearAllCustomTags(namespace) {
    return function (contexts = []) {
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
const handleError = (fn, name = null, quiet = false) => {
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

var __rest = (undefined) || function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, q = Object.getOwnPropertySymbols(s); i < q.length; i++) {
            if (e.indexOf(q[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, q[i]))
                t[p[i]] = s[q[i]];
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
 * @param networkConfig {Object} - The network configuration
 * @param control {Array} - The tracker controller configuration
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
    const trackClickEvent$1 = mkMethod(trackClickEvent(namespace));
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
const autocaptureTrack = handleError((payload) => {
    checkDisplayNamePlugin();
    trackClickEvent('CAT')(payload).catch((e) => errorHandler(e));
}, 'Event autocapture', true);
var index = { convivaTouchableAutoTrack: convivaTouchableAutoTrack(autocaptureTrack) };

export { createTracker, index as default, getWebViewCallback, removeAllTrackers, removeTracker };
//# sourceMappingURL=conviva-react-native-appanalytics.js.map
