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

@end
