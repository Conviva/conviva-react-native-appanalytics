//
//  RNUtilities.m
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
//  express or implied. See the Apache License Version 2.0 for the CATecific
//  language governing permissions and limitations there under.
//
//  Copyright: Copyright (c) 2023 Snowplow Analytics Ltd
//  License: Apache License Version 2.0
//

#import "RNUtilities.h"
#import <Foundation/Foundation.h>
#import <ConvivaAppAnalytics/CATGDPRConfiguration.h>
#import <ConvivaAppAnalytics/CATSelfDescribingJson.h>

@implementation RNUtilities

+ (NSDictionary *) removeNSNullFromDict:(NSDictionary *)dictionary {
    const NSMutableDictionary *newDict = [dictionary mutableCopy];
    const id nullPointer = [NSNull null];

    for (NSString *key in dictionary) {
        id obj = [dictionary objectForKey:key];
        if (obj == nullPointer) {
            [newDict removeObjectForKey:key];
        }
    }
    return [NSDictionary dictionaryWithDictionary:[newDict copy]];
}

+ (CISGdprProcessingBasis) getBasis:(NSString *)basis {
    if ([basis isEqualToString:@"consent"]) {
        return CISGdprProcessingBasisConsent;
    } else if ([basis isEqualToString:@"contract"]) {
        return CISGdprProcessingBasisContract;
    } else if ([basis isEqualToString:@"legal_obligation"]) {
        return CISGdprProcessingBasisLegalObligation;
    } else if ([basis isEqualToString:@"legitimate_interests"]) {
        return CISGdprProcessingBasisLegitimateInterests;
    } else if ([basis isEqualToString:@"public_task"]) {
        return CISGdprProcessingBasisPublicTask;
    } else {
        return CISGdprProcessingBasisVitalInterest;;
    }
}

+ (NSMutableArray *) mkSDJArray:(NSArray<NSDictionary *> *)sdjArray {
    NSMutableArray *sdjs = [NSMutableArray array];
    for (NSDictionary* sdj in sdjArray) {
        CATSelfDescribingJson *nativeSdj = [[CATSelfDescribingJson alloc] initWithSchema:(NSString *)[sdj objectForKey:@"schema"]
                                                                      andDictionary:(NSDictionary *)[sdj objectForKey:@"data"]];
        [sdjs addObject:nativeSdj];
    }

    return sdjs;
}

@end
