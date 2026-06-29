//
//  RNConfigUtils.h
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

#import <Foundation/Foundation.h>

#import <ConvivaAppAnalytics/CATTrackerConfiguration.h>
#import <ConvivaAppAnalytics/CATSessionConfiguration.h>
#import <ConvivaAppAnalytics/CATEmitterConfiguration.h>
#import <ConvivaAppAnalytics/CATSubjectConfiguration.h>
#import <ConvivaAppAnalytics/CATGDPRConfiguration.h>
#import <ConvivaAppAnalytics/CATGlobalContextsConfiguration.h>
#if !TARGET_OS_TV
// CATSessionReplayConfiguration and CATClientIdSyncConfiguration are both
// gated to SNOWPLOW_TARGET_IOS in the SDK and are not declared on tvOS.
// Mirror the gate here to keep the wrapper tvOS-buildable.
#import <ConvivaAppAnalytics/CATSessionReplayConfiguration.h>
#import <ConvivaAppAnalytics/CATClientIdSyncConfiguration.h>
#endif

@interface RNConfigUtils : NSObject

+ (CATTrackerConfiguration *) mkDefaultTrackerConfig;

+ (CATTrackerConfiguration *) mkTrackerConfig:(NSDictionary *) trackerConfig;

+ (CATSessionConfiguration *) mkSessionConfig:(NSDictionary *) sessionConfig;

+ (CATEmitterConfiguration *) mkEmitterConfig:(NSDictionary *) emitterConfig;

+ (CATSubjectConfiguration *) mkSubjectConfig:(NSDictionary *) subjectConfig;

+ (CATGDPRConfiguration *) mkGdprConfig:(NSDictionary *) gdprConfig;

+ (CATGlobalContextsConfiguration *) mkGCConfig:(NSArray *) gcConfig;

#if !TARGET_OS_TV
/**
 * Builds a CATSessionReplayConfiguration from the JS sessionReplayConfig dictionary.
 * The JS config mirrors the native nested JSON schema and is passed through directly.
 * Not declared on tvOS - screen capture is not a tvOS capability.
 */
+ (nullable CATSessionReplayConfiguration *) mkSessionReplayConfig:(NSDictionary *) replayConfig;

+ (NSMutableDictionary *) buildReplaySamplingJson:(NSDictionary *) sampling;
+ (NSMutableDictionary *) buildReplayNetworkJson:(NSDictionary *) networkConfig;
+ (NSMutableDictionary *) buildReplayEmitterJson:(NSDictionary *) emitterConfig;
+ (NSMutableDictionary *) buildReplayRecorderJson:(NSDictionary *) recorderConfig;
+ (void) copyKey:(NSString *) key from:(NSDictionary *) src to:(NSMutableDictionary *) dst;
#endif

#if !TARGET_OS_TV
+ (CATClientIdSyncConfiguration *) mkClidSyncConfig:(NSDictionary *) clidSyncConfig;
#endif

@end
