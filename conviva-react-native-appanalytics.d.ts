import * as React$1 from 'react';

/** Which JS capture path produced a given error event. */
type ErrorSource = 'globalHandler' | 'unhandledRejection' | 'errorBoundary' | 'manual';
/**
 * Severity of the error — the primary bucketing dimension for dashboards and
 * backend queries. Mirrors Sentry's `level` and Bugsnag's `severity`.
 */
type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';
/** Active JS engine at runtime. Determines which symbolication pipeline applies. */
type JsEngine = 'hermes' | 'jsc' | 'unknown';
/** The complete payload sent across the native bridge for every JS error event. */
interface JsErrorPayload {
    /** Epoch milliseconds captured at the moment _dispatch() is called. */
    timestamp: number;
    /** Human-readable error message. Truncated to MAX_MESSAGE_LENGTH in _dispatch(). */
    message: string;
    /** error.name — e.g. "TypeError", "ReferenceError", "UnhandledRejection". */
    errorType: string;
    /** JS stack trace string. Truncated to MAX_STACK_TRACE_LENGTH in _dispatch(). */
    stackTrace: string;
    /** true only when the error is fatal / app-terminating. */
    isFatal: boolean;
    /**
     * true  → caught intentionally (ErrorBoundary, try/catch + trackError).
     * false → uncaught (global handler, unhandled promise rejection).
     */
    isHandled: boolean;
    /** Which JS capture path produced this event. */
    errorSource: ErrorSource;
    /** Severity of the error — primary dashboard bucketing dimension. */
    severity: ErrorSeverity;
    /** React component tree to the failing component. Only for errorBoundary. */
    componentStack?: string;
    /** Line number extracted from the first frame of the stack trace. */
    lineNumber?: number;
    /** Column number extracted from the first frame of the stack trace. */
    lineColumn?: number;
    /** Source file name extracted from the first frame of the stack trace. */
    fileName?: string;
    /**
     * SHA-256 hash of the compiled JS bundle, injected at build time.
     * Required when backend symbolication is enabled AND the app uses OTA updates.
     */
    bundleId?: string;
    /** Active JS engine at capture time. */
    jsEngine: JsEngine;
    /** System-injected + consumer-defined attributes attached at capture time. */
    attributes?: Record<string, string | number | boolean>;
}
/** Bridge adapter interface — swap for a mock in tests. */
interface BridgeAdapter {
    isAvailable(): boolean;
    reportJsError(payload: JsErrorPayload): void;
}
/**
 * Internal configuration for the error tracking module.
 * NOT directly exposed to consumers — the existing ConvivaTracker.init() config
 * schema is extended with error tracking fields, and the existing init flow
 * constructs this internal config.
 */
interface ErrorTrackingInternalConfig {
    enabled: boolean;
    captureGlobalErrors: boolean;
    captureUnhandledRejections: boolean;
    suppressInDev: boolean;
    enableRateLimiting: boolean;
    maxEventsPerWindow: number;
    rateLimitWindowMs: number;
    /** Circuit-breaker cooldown duration in ms after rate limit is exceeded. */
    disconnectDurationMs: number;
    /**
     * When true, unhandled promise rejections are reported with isHandled:true
     * and severity:'warning' instead of isHandled:false + severity:'error'.
     * Mirrors Bugsnag's reportUnhandledPromiseRejectionsAsHandled option.
     */
    promiseRejectionsAsHandled: boolean;
    /**
     * Consumer-supplied hook. Return false to suppress. Mutate payload to enrich.
     * If this throws, the error is captured anyway (fail-open per D8).
     * Filtered events (returning false) do NOT consume a rate-limit token.
     */
    beforeCapture?: (payload: JsErrorPayload) => boolean | void;
    /**
     * Optional JS bundle hash override for OTA apps not using the Metro plugin.
     */
    bundleId?: string;
    /** Injected bridge adapter. Production default: NativeBridgeAdapter. */
    bridgeAdapter?: BridgeAdapter;
}
/**
 * Consumer-facing configuration exposed through TrackerControllerConfiguration.
 * Every field is optional — defaults are applied by _initFromTracker in the
 * error tracker singleton.
 */
interface ErrorTrackingConfiguration {
    enabled?: boolean;
    captureGlobalErrors?: boolean;
    captureUnhandledRejections?: boolean;
    suppressInDev?: boolean;
    enableRateLimiting?: boolean;
    /** Default: 20 (matching Conviva JS horizontal tracker). */
    maxEventsPerWindow?: number;
    /** Default: 1 000 ms (1-second window). */
    rateLimitWindowMs?: number;
    /** Circuit-breaker cooldown after limit hit. Default: 2 000 ms. */
    disconnectDurationMs?: number;
    /** Default: false. See Bugsnag reportUnhandledPromiseRejectionsAsHandled. */
    promiseRejectionsAsHandled?: boolean;
    /** JS bundle hash for source map lookup in Conviva's symbolication service. */
    bundleId?: string;
    beforeCapture?: (payload: JsErrorPayload) => boolean | void;
    /** @internal — test injection point */
    bridgeAdapter?: BridgeAdapter;
}

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
interface TraceparentConfiguration {
    force: Boolean;
    enabled: Boolean;
    targetUrl: string[];
}
/**
 * ClidSyncConfiguration
 *
 * Mirrors the remote-config clid_sync JSON structure.
 * App-supplied domains under webViewCookie.domains are used immediately as fallback;
 * remote config replaces them once received.
 * Note: webViewCookie.en and webViewBridge.en are controlled by remote config only and
 * are ignored when supplied here.
 */
interface ClidSyncConfiguration {
    webViewCookie?: {
        enabled?: boolean;
        /**
         * List of cookie domains to receive the Conviva_sdkConfig cookie.
         * Use leading-dot form (e.g. ".example.com") for subdomain coverage.
         */
        domains?: string[];
    };
    webViewBridge?: {
        enabled?: boolean;
    };
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
 * SessionReplayConfiguration
 *
 * Nested structure that mirrors the native replay SDK JSON schema exactly.
 * Passed as `sessionReplayConfig` to createTracker. The bridge passes this
 * through to the native SDK without key translation  -  same pattern as all
 * other tracker configs.
 *
 * In production, enabled/sampling are driven by remote config.
 * Set them here for local validation only.
 */
interface SessionReplayConfiguration {
    /** Enable replay. Remote config overrides in production. @defaultValue false */
    enabled?: boolean;
    /** Enable verbose replay SDK logs (snapshot queue, flush counts). @defaultValue false */
    logging?: boolean;
    /** Sampling configuration. Remote config overrides in production. */
    sampling?: {
        /** Sampling percentage 0-100. @defaultValue 0 */
        pct?: number;
    };
    /** Replay ingest network configuration (separate from analytics collector). */
    networkConfiguration?: {
        /** Replay ingest endpoint URL. e.g. 'https://rcg.conviva.com' */
        endpoint?: string;
    };
    /** Replay emitter configuration. */
    emitterConfiguration?: {
        /** Network data mode: 'wifi' (wifi-only) or 'any'. @defaultValue 'wifi' */
        dataMode?: 'wifi' | 'any';
        /** Upload interval in seconds. @defaultValue 60 */
        uploadInterval?: number;
        /** Policy expiry time in seconds. @defaultValue 3600 */
        policyExpiryTime?: number;
        /** Flush threshold (number of events before an upload). @defaultValue 20 */
        flushAt?: number;
        /** Max events per upload batch. @defaultValue 120 */
        maxBatchSize?: number;
        /** Max events held in queue. @defaultValue 1000 */
        maxQueueSize?: number;
    };
    /** Mobile recorder / masking configuration. */
    mobRecorderConfiguration?: {
        /** Mask all text inputs. @defaultValue true */
        maskAllInputs?: boolean;
        /** Mask all images. @defaultValue true */
        maskAllImages?: boolean;
        /**
         * Mask system views.
         * Read as maskAllSystemViews on Android, maskSandboxedSystemViews on iOS.
         * Include both keys to cover both platforms.
         * @defaultValue true
         */
        maskAllSystemViews?: boolean;
        /** iOS-specific key for masking sandboxed/system views. @defaultValue true */
        maskSandboxedSystemViews?: boolean;
        /** Input categories to mask. e.g. ['emailAddress','password','telephoneNumber'] */
        maskInputOptions?: string[];
        /** Capture throttle delay in ms. @defaultValue 1000 */
        throttleDelayMs?: number;
        /** Screenshot JPEG compression quality 0-100. @defaultValue 10 */
        compressionQuality?: number;
    };
}
/**
 * The TrackerControllerConfiguration
 */
interface TrackerControllerConfiguration {
    networkConfig?: NetworkConfiguration;
    traceparentConfig?: TraceparentConfiguration;
    trackerConfig?: TrackerConfiguration;
    sessionConfig?: SessionConfiguration;
    emitterConfig?: EmitterConfiguration;
    subjectConfig?: SubjectConfiguration;
    gdprConfig?: GdprConfiguration;
    gcConfig?: GCConfiguration;
    remoteConfig?: RemoteConfiguration;
    /**
     * Error tracking configuration. Pass `false` to fully disable JS error
     * capture; omit or pass an object to opt in with defaults.
     *
     * When enabled, the SDK installs a chained ErrorUtils handler plus an
     * engine-appropriate unhandled-promise-rejection hook, and exposes the
     * `ConvivaErrorBoundary` React component + `tracker.trackError` API.
     */
    errorTracking?: false | ErrorTrackingConfiguration;
    clidSyncConfig?: ClidSyncConfiguration;
    sessionReplayConfig?: SessionReplayConfiguration;
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
 * RevenueEventItem properties.
 * All fields are optional.
 */
type RevenueEventItemProps = {
    productId?: string;
    name?: string;
    sku?: string;
    category?: string[];
    unitPrice?: number;
    quantity?: number;
    discount?: number;
    brand?: string;
    variant?: string;
    extraMetadata?: Record<string, unknown>;
};
/**
 * Properties accepted by `tracker.trackError` for manual error reporting.
 *
 * - `message` is required.
 * - `errorType` and `stackTrace` are optional — most consumers will pass an
 *   `Error` instance through the higher-level `ConvivaErrorBoundary` component
 *   or rely on automatic capture via the global handler / promise-rejection
 *   hook. This shape is designed for hand-rolled try/catch blocks where the
 *   consumer has already stringified an error.
 */
type ErrorEventProps = {
    message: string;
    errorType?: string;
    stackTrace?: string;
    isFatal?: boolean;
    isHandled?: boolean;
    componentStack?: string;
    attributes?: Record<string, string | number | boolean>;
};
/**
 * RevenueEvent properties.
 * Required: totalOrderAmount, transactionId, currency.
 */
type RevenueEventProps = {
    totalOrderAmount: number;
    transactionId: string;
    currency: string;
    taxAmount?: number;
    shippingCost?: number;
    discount?: number;
    cartSize?: number;
    paymentMethod?: string;
    paymentProvider?: string;
    items?: RevenueEventItemProps[];
    extraMetadata?: Record<string, unknown>;
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
     * Tracks a revenue event
     *
     * @param argmap - The revenue event properties
     * @param contexts - The array of event contexts
     */
    readonly trackRevenueEvent: (argmap: RevenueEventProps, contexts?: EventContext[]) => Promise<void>;
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
    /**
     * Passes JS bundle identity fields to the native SDK so they are attached
     * to the Conviva app-context entity on every subsequent event.
     *
     * Recognised keys: `jsBundleSource`, `jsBundleId`, `jsBundleChannel`,
     * `jsBundleLabel`, `jsEngine`. Unknown keys and empty string values are
     * silently ignored by the native SDK.
     *
     * @param info - Map of JS bundle fields
     */
    readonly setJsBundleInfo: (info: Record<string, string>) => Promise<void>;
    /**
     * Manually report a JS error. For try/catch blocks and other sites where
     * the consumer wants to capture an error with richer context than what the
     * automatic global handler / promise-rejection / ErrorBoundary hooks
     * provide. Fail-silent — never throws.
     *
     * Defaults: `isFatal=false`, `isHandled=true`.
     *
     * @param argmap   - The error event properties. `message` is required.
     * @param contexts - Optional event contexts forwarded to the native tracker.
     */
    readonly trackError: (argmap: ErrorEventProps, contexts?: EventContext[]) => Promise<void>;
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

declare function withReactNavigationAutotrack(track: any): (AppContainer: any) => React.ForwardRefExoticComponent<React.RefAttributes<any>>;

interface ConvivaErrorBoundaryProps {
    /**
     * Children tree to protect. If any descendant throws during render, commit,
     * or lifecycle, this boundary captures the error and renders `fallback`.
     */
    children?: React$1.ReactNode;
    /**
     * What to render when an error is active. Either a ReactNode or a function
     * that receives the captured error + a `reset()` callback, matching
     * Sentry and react-error-boundary conventions.
     */
    fallback?: React$1.ReactNode | ((args: {
        error: Error;
        reset: () => void;
    }) => React$1.ReactNode);
    /**
     * When any value in this array changes between renders, the boundary
     * resets and re-renders children. Useful to recover on route changes.
     */
    resetKeys?: ReadonlyArray<unknown>;
    /** Consumer callback invoked just before dispatch. Must not throw. */
    onError?: (error: Error, componentStack: string) => void;
    /**
     * Tag this boundary with a human-readable name, forwarded as an attribute
     * on the captured payload.
     */
    name?: string;
}
interface State {
    error: Error | null;
    /**
     * Mirror of `errorTracker.isEnabled()`, kept in state so the boundary
     * re-renders when remote config toggles error tracking at runtime. Optional
     * because some state updates (e.g. getDerivedStateFromError) only set `error`;
     * an unset value is treated as enabled (the boundary keeps protecting).
     */
    enabled?: boolean;
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
declare class ConvivaErrorBoundary extends React$1.Component<ConvivaErrorBoundaryProps, State> {
    state: State;
    /** Cleanup for the enable-state subscription; set in componentDidMount. */
    private unsubscribeEnabled;
    /** Reads the tracker enable flag defensively (never throws). */
    private static readEnabled;
    static getDerivedStateFromError(error: Error): Partial<State>;
    componentDidMount(): void;
    componentWillUnmount(): void;
    componentDidCatch(error: Error, info: {
        componentStack: string;
    }): void;
    componentDidUpdate(prevProps: ConvivaErrorBoundaryProps): void;
    reset: () => void;
    render(): React$1.ReactNode;
}

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
declare class DedupGuard {
    private seenObjects;
    private readonly primitives;
    constructor(primitiveTtlMs?: number, maxPrimitives?: number);
    /** true if this thrown value was already seen within the TTL window. */
    isDuplicate(err: unknown): boolean;
    /** Call after dispatching so subsequent captures of the same throw are suppressed. */
    markSeen(err: unknown): void;
    /** Test hook — clears all seen state. Not part of the public API. */
    _reset(): void;
}

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
declare class RateLimiter {
    private ringBuffer;
    private windowStart;
    private maxEvents;
    private windowMs;
    private disconnectMs;
    private circuitOpenUntil;
    constructor(maxEvents: number, windowMs: number, disconnectMs: number);
    /**
     * Returns true when an event is allowed to proceed. Consumes a slot on
     * allow. Caller must NOT consume a slot if the event is filtered out by a
     * beforeCapture hook.
     */
    tryAcquire(now?: number): boolean;
    /**
     * Live update from remote config. Preserves in-flight state sensibly:
     *  - Resets the window start only when maxEvents changes (buffer is resized).
     *  - Does NOT close an already-open circuit early: new disconnectMs applies
     *    from the next time the circuit opens.
     */
    updateConfig(maxEvents: number, windowMs: number, disconnectMs: number): void;
    /** true when the circuit is currently OPEN (i.e. all events dropped). */
    isOpen(now?: number): boolean;
    /** Test hook — clears all state. Not part of the public API. */
    _reset(): void;
    private sanitizeMaxEvents;
    private sanitizePositive;
}

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
declare class ConvivaErrorTracker {
    private config;
    private bridge;
    private rateLimiter;
    private dedup;
    private pluginCleanups;
    private installed;
    private attributes;
    private enabledListeners;
    constructor();
    /**
     * Called from src/api.ts on createTracker(). Wires the consumer config and
     * installs all capture hooks. Safe to call multiple times — config always
     * reflects the latest call, and capture-hook flags (captureGlobalErrors,
     * captureUnhandledRejections, enabled) are applied on every call by
     * tearing down the existing hooks and reinstalling them with the updated
     * flags via `_applyHookState`.
     */
    _initFromTracker(cfg: ErrorTrackingConfiguration | undefined): void;
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
    private _applyHookState;
    /**
     * Runs every plugin cleanup (preferring the global-slot copy over
     * `this.pluginCleanups` so an HMR-swapped instance can still tear down the
     * previous incarnation's handlers), then clears local state and the global
     * install slot. Used by both `_applyHookState` (before reinstall) and
     * `teardown` (final shutdown).
     */
    private _drainPluginCleanups;
    /**
     * Current master enable state. Read by ConvivaErrorBoundary to decide whether
     * to intercept (enabled) or pass the error through (disabled).
     */
    isEnabled(): boolean;
    /**
     * Subscribe to master enable-state changes. The listener is invoked with the
     * current `enabled` value whenever it may have changed. Returns an
     * unsubscribe function. Never throws.
     */
    onEnabledChange(listener: (enabled: boolean) => void): () => void;
    /** Notifies enable-state listeners with the current value. Fail-silent. */
    private _notifyEnabledChange;
    /**
     * Uninstalls every capture hook and clears internal state. Idempotent.
     * Called from src/api.ts on removeAllTrackers() / cleanup().
     *
     * Drains cleanups from BOTH `this.pluginCleanups` and the global install
     * slot so an HMR-swapped instance can still tear down handlers that were
     * registered by a previous incarnation of this module.
     */
    teardown(): void;
    /**
     * Public toggle used by consumer API + remote config. Routes through
     * `_applyHookState` so transitions in either direction are observable:
     * enabled:false uninstalls plugins and clears INSTALL_FLAG, while
     * enabled:true installs them per current capture flags.
     */
    setEnabled(enabled: boolean): void;
    setRateLimitingEnabled(enabled: boolean): void;
    addAttribute(key: string, value: string | number | boolean): void;
    removeAttribute(key: string): void;
    /** Called from src/subject.ts when setUserId runs. Kept internal. */
    _setUserId(id: string | null): void;
    /**
     * Remote-config update point. Not yet wired to a backend, but in place for
     * future milestones. All fields optional; only provided ones override.
     *
     * If any of `enabled`, `captureGlobalErrors`, or `captureUnhandledRejections`
     * actually change, `_applyHookState` is invoked so plugin install state
     * matches the new config. This keeps remote-driven enable/disable and
     * capture toggles observable at the hook layer (not just at dispatch).
     */
    _updateFromRemoteConfig(patch: Partial<ErrorTrackingInternalConfig> | null | undefined): void;
    /**
     * Applies the three hook-affecting boolean flags from a remote-config patch
     * via the `HOOK_BOOLEAN_KEYS` table. Returns true when any flag actually
     * changed so the caller can decide whether to reinstall plugin hooks.
     */
    private _applyHookBooleanPatch;
    /**
     * Applies the rate-limit subset of a remote-config patch to the internal
     * config and updates the RateLimiter when any value changed.
     */
    private _applyRateLimitPatch;
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
    _dispatch(args: {
        error: unknown;
        errorSource: ErrorSource;
        isFatal: boolean;
        isHandled: boolean;
        componentStack?: string;
        severityOverride?: ErrorSeverity;
        extraAttributes?: Record<string, string | number | boolean>;
    }): void;
    /**
     * Consolidates the pre-payload gates (enabled / dev-suppression / per-source
     * capture flag / bridge presence) into a single check. Returns the captured
     * bridge reference when dispatch should proceed, or `null` to short-circuit.
     *
     * Capturing the bridge here means the dispatch path is stable against
     * re-entrant mutation (e.g. a beforeCapture hook calling `_setBridge`) and
     * TypeScript can narrow `bridge` to `BridgeAdapter` for the rest of `_dispatch`.
     */
    private _acquireBridge;
    /**
     * Final post-payload gating: runs the beforeCapture hook (fail-open per D8),
     * confirms the bridge is still available, and consumes a rate-limit slot.
     * Returns `true` when the payload should be forwarded, `false` when dropped.
     *
     * Filtered / undeliverable events never consume a rate-limit token —
     * `tryAcquire` is the LAST gate before forwarding.
     */
    private _passesDispatchPipeline;
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
    private _forwardToBridge;
    /** @internal — test/introspection accessor. */
    _getConfig(): ErrorTrackingInternalConfig;
    /** @internal — test/introspection accessor. */
    _getBridge(): BridgeAdapter | null;
    /** @internal — test/introspection accessor. */
    _getDedupGuard(): DedupGuard;
    /** @internal — test/introspection accessor. */
    _getRateLimiter(): RateLimiter;
    /** @internal — Bridge replacement (tests only). */
    _setBridge(bridge: BridgeAdapter | null): void;
    /** @internal — hook install seam. See installPlugins. */
    get installedState(): boolean;
    /**
     * Installs global-error-handler + promise-rejection plugins. Lazy-required
     * so unit tests do not pull in RN / ErrorUtils side effects at module load.
     *
     * The ErrorBoundary component is NOT installed here — it is a React
     * component the consumer wraps around their tree.
     */
    private installPlugins;
    /** @internal — resolves once any pending install completes (test helper). */
    _waitForInstall(): Promise<void>;
}
/** Module-level singleton shared by api.ts, subject.ts, and plugins. */
declare const errorTracker: ConvivaErrorTracker;

/**
 * In-memory bridge adapter used for unit / integration tests and the DemoApp
 * manual-test harness. Collects every payload the error tracker would have
 * sent to native so tests can assert on structure and ordering.
 */
declare class MockBridgeAdapter implements BridgeAdapter {
    payloads: JsErrorPayload[];
    isAvailable(): boolean;
    reportJsError(payload: JsErrorPayload): void;
    /** Clears captured payloads. Useful between tests. */
    clear(): void;
}

/**
 * Creates a React Native Tracker object
 *
 * @param customerKey {string} - The Conviva customer key for the application
 * @param appName {string} - The application name reported with events
 * @param controllerConfig {TrackerControllerConfiguration} - Optional tracker controller configuration
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
/**
 * Cleanup
 *
 * @returns - A boolean promise
 */
declare function cleanup(): Promise<boolean>;
/**
 * Gets the cliend id
 *
 * @returns - A string promise
 */
declare function getClientId(): Promise<string>;
/**
 * Sets the cliend id
 *
 * @param clientId {string}
 * @returns - A boolean promise
 */
declare function setClientId(clientId: string): Promise<boolean>;
/**
 * Starts (or resumes) Conviva Session Replay capture for the current session.
 * Useful for resuming capture after it was paused via {@link stopReplay} —
 * for example, after dismissing a WebView, which cannot be captured.
 *
 * @returns - A void promise
 */
declare function startReplay(): Promise<void>;
/**
 * Pauses Conviva Session Replay capture for the current session.
 * Call before presenting content that should not be captured (e.g. a WebView),
 * then resume with {@link startReplay}.
 *
 * @returns - A void promise
 */
declare function stopReplay(): Promise<void>;
declare const autocaptureNavigationTrack: (...args: any[]) => any;
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
declare function trackError(argmap: ErrorEventProps, contexts?: EventContext[]): Promise<void>;
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
declare const CR_NO_CAPTURE = "cr-no-capture";
/**
 * Spread on the View or Text that holds sensitive content (Paper + Fabric):
 *   <Text {...crNoCaptureProps}>Secret</Text>
 *   <View {...crNoCaptureProps}><SensitiveBlock /></View>
 */
declare const crNoCaptureProps: {
    nativeID: string;
};

declare const _default: {
    convivaTouchableAutoTrack: (TouchableComponent: any) => React$1.ForwardRefExoticComponent<React$1.RefAttributes<any>>;
    withReactNavigationAutotrack: (AppContainer: any) => React$1.ForwardRefExoticComponent<React$1.RefAttributes<any>>;
};

export { Basis, BridgeAdapter, BufferOption, CR_NO_CAPTURE, ConsentDocument, ConsentGrantedProps, ConsentWithdrawnProps, ConvivaErrorBoundary, ConvivaErrorTracker, DeepLinkReceivedProps, DevicePlatform, EcommerceItem, EcommerceTransactionProps, EmitterConfiguration, ErrorEventProps, ErrorSeverity, ErrorSource, ErrorTrackingConfiguration, EventContext, GCConfiguration, GdprConfiguration, GlobalContext, HttpMethod, JsEngine, JsErrorPayload, LogLevel, MessageNotificationProps, MockBridgeAdapter, NetworkConfiguration, PageViewProps, ReactNativeTracker, RevenueEventItemProps, RevenueEventProps, ScreenSize, ScreenViewProps, SelfDescribing, SessionConfiguration, SessionReplayConfiguration, StructuredProps, SubjectConfiguration, TimingProps, TrackerConfiguration, TrackerControllerConfiguration, Trigger, autocaptureNavigationTrack, cleanup, crNoCaptureProps, createTracker, _default as default, errorTracker, getClientId, getWebViewCallback, removeAllTrackers, removeTracker, setClientId, startReplay, stopReplay, trackError, withReactNavigationAutotrack };
