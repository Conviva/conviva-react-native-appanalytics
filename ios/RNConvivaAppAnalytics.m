//
//  RNConvivaAppAnalytics.m
//
//  Copyright (c) 2020-2023 Snowplow Analytics Ltd. All rights reserved.
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

#import "RNConvivaAppAnalytics.h"
#import "RNConfigUtils.h"
#import "RNUtilities.h"
#import "NSDictionary+RNCAT_TypeMethods.h"

#import <ConvivaAppAnalytics/CATAppAnalytics.h>
#import <ConvivaAppAnalytics/CATNetworkConfiguration.h>
#import <ConvivaAppAnalytics/CATNetworkConnection.h>
#import <ConvivaAppAnalytics/CATTrackerConfiguration.h>
#import <ConvivaAppAnalytics/CATSessionConfiguration.h>
#import <ConvivaAppAnalytics/CATEmitterConfiguration.h>
#import <ConvivaAppAnalytics/CATSubjectConfiguration.h>
#import <ConvivaAppAnalytics/CATGDPRConfiguration.h>
#import <ConvivaAppAnalytics/CATGlobalContextsConfiguration.h>
#import <ConvivaAppAnalytics/CATGlobalContext.h>
#import <ConvivaAppAnalytics/CATSelfDescribingJson.h>
#import <ConvivaAppAnalytics/CATSelfDescribing.h>
#import <ConvivaAppAnalytics/CATScreenView.h>
#import <ConvivaAppAnalytics/CATPageView.h>
#import <ConvivaAppAnalytics/CATTiming.h>
#import <ConvivaAppAnalytics/CATConsentGranted.h>
#import <ConvivaAppAnalytics/CATConsentWithdrawn.h>
#import <ConvivaAppAnalytics/CATStructured.h>
#import <ConvivaAppAnalytics/CATEcommerceItem.h>
#import <ConvivaAppAnalytics/CATEcommerce.h>
#import <ConvivaAppAnalytics/CATDeepLinkReceived.h>
#import <ConvivaAppAnalytics/CATMessageNotification.h>


@implementation RNConvivaTracker

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(createTracker:
                  (NSDictionary *)argmap
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSString *trackerNs = @"CAT";[argmap objectForKey:@"namespace"];
    NSString *appName = [argmap objectForKey:@"appName"];
    NSString *customerKey = [argmap objectForKey:@"customerKey"];
    NSDictionary *networkConfig =[argmap objectForKey:@"networkConfig"];

    CATNetworkConfiguration *networkConfiguration = nil;
    if(nil != networkConfig){
        
        // NetworkConfiguration
        NSString *method = [networkConfig rncat_stringForKey:@"method" defaultValue:nil];
        CATHttpMethod httpMethod = CATHttpMethodPost;
        
        if(0 < [method length]){
            httpMethod = [@"get" isEqualToString:method] ? CATHttpMethodGet : CATHttpMethodPost;
        }
        
        NSString *endpoint = networkConfig[@"endpoint"];
        
        if(0 < [endpoint length]) {
            networkConfiguration = [[CATNetworkConfiguration alloc] initWithEndpoint:networkConfig[@"endpoint"] method:httpMethod];
        }
        
        NSString *customPostPath = [networkConfig rncat_stringForKey:@"customPostPath" defaultValue:nil];
        if (0 < [customPostPath length]) {
            networkConfiguration.customPostPath = customPostPath;
        }
        
        NSObject *requestHeaders = [networkConfig objectForKey:@"requestHeaders"];
        if (requestHeaders != nil && [requestHeaders isKindOfClass:NSDictionary.class]) {
            networkConfiguration.requestHeaders = (NSDictionary *)requestHeaders;
        }
    }

    // Configurations
    NSMutableArray *controllers = [NSMutableArray array];

    // TrackerConfiguration
    NSObject *trackerArg = [argmap objectForKey:@"trackerConfig"];
    if (trackerArg != nil && [trackerArg isKindOfClass:NSDictionary.class]) {
        CATTrackerConfiguration *trackerConfiguration = [RNConfigUtils mkTrackerConfig:(NSDictionary *)trackerArg];
        [controllers addObject:trackerConfiguration];
    }
    else{
        CATTrackerConfiguration *trackerConfiguration = [RNConfigUtils mkDefaultTrackerConfig];
        [controllers addObject:trackerConfiguration];
    }

    // SessionConfiguration
    NSObject *sessionArg = [argmap objectForKey:@"sessionConfig"];
    if (sessionArg != nil && [sessionArg isKindOfClass:NSDictionary.class]) {
        CATSessionConfiguration *sessionConfiguration = [RNConfigUtils mkSessionConfig:(NSDictionary *)sessionArg];
        [controllers addObject:sessionConfiguration];
    }

    // EmitterConfiguration
    NSObject *emitterArg = [argmap objectForKey:@"emitterConfig"];
    if (emitterArg !=nil && [emitterArg isKindOfClass:NSDictionary.class]) {
        CATEmitterConfiguration *emitterConfiguration = [RNConfigUtils mkEmitterConfig:(NSDictionary *)emitterArg];
        [controllers addObject:emitterConfiguration];
    }

    // SubjectConfiguration
    NSObject *subjectArg = [argmap objectForKey:@"subjectConfig"];
    if (subjectArg != nil && [subjectArg isKindOfClass:NSDictionary.class]) {
        CATSubjectConfiguration *subjectConfiguration = [RNConfigUtils mkSubjectConfig:(NSDictionary *)subjectArg];
        [controllers addObject:subjectConfiguration];
    }

    // GdprConfiguration
    NSObject *gdprArg = [argmap objectForKey:@"gdprConfig"];
    if (gdprArg != nil && [gdprArg isKindOfClass:NSDictionary.class]) {
        CATGDPRConfiguration *gdprConfiguration = [RNConfigUtils mkGdprConfig:(NSDictionary *)gdprArg];
        [controllers addObject:gdprConfiguration];
    }

    // GConfiguration
    NSObject *gcArg = [argmap objectForKey:@"gcConfig"];
    if (gcArg != nil && [gcArg isKindOfClass:NSArray.class]) {
        CATGlobalContextsConfiguration *gcConfiguration = [RNConfigUtils mkGCConfig:(NSArray *)gcArg];
        [controllers addObject:gcConfiguration];
    }
    
    id<CATTrackerController> tracker = nil;
    if(nil != networkConfiguration){
        tracker = [CATAppAnalytics createTrackerWithCustomerKey:customerKey
                                                        appName:appName
                                                        network:networkConfiguration
                                                 configurations:controllers];
    }
    else{
        tracker = [CATAppAnalytics createTrackerWithCustomerKey:customerKey
                                                        appName:appName
                                                 configurations:controllers];
    }
    
    if (tracker) {
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker initialization failed", error);
    }
}

RCT_EXPORT_METHOD(removeTracker: (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];
    BOOL removed = [CATAppAnalytics removeTracker:trackerController];
    resolve(@(removed));
}

RCT_EXPORT_METHOD(removeAllTrackers: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    [CATAppAnalytics removeAllTrackers];
    resolve(@YES);
}

RCT_EXPORT_METHOD(trackSelfDescribingEvent:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        CATSelfDescribingJson *eventData = [[CATSelfDescribingJson alloc] initWithSchema:(NSString *)[argmap objectForKey:@"schema"]
                                                                         andDictionary:(NSDictionary *)[argmap objectForKey:@"data"]];

        CATSelfDescribing *event = [[CATSelfDescribing alloc] initWithEventData:eventData];
        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackStructuredEvent:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        NSString *category = [argmap rncat_stringForKey:@"category" defaultValue:nil];
        NSString *action = [argmap rncat_stringForKey:@"action" defaultValue:nil];
        CATStructured *event = [[CATStructured alloc] initWithCategory:category
                                                              action:action];
        NSString *label = [argmap rncat_stringForKey:@"label" defaultValue:nil];
        if (label) {
            event.label = label;
        }
        NSString *property = [argmap rncat_stringForKey:@"property" defaultValue:nil];
        if (property) {
            event.property = property;
        }
        NSNumber *value = [argmap rncat_numberForKey:@"value" defaultValue:nil];
        if (label) {
            event.value = value;
        }

        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackScreenViewEvent:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        NSString *screenName = [argmap rncat_stringForKey:@"name" defaultValue:nil];
        NSString *screenId = [argmap rncat_stringForKey:@"id" defaultValue:nil];
        NSUUID *screenUuid = [[NSUUID alloc] initWithUUIDString:screenId];
        if (screenId != nil && screenUuid == nil) {
            NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
            reject(@"ERROR", @"screenId has to be a valid UUID string", error);
        }
        CATScreenView *event = [[CATScreenView alloc] initWithName:screenName
                                                        screenId:screenUuid];

        NSString *type = [argmap rncat_stringForKey:@"type" defaultValue:nil];
        if (type) {
            event.type = type;
        }
        NSString *previousName = [argmap rncat_stringForKey:@"previousName" defaultValue:nil];
        if (previousName) {
            event.previousName = previousName;
        }
        NSString *previousId = [argmap rncat_stringForKey:@"previousId" defaultValue:nil];
        if (previousId) {
            event.previousId = previousId;
        }
        NSString *previousType = [argmap rncat_stringForKey:@"previousType" defaultValue:nil];
        if (previousType) {
            event.previousType = previousType;
        }
        NSString *transitionType = [argmap rncat_stringForKey:@"transitionType" defaultValue:nil];
        if (transitionType) {
            event.transitionType = transitionType;
        }

        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackPageView:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        NSString *pageUrl = [argmap rncat_stringForKey:@"pageUrl" defaultValue:nil];
        CATPageView *event = [[CATPageView alloc] initWithPageUrl:pageUrl];

        NSString *pageTitle = [argmap rncat_stringForKey:@"pageTitle" defaultValue:nil];
        if (pageTitle) {
            event.pageTitle = pageTitle;
        }
        NSString *referrer = [argmap rncat_stringForKey:@"referrer" defaultValue:nil];
        if (referrer) {
            event.referrer = referrer;
        }

        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackTimingEvent:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        NSString *category = [argmap rncat_stringForKey:@"category" defaultValue:nil];
        NSString *variable = [argmap rncat_stringForKey:@"variable" defaultValue:nil];
        NSNumber *timing = [argmap rncat_numberForKey:@"timing" defaultValue:nil];
        CATTiming *event = [[CATTiming alloc] initWithCategory:category
                                                    variable:variable
                                                      timing:timing];
        NSString *label = [argmap rncat_stringForKey:@"label" defaultValue:nil];
        if (label) {
            event.label = label;
        }

        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackConsentGrantedEvent:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        NSString *expiry = [argmap rncat_stringForKey:@"expiry" defaultValue:nil];
        NSString *documentId = [argmap rncat_stringForKey:@"documentId" defaultValue:nil];
        NSString *version = [argmap rncat_stringForKey:@"version" defaultValue:nil];
        CATConsentGranted *event = [[CATConsentGranted alloc] initWithExpiry:expiry
                                                                documentId:documentId
                                                                   version:version];

        NSString *name = [argmap rncat_stringForKey:@"name" defaultValue:nil];
        if (name) {
            event.name = name;
        }
        NSString *documentDescription = [argmap rncat_stringForKey:@"documentDescription" defaultValue:nil];
        if (documentDescription) {
            event.documentDescription = documentDescription;
        }

        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackConsentWithdrawnEvent:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        CATConsentWithdrawn *event = [CATConsentWithdrawn new];

        BOOL all = [argmap rncat_boolForKey:@"all" defaultValue:nil];
        event.all = all;
        NSString *documentId = [argmap rncat_stringForKey:@"documentId" defaultValue:nil];
        event.documentId = documentId;
        NSString *version = [argmap rncat_stringForKey:@"version" defaultValue:nil];
        event.version = version;
        NSString *name = [argmap rncat_stringForKey:@"name" defaultValue:nil];
        if (name) {
            event.name = name;
        }
        NSString *documentDescription = [argmap rncat_stringForKey:@"documentDescription" defaultValue:nil];
        if (documentDescription) {
            event.documentDescription = documentDescription;
        }

        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackEcommerceTransactionEvent:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        NSString *orderId = [argmap rncat_stringForKey:@"orderId" defaultValue:nil];
        NSNumber *totalValue = [argmap rncat_numberForKey:@"totalValue" defaultValue:nil];
        NSArray *items = [argmap objectForKey:@"items"];

        NSMutableArray *transItems = [NSMutableArray new];
        for (NSDictionary* item in items) {
            NSString *sku = [item rncat_stringForKey:@"sku" defaultValue:nil];
            NSNumber *price = [item rncat_numberForKey:@"price" defaultValue:nil];
            NSNumber *quantity = [item rncat_numberForKey:@"quantity" defaultValue:nil];
            CATEcommerceItem *ecomItem = [[CATEcommerceItem alloc] initWithSku:sku
                                                                       price:price
                                                                    quantity:quantity];

            NSString *name = [argmap rncat_stringForKey:@"name" defaultValue:nil];
            if (name) {
                ecomItem.name = name;
            }
            NSString *category = [argmap rncat_stringForKey:@"category" defaultValue:nil];
            if (category) {
                ecomItem.category = category;
            }
            NSString *currency = [argmap rncat_stringForKey:@"currency" defaultValue:nil];
            if (currency) {
                ecomItem.currency = currency;
            }

            [transItems addObject:ecomItem];
        }

        CATEcommerce *event = [[CATEcommerce alloc] initWithOrderId:orderId
                                                       totalValue:totalValue
                                                            items:(NSArray<CATEcommerceItem *> *)transItems];
        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);

    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackDeepLinkReceivedEvent:
    (NSDictionary *)details
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        NSString *url = [argmap rncat_stringForKey:@"url" defaultValue:nil];
        CATDeepLinkReceived *event = [[CATDeepLinkReceived alloc] initWithUrl:url];

        NSString *referrer = [argmap rncat_stringForKey:@"referrer" defaultValue:nil];
        if (referrer) {
            event.referrer = referrer;
        }

        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackMessageNotificationEvent:
    (NSDictionary *)details
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *argmap = [details objectForKey:@"eventData"];
        NSArray<NSDictionary *> *contexts = [details objectForKey:@"contexts"];

        NSString *title = [argmap rncat_stringForKey:@"title" defaultValue:nil];
        NSString *body = [argmap rncat_stringForKey:@"body" defaultValue:nil];
        NSString *triggerStr = [argmap rncat_stringForKey:@"trigger" defaultValue:nil];
        CATMessageNotificationTrigger trigger;
        if ([triggerStr isEqualToString:@"push"]) {
            trigger = CATMessageNotificationTriggerPush;
        } else if ([triggerStr isEqualToString:@"location"]) {
            trigger = CATMessageNotificationTriggerLocation;
        } else if ([triggerStr isEqualToString:@"calendar"]) {
            trigger = CATMessageNotificationTriggerCalendar;
        } else if ([triggerStr isEqualToString:@"timeInterval"]) {
            trigger = CATMessageNotificationTriggerTimeInterval;
        } else {
            trigger = CATMessageNotificationTriggerOther;
        }
        CATMessageNotification *event = [[CATMessageNotification alloc] initWithTitle: title
                                                                               body: body
                                                                            trigger: trigger];

        NSString *action = [argmap rncat_stringForKey:@"action" defaultValue:nil];
        if (action) {
            event.action = action;
        }
        NSArray *attachmentsMap = [argmap objectForKey:@"attachments"];
        if (attachmentsMap) {
            NSMutableArray *attachments = [NSMutableArray new];
            for (NSDictionary* attachmentMap in attachmentsMap) {
                NSString *identifier = [attachmentMap rncat_stringForKey:@"identifier" defaultValue:nil];
                NSString *type = [attachmentMap rncat_stringForKey:@"type" defaultValue:nil];
                NSString *url = [attachmentMap rncat_stringForKey:@"url" defaultValue:nil];
                CATMessageNotificationAttachment *attachment = [[CATMessageNotificationAttachment alloc] initWithIdentifier:identifier
                                                                                                                     type:type
                                                                                                                      url:url];
                [attachments addObject:attachment];
            }
            event.attachments = attachments;
        }
        NSArray<NSString *> *bodyLocArgs = [argmap objectForKey:@"bodyLocArgs"];
        if (bodyLocArgs) {
            event.bodyLocArgs = bodyLocArgs;
        }
        NSString *bodyLocKey = [argmap rncat_stringForKey:@"bodyLocKey" defaultValue:nil];
        if (bodyLocKey) {
            event.bodyLocKey = bodyLocKey;
        }
        NSString *category = [argmap rncat_stringForKey:@"category" defaultValue:nil];
        if (category) {
            event.category = category;
        }
        NSNumber *contentAvailable = [argmap rncat_numberForKey:@"contentAvailable" defaultValue:nil];
        if (contentAvailable != nil) {
            event.contentAvailable = contentAvailable;
        }
        NSString *group = [argmap rncat_stringForKey:@"group" defaultValue:nil];
        if (group) {
            event.group = group;
        }
        NSString *icon = [argmap rncat_stringForKey:@"icon" defaultValue:nil];
        if (icon) {
            event.icon = icon;
        }
        NSNumber *notificationCount = [argmap rncat_numberForKey:@"notificationCount" defaultValue:nil];
        if (notificationCount) {
            event.notificationCount = notificationCount;
        }
        NSString *notificationTimestamp = [argmap rncat_stringForKey:@"notificationTimestamp" defaultValue:nil];
        if (notificationTimestamp) {
            event.notificationTimestamp = notificationTimestamp;
        }
        NSString *sound = [argmap rncat_stringForKey:@"sound" defaultValue:nil];
        if (sound) {
            event.sound = sound;
        }
        NSString *subtitle = [argmap rncat_stringForKey:@"subtitle" defaultValue:nil];
        if (subtitle) {
            event.subtitle = subtitle;
        }
        NSString *tag = [argmap rncat_stringForKey:@"tag" defaultValue:nil];
        if (tag) {
            event.tag = tag;
        }
        NSString *threadIdentifier = [argmap rncat_stringForKey:@"threadIdentifier" defaultValue:nil];
        if (threadIdentifier) {
            event.threadIdentifier = threadIdentifier;
        }
        NSArray<NSString *> *titleLocArgs = [argmap objectForKey:@"titleLocArgs"];
        if (titleLocArgs) {
            event.titleLocArgs = titleLocArgs;
        }
        NSString *titleLocKey = [argmap rncat_stringForKey:@"titleLocKey" defaultValue:nil];
        if (titleLocKey) {
            event.titleLocKey = titleLocKey;
        }

        [event contexts:[RNUtilities mkSDJArray:contexts]];
        [trackerController track:event];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(trackCustomEvent:
    (NSDictionary *)details
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
   
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *eventName = [details objectForKey:@"eventName"];
        NSString *eventData = [details objectForKey:@"eventData"];

        if(0 < eventName.length){
            [trackerController trackCustomEvent:eventName data:eventData];
        }
        
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setCustomTags:
    (NSDictionary *)details
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
   
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *tags = [details objectForKey:@"tags"];

        if(0 < tags.count){
            [trackerController setCustomTags:tags];
        }
        
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setCustomTagsWithCategory:
    (NSDictionary *)details
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
   
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *category = [details objectForKey:@"category"];
        NSDictionary *tags = [details objectForKey:@"tags"];

        if(0 < category.length && 0 < tags.count){
            [trackerController setCustomTags:category tags:tags];
        }
        
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(clearCustomTags:
    (NSDictionary *)details
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
   
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSArray *tags = [details objectForKey:@"tagKeys"];

        if(0 < tags.count){
            [trackerController clearCustomTags:tags];
        }
        
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(clearAllCustomTags:
    (NSDictionary *)details
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
   
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {

        [trackerController clearCustomTags];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(removeGlobalContexts:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *tag = [details objectForKey:@"removeTag"];
        [[trackerController globalContexts] removeWithTag:tag];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(addGlobalContexts:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSDictionary *gcArg = [details objectForKey:@"addGlobalContext"];
        NSString *tag = [gcArg objectForKey:@"tag"];
        NSArray *globalContexts = [gcArg objectForKey:@"globalContexts"];

        NSArray *staticContexts = [[RNUtilities mkSDJArray:globalContexts] mutableCopy];
        CATGlobalContext *gcStatic = [[CATGlobalContext alloc] initWithStaticContexts:staticContexts];

        [[trackerController globalContexts] addWithTag:tag contextGenerator:gcStatic];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setUserId:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *newUid = [details rncat_stringForKey:@"userId" defaultValue:nil];
        [trackerController.subject setUserId:newUid];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setNetworkUserId:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *newNuid = [details rncat_stringForKey:@"networkUserId" defaultValue:nil];
        [trackerController.subject setNetworkUserId:newNuid];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setDomainUserId:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *newDuid = [details rncat_stringForKey:@"domainUserId" defaultValue:nil];
        [trackerController.subject setDomainUserId:newDuid];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setIpAddress:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *newIp = [details rncat_stringForKey:@"ipAddress" defaultValue:nil];
        [trackerController.subject setIpAddress:newIp];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setUseragent:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *newUagent = [details rncat_stringForKey:@"useragent" defaultValue:nil];
        [trackerController.subject setUseragent:newUagent];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setTimezone:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *newTz = [details rncat_stringForKey:@"timezone" defaultValue:nil];
        [trackerController.subject setTimezone:newTz];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setLanguage:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *newLang = [details rncat_stringForKey:@"language" defaultValue:nil];
        [trackerController.subject setLanguage:newLang];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setScreenResolution:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSObject *newRes = [details objectForKey:@"screenResolution"];
        if (newRes == [NSNull null]) {
            [trackerController.subject setScreenResolution:nil];
        } else {
            NSNumber *resWidth = [(NSArray *)newRes objectAtIndex:0];
            NSNumber *resHeight = [(NSArray *)newRes objectAtIndex:1];
            CISSize *resSize = [[CISSize alloc] initWithWidth:[resWidth integerValue] height:[resHeight integerValue]];
            [trackerController.subject setScreenResolution:resSize];
        }
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setScreenViewport:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSObject *newView = [details objectForKey:@"screenViewport"];
        if (newView == [NSNull null]) {
            [trackerController.subject setScreenViewPort:nil];
        } else {
            NSNumber *vpWidth = [(NSArray *)newView objectAtIndex:0];
            NSNumber *vpHeight = [(NSArray *)newView objectAtIndex:1];
            CISSize *vpSize = [[CISSize alloc] initWithWidth:[vpWidth integerValue] height:[vpHeight integerValue]];
            [trackerController.subject setScreenViewPort:vpSize];
        }
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(setColorDepth:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSNumber *newColorD = [details rncat_numberForKey:@"colorDepth" defaultValue:nil];
        [trackerController.subject setColorDepth:newColorD];
        resolve(@YES);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(getSessionUserId:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *suid = [trackerController.session userId];
        resolve(suid);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(getSessionId:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSString *sid = [trackerController.session sessionId];
        resolve(sid);
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(getSessionIndex:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSInteger sidx = [trackerController.session sessionIndex];
        resolve(@(sidx));
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(getIsInBackground:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        BOOL isInBg = [trackerController.session isInBackground];
        resolve(@(isInBg));
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(getBackgroundIndex:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSInteger bgIdx = [trackerController.session backgroundIndex];
        resolve(@(bgIdx));
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

RCT_EXPORT_METHOD(getForegroundIndex:
                  (NSDictionary *)details
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *namespace = [details objectForKey:@"tracker"];
    id<CATTrackerController> trackerController = [self trackerByNamespace:namespace];

    if (trackerController != nil) {
        NSInteger fgIdx = [trackerController.session foregroundIndex];
        resolve(@(fgIdx));
    } else {
        NSError* error = [NSError errorWithDomain:@"ConvivaAppAnalytics" code:200 userInfo:nil];
        reject(@"ERROR", @"tracker with given namespace not found", error);
    }
}

- (nullable id<CATTrackerController>)trackerByNamespace:(NSString *)namespace {
    return [namespace isEqual:[NSNull null]] ? [CATAppAnalytics defaultTracker] : [CATAppAnalytics trackerByNamespace:namespace];
}

@end
