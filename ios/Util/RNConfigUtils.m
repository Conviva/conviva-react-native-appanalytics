//
//  RNConfigUtils.m
//
//  Copyright (c) 2021-2023 Snowplow Analytics Ltd. All rights reserved.
//
//  This program is licensed to you under the Apache License Version 2.0,
//  and you may not use this file except in compliance with the Apache License
//  Version 2.0. You may obtain a copy of the Apache License Version 2.0 at
//  http://www.apache.org/licenses/LICENSE-2.0.
//
//  Unless required by applicable law or agreed to in writing,
//  software distributed under the Apache License Version 2.0 is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
//  express or implied. See the Apache License Version 2.0 for the specific
//  language governing permissions and limitations there under.
//
//  Copyright: Copyright (c) 2023 Snowplow Analytics Ltd
//  License: Apache License Version 2.0
//

#import "RNConfigUtils.h"
#import "RNTrackerVersion.h"
#import "RNUtilities.h"
#import "NSDictionary+RNCAT_TypeMethods.h"

#import <Foundation/Foundation.h>

#import <ConvivaAppAnalytics/CATAppAnalytics.h>
#import <ConvivaAppAnalytics/CATTrackerConfiguration.h>
#import <ConvivaAppAnalytics/CATDevicePlatform.h>
#import <ConvivaAppAnalytics/CATLoggerDelegate.h>
#import <ConvivaAppAnalytics/CATSessionConfiguration.h>
#import <ConvivaAppAnalytics/CATEmitterConfiguration.h>
#import <ConvivaAppAnalytics/CATSubjectConfiguration.h>
#import <ConvivaAppAnalytics/CATGDPRConfiguration.h>
#import <ConvivaAppAnalytics/CATGlobalContextsConfiguration.h>
#if !TARGET_OS_TV
// All three clid-sync types are gated to SNOWPLOW_TARGET_IOS in the SDK,
// so they are not declared on tvOS. Mirror that gating here to keep the
// wrapper tvOS-buildable; the +mkClidSyncConfig: implementation below is
// gated identically.
#import <ConvivaAppAnalytics/CATClientIdSyncConfiguration.h>
#import <ConvivaAppAnalytics/CATWebViewCookieConfiguration.h>
#import <ConvivaAppAnalytics/CATWebViewBridgeConfiguration.h>
#endif

@implementation RNConfigUtils

+ (CATTrackerConfiguration *) mkDefaultTrackerConfig {
    
    CATTrackerConfiguration *trackerConfiguration = [CATTrackerConfiguration new];
    trackerConfiguration.trackerVersionSuffix = kRNTrackerVersion;
    
    return trackerConfiguration;
}

+ (CATTrackerConfiguration *) mkTrackerConfig:(NSDictionary *) trackerConfig {
    CATTrackerConfiguration *trackerConfiguration = [CATTrackerConfiguration new];
    trackerConfiguration.trackerVersionSuffix = kRNTrackerVersion;

    NSString *appId = [trackerConfig rncat_stringForKey:@"appId" defaultValue:nil];
    if (appId) {
        trackerConfiguration.appId = appId;
    }

    NSString *devicePlatform = [trackerConfig rncat_stringForKey:@"devicePlatform" defaultValue:nil];
    if (devicePlatform) {
        trackerConfiguration.devicePlatform = CATStringToDevicePlatform(devicePlatform);
    }

    trackerConfiguration.base64Encoding = [trackerConfig rncat_boolForKey:@"base64Encoding" defaultValue:YES];

    NSString *logLevel = [trackerConfig rncat_stringForKey:@"logLevel" defaultValue:nil];
    if (logLevel) {
        NSUInteger index = [@[@"off", @"error", @"debug", @"verbose"] indexOfObject:logLevel];
        trackerConfiguration.logLevel = index != NSNotFound ? index : CATLogLevelOff;
    }

    trackerConfiguration.sessionContext = [trackerConfig rncat_boolForKey:@"sessionContext" defaultValue:YES];
    trackerConfiguration.applicationContext = [trackerConfig rncat_boolForKey:@"applicationContext" defaultValue:YES];
    trackerConfiguration.platformContext = [trackerConfig rncat_boolForKey:@"platformContext" defaultValue:YES];
    trackerConfiguration.geoLocationContext = [trackerConfig rncat_boolForKey:@"geoLocationContext" defaultValue:NO];
    trackerConfiguration.screenContext = [trackerConfig rncat_boolForKey:@"screenContext" defaultValue:YES];
    trackerConfiguration.deepLinkContext = [trackerConfig rncat_boolForKey:@"deepLinkContext" defaultValue:YES];
    trackerConfiguration.screenViewAutotracking = [trackerConfig rncat_boolForKey:@"screenViewAutotracking" defaultValue:YES];
    trackerConfiguration.lifecycleAutotracking = [trackerConfig rncat_boolForKey:@"lifecycleAutotracking" defaultValue:NO];
    trackerConfiguration.installAutotracking = [trackerConfig rncat_boolForKey:@"installAutotracking" defaultValue:YES];
    trackerConfiguration.exceptionAutotracking = [trackerConfig rncat_boolForKey:@"exceptionAutotracking" defaultValue:YES];
    trackerConfiguration.diagnosticAutotracking = [trackerConfig rncat_boolForKey:@"diagnosticAutotracking" defaultValue:NO];
//    trackerConfiguration.userAnonymisation = [trackerConfig rncat_boolForKey:@"userAnonymisation" defaultValue:NO];

    return trackerConfiguration;
}

+ (CATSessionConfiguration *) mkSessionConfig:(NSDictionary *) sessionConfig {

    NSInteger foreground = [[sessionConfig rncat_numberForKey:@"foregroundTimeout" defaultValue:@1800] integerValue];
    NSInteger background = [[sessionConfig rncat_numberForKey:@"backgroundTimeout" defaultValue:@1800] integerValue];
    CATSessionConfiguration *sessionConfiguration = [[CATSessionConfiguration alloc] initWithForegroundTimeoutInSeconds:foreground backgroundTimeoutInSeconds:background];

    return sessionConfiguration;
}

+ (CATEmitterConfiguration *) mkEmitterConfig:(NSDictionary *) emitterConfig {
    CATEmitterConfiguration *emitterConfiguration = [[CATEmitterConfiguration alloc] init];
    NSString *bufferOption = [emitterConfig rncat_stringForKey:@"bufferOption" defaultValue:@"single"];
    if ([bufferOption isEqualToString:@"default"]) {
        emitterConfiguration.bufferOption = CATBufferOptionDefaultGroup;
    } else if ([bufferOption isEqualToString:@"large"]) {
        emitterConfiguration.bufferOption = CATBufferOptionLargeGroup;
    } else {
        emitterConfiguration.bufferOption = CATBufferOptionSingle;
    }

    emitterConfiguration.emitRange = [[emitterConfig rncat_numberForKey:@"emitRange" defaultValue:@150] integerValue];
    emitterConfiguration.threadPoolSize = [[emitterConfig rncat_numberForKey:@"threadPoolSize" defaultValue:@15] integerValue];
    emitterConfiguration.byteLimitGet = [[emitterConfig rncat_numberForKey:@"byteLimitGet" defaultValue:@40000] integerValue];
    emitterConfiguration.byteLimitPost = [[emitterConfig rncat_numberForKey:@"byteLimitPost" defaultValue:@40000] integerValue];
//    emitterConfiguration.serverAnonymisation = [emitterConfig rncat_boolForKey:@"serverAnonymisation" defaultValue:NO];

    return emitterConfiguration;
}

+ (CATSubjectConfiguration *) mkSubjectConfig:(NSDictionary *) subjectConfig {

    CATSubjectConfiguration *subjectConfiguration = [CATSubjectConfiguration new];

    NSString *userId = [subjectConfig rncat_stringForKey:@"userId" defaultValue:nil];
    if (userId) {
        subjectConfiguration.userId = userId;
    }

    NSString *networkUserId = [subjectConfig rncat_stringForKey:@"networkUserId" defaultValue:nil];
    if (networkUserId) {
        subjectConfiguration.networkUserId = networkUserId;
    }

    NSString *domainUserId = [subjectConfig rncat_stringForKey:@"domainUserId" defaultValue:nil];
    if (domainUserId) {
        subjectConfiguration.domainUserId = domainUserId;
    }

    NSString *useragent = [subjectConfig rncat_stringForKey:@"useragent" defaultValue:nil];
    if (useragent) {
        subjectConfiguration.useragent = useragent;
    }

    NSString *ipAddress = [subjectConfig rncat_stringForKey:@"ipAddress" defaultValue:nil];
    if (ipAddress) {
        subjectConfiguration.ipAddress = ipAddress;
    }

    NSString *timezone = [subjectConfig rncat_stringForKey:@"timezone" defaultValue:nil];
    if (timezone) {
        subjectConfiguration.timezone = timezone;
    }

    NSString *language = [subjectConfig rncat_stringForKey:@"language" defaultValue:nil];
    if (language) {
        subjectConfiguration.language = language;
    }

    // screenResolution - type checked RN side
    NSArray *screenRSize = [subjectConfig objectForKey:@"screenResolution"];
    if (screenRSize != nil) {
        NSNumber *resWidth = [screenRSize objectAtIndex:0];
        NSNumber *resHeight = [screenRSize objectAtIndex:1];
        CISSize *resSize = [[CISSize alloc] initWithWidth:[resWidth integerValue] height:[resHeight integerValue]];
        subjectConfiguration.screenResolution = resSize;
    }

    // screenViewport - type checked RN side
    NSArray *screenVPSize = [subjectConfig objectForKey:@"screenViewport"];
    if (screenVPSize != nil) {
        NSNumber *vpWidth = [screenVPSize objectAtIndex:0];
        NSNumber *vpHeight = [screenVPSize objectAtIndex:1];
        CISSize *vpSize = [[CISSize alloc] initWithWidth:[vpWidth integerValue] height:[vpHeight integerValue]];
        subjectConfiguration.screenViewPort = vpSize;
    }

    // colorDepth
    NSNumber *colorDepth = [subjectConfig rncat_numberForKey:@"colorDepth" defaultValue: nil];
    if (colorDepth != nil) {
        subjectConfiguration.colorDepth = colorDepth;
    }

    return subjectConfiguration;
}

+ (CATGDPRConfiguration *) mkGdprConfig:(NSDictionary *) gdprConfig {
    NSString *basis = [gdprConfig objectForKey:@"basisForProcessing"];
    NSString *docId = [gdprConfig objectForKey:@"documentId"];
    NSString *docVer = [gdprConfig objectForKey:@"documentVersion"];
    NSString *docDesc = [gdprConfig objectForKey:@"documentDescription"];

    CATGDPRConfiguration *gdprConfiguration = [[CATGDPRConfiguration alloc] initWithBasis:[RNUtilities getBasis:basis] documentId:docId documentVersion:docVer documentDescription:docDesc];

    return gdprConfiguration;
}

+ (CATGlobalContextsConfiguration *) mkGCConfig:(NSArray *) gcConfig {

    CATGlobalContextsConfiguration *gcConfiguration = [[CATGlobalContextsConfiguration alloc] init];
    //NSMutableDictionary *contextGens = [NSMutableDictionary dictionary];

    for (NSDictionary *gcMap in gcConfig) {
        NSString *itag = [gcMap objectForKey:@"tag"];
        NSArray *globalContexts = [gcMap objectForKey:@"globalContexts"];

        NSMutableArray *staticContexts = [NSMutableArray array];
        for (NSDictionary *sdj in globalContexts) {
            CATSelfDescribingJson *gContext = [[CATSelfDescribingJson alloc] initWithSchema:(NSString *)[sdj objectForKey:@"schema"]
                                                                      andDictionary:(NSDictionary *)[sdj objectForKey:@"data"]];

            [staticContexts addObject:gContext];
        }

        CATGlobalContext *gcStatic = [[CATGlobalContext alloc] initWithStaticContexts:(NSArray *)[staticContexts copy]];

        [gcConfiguration addWithTag:itag contextGenerator:gcStatic];
    }

    return gcConfiguration;
}

#if !TARGET_OS_TV
// CATClientIdSyncConfiguration (and its wvCke / wvBrdg sub-configs) are gated
// to SNOWPLOW_TARGET_IOS in the SDK and therefore do not exist on tvOS.
// Compiling this factory only on non-tvOS platforms keeps the wrapper
// tvOS-buildable; the lone caller (createTracker:) is gated identically.
+ (CATClientIdSyncConfiguration *) mkClidSyncConfig:(NSDictionary *) clidSyncConfig {
    // Public init mirrors what a native iOS consumer would do:
    //   - wvCke / wvBrdg are non-nil sub-configs
    //   - parent wvCkePresent / wvBrdgPresent = YES (app-authoritative)
    //   - wvCke.en  = YES, wvCke.enPresent  = YES, wvCke.domains = @[]
    //   - wvBrdg.en = YES, wvBrdg.enPresent = YES
    // We then mutate ONLY the fields the JS payload actually supplied, so the
    // resulting object is indistinguishable from one a native host app would
    // build via [[CATClientIdSyncConfiguration alloc] init] + property setters.
    CATClientIdSyncConfiguration *config = [[CATClientIdSyncConfiguration alloc] init];

    if (clidSyncConfig == nil || ![clidSyncConfig isKindOfClass:NSDictionary.class]) {
        return config;
    }

    @try {
        NSObject *wvCkeArg = [clidSyncConfig objectForKey:@"webViewCookie"];
        if (wvCkeArg != nil && [wvCkeArg isKindOfClass:NSDictionary.class]) {
            NSDictionary *wvCke = (NSDictionary *)wvCkeArg;

            // Use rncat_numberForKey: (not rncat_boolForKey:) so we can
            // distinguish "field absent" (nil) from "field set to false"
            // (NSNumber @NO). Only assign when JS actually supplied the field.
            NSNumber *cookieEnabled = [wvCke rncat_numberForKey:@"enabled" defaultValue:nil];
            if (cookieEnabled != nil && config.wvCke != nil) {
                config.wvCke.en = cookieEnabled.boolValue;
            }

            NSObject *domainsArg = [wvCke objectForKey:@"domains"];
            if (domainsArg != nil && [domainsArg isKindOfClass:NSArray.class] && config.wvCke != nil) {
                NSArray *raw = (NSArray *)domainsArg;
                NSMutableArray<NSString *> *domains = [NSMutableArray arrayWithCapacity:raw.count];
                for (id item in raw) {
                    // JS validates `every(d => typeof d === 'string')`, but
                    // we filter again defensively so a malformed entry never
                    // reaches the SDK.
                    if ([item isKindOfClass:NSString.class]) {
                        [domains addObject:(NSString *)item];
                    }
                }
                config.wvCke.domains = [domains copy];
            }
        }

        NSObject *wvBrdgArg = [clidSyncConfig objectForKey:@"webViewBridge"];
        if (wvBrdgArg != nil && [wvBrdgArg isKindOfClass:NSDictionary.class]) {
            NSDictionary *wvBrdg = (NSDictionary *)wvBrdgArg;

            NSNumber *bridgeEnabled = [wvBrdg rncat_numberForKey:@"enabled" defaultValue:nil];
            if (bridgeEnabled != nil && config.wvBrdg != nil) {
                config.wvBrdg.en = bridgeEnabled.boolValue;
            }
        }
    } @catch (NSException *exception) {
        // Never let a malformed JS payload crash createTracker. Falling back
        // to the default-init config keeps the SDK in its safest state and
        // matches the behaviour as if `clidSyncConfig: {}` had been supplied.
        NSLog(@"[RNConvivaAppAnalytics] mkClidSyncConfig: ignoring exception while parsing clidSyncConfig: %@", exception);
        config = [[CATClientIdSyncConfiguration alloc] init];
    }

    return config;
}
#endif

#if !TARGET_OS_TV
+ (CATSessionReplayConfiguration *) mkSessionReplayConfig:(NSDictionary *) replayConfig {
    NSMutableDictionary *json = [NSMutableDictionary dictionary];

    if (replayConfig[@"enabled"] != nil) json[@"enabled"] = replayConfig[@"enabled"];
    if (replayConfig[@"logging"] != nil) json[@"logging"] = replayConfig[@"logging"];
    if (replayConfig[@"sampling"] != nil) json[@"sampling"] = [self buildReplaySamplingJson:replayConfig[@"sampling"]];
    if (replayConfig[@"networkConfiguration"] != nil) json[@"networkConfiguration"] = [self buildReplayNetworkJson:replayConfig[@"networkConfiguration"]];
    if (replayConfig[@"emitterConfiguration"] != nil) json[@"emitterConfiguration"] = [self buildReplayEmitterJson:replayConfig[@"emitterConfiguration"]];
    if (replayConfig[@"mobRecorderConfiguration"] != nil) json[@"mobRecorderConfiguration"] = [self buildReplayRecorderJson:replayConfig[@"mobRecorderConfiguration"]];

    // Skip if no keys were recognised (empty config) or if enabled is explicitly false.
    if (json.count == 0) return nil;
    NSNumber *enabledVal = json[@"enabled"];
    if (enabledVal != nil && !enabledVal.boolValue) return nil;
    CATSessionReplayConfiguration *configuration = [[CATSessionReplayConfiguration alloc] init];
    configuration.dict = json;
    return configuration;
}

+ (NSMutableDictionary *) buildReplaySamplingJson:(NSDictionary *) sampling {
    NSMutableDictionary *samplingJson = [NSMutableDictionary dictionary];
    if (sampling[@"pct"] != nil) samplingJson[@"pct"] = sampling[@"pct"];
    return samplingJson;
}

+ (NSMutableDictionary *) buildReplayNetworkJson:(NSDictionary *) networkConfig {
    NSMutableDictionary *networkJson = [NSMutableDictionary dictionary];
    if (networkConfig[@"endpoint"] != nil) networkJson[@"endpoint"] = networkConfig[@"endpoint"];
    return networkJson;
}

+ (NSMutableDictionary *) buildReplayEmitterJson:(NSDictionary *) emitterConfig {
    NSMutableDictionary *emitterJson = [NSMutableDictionary dictionary];
    for (NSString *key in @[@"dataMode", @"uploadInterval", @"policyExpiryTime",
                             @"flushAt", @"maxBatchSize", @"maxQueueSize"]) {
        [self copyKey:key from:emitterConfig to:emitterJson];
    }
    return emitterJson;
}

+ (NSMutableDictionary *) buildReplayRecorderJson:(NSDictionary *) recorderConfig {
    NSMutableDictionary *recorderJson = [NSMutableDictionary dictionary];
    for (NSString *key in @[@"maskAllInputs", @"maskAllImages", @"maskAllSystemViews",
                             @"maskSandboxedSystemViews", @"throttleDelayMs",
                             @"compressionQuality", @"maskInputOptions"]) {
        [self copyKey:key from:recorderConfig to:recorderJson];
    }
    return recorderJson;
}

+ (void) copyKey:(NSString *) key from:(NSDictionary *) src to:(NSMutableDictionary *) dst {
    if (src[key] != nil) dst[key] = src[key];
}
#endif

@end
