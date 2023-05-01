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

@interface RNConfigUtils : NSObject

+ (CATTrackerConfiguration *) mkDefaultTrackerConfig;

+ (CATTrackerConfiguration *) mkTrackerConfig:(NSDictionary *) trackerConfig;

+ (CATSessionConfiguration *) mkSessionConfig:(NSDictionary *) sessionConfig;

+ (CATEmitterConfiguration *) mkEmitterConfig:(NSDictionary *) emitterConfig;

+ (CATSubjectConfiguration *) mkSubjectConfig:(NSDictionary *) subjectConfig;

+ (CATGDPRConfiguration *) mkGdprConfig:(NSDictionary *) gdprConfig;

+ (CATGlobalContextsConfiguration *) mkGCConfig:(NSArray *) gcConfig;

@end
