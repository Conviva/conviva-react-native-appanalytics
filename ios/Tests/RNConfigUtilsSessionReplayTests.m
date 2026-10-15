//
//  RNConfigUtilsSessionReplayTests.m
//
//  Unit tests for RNConfigUtils +mkSessionReplayConfig:
//
//  Focus: the bridge-layer guard logic added to align iOS with Android:
//
//    Guard 1 - Empty NSDictionary:
//        json.count == 0 -> return nil.
//        Fills iOS gap: CATTracker.startSessionReplay would have fired configDidChange
//        notification with an empty dict without this check.
//
//    Guard 2 - enabled:false:
//        enabledVal != nil && !enabledVal.boolValue -> return nil.
//        Fills iOS gap: CATTracker.startSessionReplay had no enabled check before posting
//        the configDidChange notification.
//
//    Guard 3 - Partial config (enabled key absent):
//        Non-empty dict without enabled key -> CATSessionReplayConfiguration created.
//        Remote config may activate replay even when JS omits enabled:true.
//
//  Setup: this file must be compiled into the RNConvivaAppAnalyticsTests target,
//  which links ConvivaAppAnalytics.framework (required for CATSessionReplayConfiguration).
//

#import <XCTest/XCTest.h>
#import <Foundation/Foundation.h>
#import "RNConfigUtils.h"

#if !TARGET_OS_TV

@interface RNConfigUtilsSessionReplayTests : XCTestCase
@end

@implementation RNConfigUtilsSessionReplayTests

#pragma mark - Guard 1: empty dictionary

- (void)testEmptyDict_returnsNil {
    // No keys -> json.count == 0 -> guard fires -> nil returned.
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{}];
    XCTAssertNil(result, @"Empty config must return nil - nothing to register");
}

#pragma mark - Guard 2: enabled:false

- (void)testEnabledFalse_returnsNil {
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @NO
    }];
    XCTAssertNil(result, @"enabled:false alone must return nil");
}

- (void)testEnabledFalse_withExtraKeys_returnsNil {
    // Other keys present but enabled:false takes precedence.
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @NO,
        @"logging": @YES,
        @"sampling": @{ @"pct": @100 }
    }];
    XCTAssertNil(result, @"enabled:false with other keys must still return nil");
}

- (void)testEnabledFalse_asNSNumber_zero_returnsNil {
    // JS bridge sends @0 for false - boolValue of @0 is NO.
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @0
    }];
    XCTAssertNil(result, @"enabled:0 (NSNumber) must also return nil");
}

#pragma mark - Guard 3: enabled absent - passed through

- (void)testPartialConfig_noEnabledKey_returnsNonNil {
    // Remote config use case: enabled absent, other keys present.
    // Neither guard fires - config must be created and returned.
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"logging": @YES,
        @"sampling": @{ @"pct": @50 }
    }];
    XCTAssertNotNil(result, @"Partial config without enabled key must not be discarded");
}

- (void)testEnabledTrue_returnsNonNil {
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @YES
    }];
    XCTAssertNotNil(result, @"enabled:true must produce a CATSessionReplayConfiguration");
}

#pragma mark - Positive path: all nested sub-configs

- (void)testNetworkConfiguration_returnsNonNil {
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @YES,
        @"networkConfiguration": @{ @"endpoint": @"https://rcg.conviva.com" }
    }];
    XCTAssertNotNil(result, @"networkConfiguration must be accepted");
}

- (void)testEmitterConfiguration_allFields_returnsNonNil {
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @YES,
        @"emitterConfiguration": @{
            @"dataMode": @"wifi",
            @"uploadInterval": @30,
            @"policyExpiryTime": @3600,
            @"flushAt": @20,
            @"maxBatchSize": @120,
            @"maxQueueSize": @1000
        }
    }];
    XCTAssertNotNil(result, @"emitterConfiguration with all fields must be accepted");
}

- (void)testMobRecorderConfiguration_maskingFlags_returnsNonNil {
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @YES,
        @"mobRecorderConfiguration": @{
            @"maskAllInputs": @YES,
            @"maskAllImages": @YES,
            @"maskAllSystemViews": @YES,
            @"maskSandboxedSystemViews": @YES,
            @"throttleDelayMs": @1000,
            @"compressionQuality": @10
        }
    }];
    XCTAssertNotNil(result, @"mobRecorderConfiguration with masking flags must be accepted");
}

- (void)testMobRecorderConfiguration_maskInputOptions_array_returnsNonNil {
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @YES,
        @"mobRecorderConfiguration": @{
            @"maskAllInputs": @YES,
            @"maskInputOptions": @[@"emailAddress", @"password", @"telephoneNumber"]
        }
    }];
    XCTAssertNotNil(result, @"maskInputOptions string array must be accepted");
}

- (void)testFullConfig_allFields_returnsNonNil {
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @YES,
        @"logging": @YES,
        @"sampling": @{ @"pct": @80 },
        @"networkConfiguration": @{ @"endpoint": @"https://rcg.conviva.com" },
        @"emitterConfiguration": @{
            @"dataMode": @"wifi",
            @"uploadInterval": @30,
            @"policyExpiryTime": @3600,
            @"flushAt": @20,
            @"maxBatchSize": @120,
            @"maxQueueSize": @1000
        },
        @"mobRecorderConfiguration": @{
            @"maskAllInputs": @YES,
            @"maskAllImages": @YES,
            @"maskAllSystemViews": @YES,
            @"maskSandboxedSystemViews": @YES,
            @"maskInputOptions": @[@"emailAddress", @"password"],
            @"throttleDelayMs": @1000,
            @"compressionQuality": @10
        }
    }];
    XCTAssertNotNil(result, @"Full config must produce a CATSessionReplayConfiguration");
}

#pragma mark - Nil safety: unknown keys are silently ignored

- (void)testUnknownTopLevelKey_isIgnored_nonNilReturned {
    // Unknown keys are not read; they don't appear in the built JSON.
    // The config still has enabled:true so it must be returned.
    CATSessionReplayConfiguration *result = [RNConfigUtils mkSessionReplayConfig:@{
        @"enabled": @YES,
        @"unknownFutureKey": @"someValue"
    }];
    XCTAssertNotNil(result, @"Unknown keys must be silently ignored");
}

@end

#endif
