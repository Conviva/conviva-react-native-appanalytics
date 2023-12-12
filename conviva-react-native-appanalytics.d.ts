import * as react from 'react';

/**
 * HttpMethod type
 */
type HttpMethod = 'post' | 'get';
/**
 * DevicePlatform type
 */
type DevicePlatform = 'web' | 'mob' | 'pc' | 'srv' | 'app' | 'tv' | 'cnsl' | 'iot';
/**
 * LogLevel type
 */
type LogLevel = 'off' | 'error' | 'debug' | 'verbose';
/**
 * BasisForProsessing
 */
type Basis = 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interests' | 'public_task' | 'vital_interests';
/**
 * BufferOption
 */
type BufferOption = 'single' | 'default' | 'large';
/**
 * Trigger for MessageNotification event
 */
type Trigger = 'push' | 'location' | 'calendar' | 'timeInterval' | 'other';
/**
 * ScreenSize
 */
type ScreenSize = [number, number];
/**
 * SelfDescribing type
 */
type SelfDescribing<T extends Record<keyof T, unknown> = Record<string, unknown>> = {
    /**
     * Schema
     */
    schema: string;
    /**
     * Data
     */
    data: T;
};
/**
 * EventContext type
 */
type EventContext = SelfDescribing;
/**
 * NetworkConfiguration
 */
interface NetworkConfiguration {
    /**
     * The collector endpoint
     *  - if the protocol is not included it defaults to https
     */
    endpoint: string;
    /**
     * The Http Method to use when sending events to the collector
     * @defaultValue 'post'
     */
    method?: HttpMethod;
    /**
     * A custom path which will be added to the endpoint URL to specify the
     * complete URL of the collector when paired with the POST method.
     *
     * @defaultValue `com.snowplowanalytics.snowplow/tp2`.
     */
    customPostPath?: string;
    /**
     * Custom headers for HTTP requests to the Collector.
     */
    requestHeaders?: Record<string, string>;
}
/**
 * TrackerConfiguration
 */
interface TrackerConfiguration {
    /**
     * The device platform the tracker runs on.
     * @defaultValue 'mob'
     */
    devicePlatform?: DevicePlatform;
    /**
     * Whether payload JSON data should be base64 encoded.
     * @defaultValue true
     */
    base64Encoding?: boolean;
    /**
     * The log level of tracker logs.
     * @defaultValue 'off'
     */
    logLevel?: LogLevel;
    /**
     * Whether application context is attached to tracked events.
     * @defaultValue true
     */
    applicationContext?: boolean;
    /**
     * Whether platform context is attached to tracked events.
     * @defaultValue true
     */
    platformContext?: boolean;
    /**
     * Whether geo-location context is attached to tracked events.
     * @defaultValue false
     */
    geoLocationContext?: boolean;
    /**
     * Whether session context is attached to tracked events.
     * @defaultValue true
     */
    sessionContext?: boolean;
    /**
     * Whether to attach a Deep Link entity to the first ScreenView tracked in the tracker after DeepLinkReceived event.
     * @defaultValue true
     */
    deepLinkContext?: boolean;
    /**
     * Whether screen context is attached to tracked events.
     * @defaultValue true
     */
    screenContext?: boolean;
    /**
     * Whether enable automatic tracking of ScreenView events.
     * @defaultValue true
     */
    screenViewAutotracking?: boolean;
    /**
     * Whether enable automatic tracking of background and foreground transitions.
     * @defaultValue false
     */
    lifecycleAutotracking?: boolean;
    /**
     * Whether enable automatic tracking of install event.
     * @defaultValue true
     */
    installAutotracking?: boolean;
    /**
     * Whether enable crash reporting.
     * @defaultValue true
     */
    exceptionAutotracking?: boolean;
    /**
     * Whether enable diagnostic reporting.
     * @defaultValue false
     */
    diagnosticAutotracking?: boolean;
    /**
     * Whether to anonymise client-side user identifiers in session and platform context entities
     * @defaultValue false
     */
    userAnonymisation?: boolean;
}
/**
 * SessionConfiguration
 */
interface SessionConfiguration {
    /**
     * The amount of time in seconds before the session id is updated while the app is in the foreground
     * @defaultValue 1800
     */
    foregroundTimeout: number;
    /**
     * The amount of time in seconds before the session id is updated while the app is in the background
     * @defaultValue 1800
     */
    backgroundTimeout: number;
}
/**
 * EmitterConfiguration
 */
interface EmitterConfiguration {
    /**
     * The buffer option for post requests.
     * @defaultValue 'single'
     */
    bufferOption?: BufferOption;
    /**
     * Maximum number of events collected from the EventStore to be sent in a request.
     * @defaultValue 150
     */
    emitRange?: number;
    /**
     *Maximum number of threads working in parallel in the tracker to send requests.
     * @defaultValue 15
     */
    threadPoolSize?: number;
    /**
     * Maximum amount of bytes allowed to be sent in a payload in a POST request.
     * @defaultValue 40000
     */
    byteLimitPost?: number;
    /**
     * Maximum amount of bytes allowed to be sent in a payload in a GET request.
     * @defaultValue 40000
     */
    byteLimitGet?: number;
    /**
     * Whether to anonymise server-side user identifiers including the `network_userid` and `user_ipaddress`
     * @defaultValue false
     */
    serverAnonymisation?: boolean;
}
/**
 * SubjectConfiguration
 */
interface SubjectConfiguration {
    [index: string]: unknown;
    /**
     * user id
     */
    userId?: string | null;
    /**
     * network user id (UUIDv4)
     */
    networkUserId?: string | null;
    /**
     * domain user id
     */
    domainUserId?: string | null;
    /**
     * The custom user-agent. It overrides the user-agent used by default.
     */
    useragent?: string | null;
    /**
     * IP address
     */
    ipAddress?: string | null;
    /**
     * The timezone label
     */
    timezone?: string | null;
    /**
     * The language set in the device
     */
    language?: string | null;
    /**
     * The screen resolution
     */
    screenResolution?: ScreenSize | null;
    /**
     * The screen viewport size
     */
    screenViewport?: ScreenSize | null;
    /**
     * color depth (integer)
     */
    colorDepth?: number | null;
}
/**
 * GdprConfiguration
 */
interface GdprConfiguration {
    /**
     * Basis for processing
     */
    basisForProcessing: Basis;
    /**
     * ID of a GDPR basis document.
     */
    documentId: string;
    /**
     * Version of the document.
     */
    documentVersion: string;
    /**
     * Description of the document.
     */
    documentDescription: string;
}
/**
 * Global Context
 */
interface GlobalContext {
    /**
     * tag
     */
    tag: string;
    /**
     * contexts
     */
    globalContexts: SelfDescribing[];
}
/**
 * Global Contexts configuration
 */
type GCConfiguration = GlobalContext[];
/**
 * Remote Configuration
 */
interface RemoteConfiguration {
    /**
     * The remote config endpoint
     */
    endpoint: string;
    /**
     * The Http Method to use for fetching the remote config
     * @defaultValue 'post'
     */
    method?: HttpMethod;
}
/**
 * The TrackerControllerConfiguration
 */
interface TrackerControllerConfiguration {
    networkConfig?: NetworkConfiguration;
    trackerConfig?: TrackerConfiguration;
    sessionConfig?: SessionConfiguration;
    emitterConfig?: EmitterConfiguration;
    subjectConfig?: SubjectConfiguration;
    gdprConfig?: GdprConfiguration;
    gcConfig?: GCConfiguration;
    remoteConfig?: RemoteConfiguration;
}
/**
 * ScreenView event properties
 * schema: iglu:com.snowplowanalytics.mobile/screen_view/jsonschema/1-0-0
 */
type ScreenViewProps = {
    /**
     * The name of the screen viewed
     */
    name: string;
    /**
     * The id(UUID) of screen that was viewed
     */
    id?: string;
    /**
     * The type of screen that was viewed
     */
    type?: string;
    /**
     * The name of the previous screen that was viewed
     */
    previousName?: string;
    /**
    * The id(UUID) of the previous screen that was viewed
    */
    previousId?: string;
    /**
     * The type of the previous screen that was viewed
     */
    previousType?: string;
    /**
     * The type of transition that led to the screen being viewed
     */
    transitionType?: string;
};
/**
 * Structured event properties
 */
type StructuredProps = {
    /**
     * The category of the event
     */
    category: string;
    /**
     * The action the event represents
     */
    action: string;
    /**
     * The label the action refers to
     */
    label?: string;
    /**
     * The property associated with the user action
     */
    property?: string;
    /**
     * The value associated with the user action
     */
    value?: number;
};
/**
 * PageView event properties
 */
type PageViewProps = {
    /**
     * The page URL
     */
    pageUrl: string;
    /**
     * The page title
     */
    pageTitle?: string;
    /**
     * The referrer URL
     */
    referrer?: string;
};
/**
 * Timing event properties
 */
type TimingProps = {
    /**
     * The timing category
     */
    category: string;
    /**
     * The timing variable
     */
    variable: string;
    /**
     * The time
     */
    timing: number;
    /**
     * The timing label
     */
    label?: string;
};
/**
 * ConsentDocument properties
 */
interface ConsentDocument {
    /**
     * The consent document id
     */
    documentId: string;
    /**
     * The consent document version
     */
    version: string;
    /**
     * The consent document name
     */
    name?: string;
    /**
     * The consent document description
     */
    documentDescription?: string;
}
/**
 * ConsentGranted event properties
 */
interface ConsentGrantedProps extends ConsentDocument {
    /**
     * The expiry (date-time string, e.g.: '2022-01-01T00:00:00Z')
     */
    expiry: string;
}
/**
 * ConsentWithdrawn event properties
 */
interface ConsentWithdrawnProps extends ConsentDocument {
    /**
     * Whether user opts out of all data collection
     */
    all: boolean;
}
/**
 * EcommerceItem
 */
type EcommerceItem = {
    sku: string;
    price: number;
    quantity: number;
    name?: string;
    category?: string;
    currency?: string;
};
/**
 * EcommerceTransaction event properties
 */
type EcommerceTransactionProps = {
    orderId: string;
    totalValue: number;
    items: EcommerceItem[];
    affiliation?: string;
    taxValue?: number;
    shipping?: number;
    city?: string;
    state?: string;
    country?: string;
    currency?: string;
};
/**
 * DeepLinkReceived event properties
 * schema: iglu:com.snowplowanalytics.mobile/deep_link_received/jsonschema/1-0-0
 */
type DeepLinkReceivedProps = {
    /**
     * URL in the received deep-link.
     */
    url: string;
    /**
     * Referrer URL, source of this deep-link.
     */
    referrer?: string;
};
/**
 * Attachment object that identify an attachment in the MessageNotification.
 */
type MessageNotificationAttachmentProps = {
    identifier: string;
    type: string;
    url: string;
};
/**
 * MessageNotification event properties
 * schema: iglu:com.snowplowanalytics.mobile/message_notification/jsonschema/1-0-0
 */
type MessageNotificationProps = {
    /**
     * The action associated with the notification.
     */
    action?: string;
    attachments?: MessageNotificationAttachmentProps[];
    /**
     * The notification's body.
     */
    body: string;
    bodyLocArgs?: string[];
    /**
     * The key to the body string in the app's string resources to use to localize the body text to the user's current localization.
     */
    bodyLocKey?: string;
    /**
     * The category associated to the notification.
     */
    category?: string;
    /**
     * The application is notified of the delivery of the notification if it's in the foreground or background, the app will be woken up (iOS only).
     */
    contentAvailable?: boolean;
    /**
     * The group which this notification is part of.
     */
    group?: string;
    /**
     * The icon associated to the notification (Android only).
     */
    icon?: string;
    /**
     * The number of items this notification represent.
     */
    notificationCount?: number;
    /**
     * The time when the event of the notification occurred.
     */
    notificationTimestamp?: string;
    /**
     * The sound played when the device receives the notification.
     */
    sound?: string;
    /**
     * The notification's subtitle. (iOS only)
     */
    subtitle?: string;
    /**
     * An identifier similar to 'group' but usable for different purposes (Android only).
     */
    tag?: string;
    /**
     * An identifier similar to 'group' but usable for different purposes (iOS only).
     */
    threadIdentifier?: string;
    /**
     * The notification's title.
     */
    title: string;
    /**
     * Variable string values to be used in place of the format specifiers in titleLocArgs to use to localize the title text to the user's current localization.
     */
    titleLocArgs?: string[];
    /**
     * The key to the title string in the app's string resources to use to localize the title text to the user's current localization.
     */
    titleLocKey?: string;
    /**
     * The trigger that raised the notification message. Must be one of: push, location, calendar, timeInterval, other
     */
    trigger: Trigger;
};
/**
 * The ReactNativeTracker type
 */
type ReactNativeTracker = {
    /**
     * Tracks a self-descibing event
     *
     * @param argmap - The self-describing event properties
     * @param contexts - The array of event contexts
     * @typeParam TData - The type of the data object within the SelfDescribing object
     */
    readonly trackSelfDescribingEvent: <TData extends Record<keyof TData, unknown> = Record<string, unknown>>(argmap: SelfDescribing<TData>, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a screen-view event
     *
     * @param argmap - The screen-view event's properties
     * @param contexts - The array of event contexts
     */
    readonly trackScreenViewEvent: (argmap: ScreenViewProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a structured event
     *
     * @param argmap - The structured event properties
     * @param contexts - The array of event contexts
     */
    readonly trackStructuredEvent: (argmap: StructuredProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a page-view event
     *
     * @param argmap - The page-view event properties
     * @param contexts - The array of event contexts
     */
    readonly trackPageView: (argmap: PageViewProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a timing event
     *
     * @param argmap - The timing event properties
     * @param contexts - The array of event contexts
     */
    readonly trackTimingEvent: (argmap: TimingProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a consent-granted event
     *
     * @param argmap - The consent-granted event properties
     * @param contexts - The array of event contexts
     */
    readonly trackConsentGrantedEvent: (argmap: ConsentGrantedProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a consent-withdrawn event
     *
     * @param argmap - The consent-withdrawn event properties
     * @param contexts - The array of event contexts
     */
    readonly trackConsentWithdrawnEvent: (argmap: ConsentWithdrawnProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks an ecommerce-transaction event
     *
     * @param argmap - The ecommerce-transaction event properties
     * @param contexts - The array of event contexts
     */
    readonly trackEcommerceTransactionEvent: (argmap: EcommerceTransactionProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a deep link received event
     *
     * @param argmap - The deep link received event properties
     * @param contexts - The array of event contexts
     */
    readonly trackDeepLinkReceivedEvent: (argmap: DeepLinkReceivedProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a message notification event
     *
     * @param argmap - The message notification event properties
     * @param contexts - The array of event contexts
     */
    readonly trackMessageNotificationEvent: (argmap: MessageNotificationProps, contexts?: EventContext[]) => Promise<void>;
    /**
     * Tracks a Custom Event
     *
     * @param eventName {string} - the custom event name
     * @param eventData {any} - the event data
     * @param contexts {Array}- the event contexts
     * @returns {Promise}
     */
    readonly trackCustomEvent: (eventName: string, eventData: any, contexts?: EventContext[]) => Promise<void>;
    /**
     * Sets custom tags
     *
     * @param tags {any} - the custom tags
     * @param contexts {Array}- the event contexts
     * @returns {Promise}
     */
    readonly setCustomTags: (tags: any, contexts?: EventContext[]) => Promise<void>;
    /**
     * Sets custom tags with category
     *
     * @param category {string} - category
     * @param tags {any} - the custom tags
     * @param contexts {Array}- the event contexts
     * @returns {Promise}
     */
    readonly setCustomTagsWithCategory: (category: string, tags: any, contexts?: EventContext[]) => Promise<void>;
    /**
     * Clears few of the Custom Tags which are set previously
     *
     * @param tagKeys {string []} - the custom tag keys to be deleted
     * @param contexts {Array}- the event contexts
     * @returns {Promise}
     */
    readonly clearCustomTags: (tagKeys: string[], contexts?: EventContext[]) => Promise<void>;
    /**
     * Clears all the previously set Custom Tags
     *
     * @param contexts {Array}- the event contexts
     * @returns {Promise}
     */
    readonly clearAllCustomTags: (contexts?: EventContext[]) => Promise<void>;
    /**
     * Removes global contexts
     *
     * @param tag - The tag of the global contexts to remove
     */
    readonly removeGlobalContexts: (tag: string) => Promise<void>;
    /**
     * Adds global contexts
     *
     * @param gc - The global context to add
     */
    readonly addGlobalContexts: (gc: GlobalContext) => Promise<void>;
    /**
     * Sets the userId of the tracker subject
     *
     * @param newUid - The new userId
     */
    readonly setUserId: (newUid: string | null) => Promise<void>;
    /**
     * Sets the networkUserId of the tracker subject
     *
     * @param newNuid - The new networkUserId
     */
    readonly setNetworkUserId: (newNuid: string | null) => Promise<void>;
    /**
     * Sets the domainUserId of the tracker subject
     *
     * @param newDuid - The new domainUserId
     */
    readonly setDomainUserId: (newDuid: string | null) => Promise<void>;
    /**
     * Sets the ipAddress of the tracker subject
     *
     * @param newIp - The new ipAddress
     */
    readonly setIpAddress: (newIp: string | null) => Promise<void>;
    /**
     * Sets the useragent of the tracker subject
     *
     * @param newUagent - The new useragent
     */
    readonly setUseragent: (newUagent: string | null) => Promise<void>;
    /**
     * Sets the timezone of the tracker subject
     *
     * @param newTz - The new timezone
     */
    readonly setTimezone: (newTz: string | null) => Promise<void>;
    /**
     * Sets the language of the tracker subject
     *
     * @param newLang - The new language
     */
    readonly setLanguage: (newLang: string | null) => Promise<void>;
    /**
     * Sets the screenResolution of the tracker subject
     *
     * @param newRes - The new screenResolution
     */
    readonly setScreenResolution: (newRes: ScreenSize | null) => Promise<void>;
    /**
     * Sets the screenViewport of the tracker subject
     *
     * @param newView - The new screenViewport
     */
    readonly setScreenViewport: (newView: ScreenSize | null) => Promise<void>;
    /**
     * Sets the colorDepth of the tracker subject
     *
     * @param newColorD - The new colorDepth
     */
    readonly setColorDepth: (newLang: number | null) => Promise<void>;
    /**
     * Sets subject data
     *
     * @param config - The new subject data
     */
    readonly setSubjectData: (config: SubjectConfiguration) => Promise<void>;
    /**
     * Gets the dentifier for the user of the session
     *
     * @returns {Promise<string | undefined>}
     */
    readonly getSessionUserId: () => Promise<string | undefined>;
    /**
     * Gets the identifier for the session
     *
     * @returns {Promise<string | undefined>}
     */
    readonly getSessionId: () => Promise<string | undefined>;
    /**
     * Gets the index of the current session for this user
     *
     * @returns {Promise<number | undefined>}
     */
    readonly getSessionIndex: () => Promise<number | undefined>;
    /**
     * Gets whether the app is currently in background state
     *
     * @returns {Promise<boolean | undefined>}
     */
    readonly getIsInBackground: () => Promise<boolean | undefined>;
    /**
     * Gets the number of background transitions in the current session
     *
     * @returns {Promise<number | undefined>}
     */
    readonly getBackgroundIndex: () => Promise<number | undefined>;
    /**
     * Gets the number of foreground transitions in the current session.
     *
     * @returns {Promise<number | undefined>}
     */
    readonly getForegroundIndex: () => Promise<number | undefined>;
    /**
    * Tracks a click event
    *
    * @param eventData - The user click event properties
    */
    readonly trackClickEvent: (eventData: any) => Promise<void>;
};

/**
 * Enables tracking events from apps rendered in react-native-webview components.
 * The apps need to use the Conviva WebView tracker to track the events.
 *
 * To subscribe for the events, set the `onMessage` attribute:
 * <WebView onMessage={getWebViewCallback()} ... />
 *
 * @returns Callback to subscribe for events from Web views tracked using the Conviva WebView tracker.
 */
declare function getWebViewCallback(): (message: {
    nativeEvent: {
        data: string;
    };
}) => void;

/**
 * Creates a React Native Tracker object
 *
 * @param networkConfig {Object} - The network configuration
 * @param control {Array} - The tracker controller configuration
 * @returns The tracker object
 */
declare function createTracker(customerKey: string, appName: string, controllerConfig?: TrackerControllerConfiguration): ReactNativeTracker;
/**
 * Removes a tracker given its namespace
 *
 * @param trackerNamespace {string}
 * @returns - A boolean promise
 */
declare function removeTracker(trackerNamespace: string): Promise<boolean>;
/**
 * Removes all trackers
 *
 * @returns - A boolean promise
 */
declare function removeAllTrackers(): Promise<boolean>;

declare const _default: {
    convivaTouchableAutoTrack: (TouchableComponent: any) => react.ForwardRefExoticComponent<react.RefAttributes<any>>;
};

export { Basis, BufferOption, ConsentDocument, ConsentGrantedProps, ConsentWithdrawnProps, DeepLinkReceivedProps, DevicePlatform, EcommerceItem, EcommerceTransactionProps, EmitterConfiguration, EventContext, GCConfiguration, GdprConfiguration, GlobalContext, HttpMethod, LogLevel, MessageNotificationProps, NetworkConfiguration, PageViewProps, ReactNativeTracker, ScreenSize, ScreenViewProps, SelfDescribing, SessionConfiguration, StructuredProps, SubjectConfiguration, TimingProps, TrackerConfiguration, TrackerControllerConfiguration, Trigger, createTracker, _default as default, getWebViewCallback, removeAllTrackers, removeTracker };
