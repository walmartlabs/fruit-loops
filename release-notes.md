# Release Notes

## Development

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.15.0...master)

## v0.15.0 - October 14th, 2014
- Expose hrtime to client space - 632d479
- Add page.runScript API - 8e163c4
- Optimize $ type checking - c0bc2f7

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.14.2...v0.15.0)

## v0.14.2 - October 9th, 2014
- Properly handle $.fn with derived $ instances - d28c062

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.14.1...v0.14.2)

## v0.14.1 - September 30th, 2014
- [#48](https://github.com/walmartlabs/fruit-loops/pull/48) - Fix location reset ([@Candid](https://api.github.com/users/Candid))
- [#47](https://github.com/walmartlabs/fruit-loops/pull/47) - An attempt to clean up ajax code related to cache ([@Candid](https://api.github.com/users/Candid))
- Use report for ajax cached flag calculation - 2e764cb

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.14.0...v0.14.1)

## v0.14.0 - September 18th, 2014
- [#43](https://github.com/walmartlabs/fruit-loops/pull/43) - Create a separate fn scope for each $ instance ([@kpdecker](https://api.github.com/users/kpdecker))
- [#44](https://github.com/walmartlabs/fruit-loops/pull/44) - Allow for pool queue limits ([@kpdecker](https://api.github.com/users/kpdecker))
- Convert Ajax to named class and explicitly clean - 8649171
- Avoid stack retain in RedirectError - 7e29077

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.13.0...v0.14.0)

## v0.13.0 - September 10th, 2014
- Allow metadata to be associated with page instance - 9a9c47e
- Fix handing of no-cache elements for catbox gen - 6fc93ec

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.12.1...v0.13.0)

## v0.12.1 - September 8th, 2014
- Apply timeout options to shortcircuited requests - 0a037fd

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.12.0...v0.12.1)

## v0.12.0 - September 8th, 2014
- Make source map lookup table a singleton - 542cfc0
- Update ajax options to use their own object - c7dc89e
- Allow short circuiting of ajax requests - 68c4c21
- Include requested duration in setTimeout logs - 59c84f0
- Implement Storage.clear method - 47f73c3
- Move redirect method to FruitLoops object - 5e81107

Compatibility notes:
- `ajaxCache` and `ajaxTimeout` config options moved to `ajax.cache` and `ajax.timeout`

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.11.1...v0.12.0)

## v0.11.1 - September 2nd, 2014
- Cancel client request for cached timeout - a07bf77

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.11.0...v0.11.1)

## v0.11.0 - September 2nd, 2014
- [#39](https://github.com/walmartlabs/fruit-loops/issues/39) - Determine if emit should occur immediately or after event loop ([@kpdecker](https://api.github.com/users/kpdecker))
- [#40](https://github.com/walmartlabs/fruit-loops/issues/40) - Add timeout option to ajax calls ([@kpdecker](https://api.github.com/users/kpdecker))
- [#16](https://github.com/walmartlabs/fruit-loops/issues/16) - Improve logging ([@kpdecker](https://api.github.com/users/kpdecker))
- [#41](https://github.com/walmartlabs/fruit-loops/issues/41) - Avoid instantiating new location objects on navigate ([@kpdecker](https://api.github.com/users/kpdecker))
- Use opaque id for client async timeout values - f3f493a
- Log information regarding page ajax requests - 4ab4ad1
- Move start and id variable to FruitLoops object - 2fc30e1

Compatibility notes:
- *ajax* and *events* emit now allow continuation if additional waiting operations come in on the current tick
- Timeout operations no longer return Node objects
- The following objects have been moved from `window` to `FruitLoops`
  - `window._id` -> `FruitLoops.id`
  - `window._start` -> `FruitLoops.start`

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.10.0...v0.11.0)

## v0.10.0 - August 6th, 2014
- Further isolate client from fruit loops code - e0cb0bd

Compatibility notes:
- Fruit Loops APIs have been moved to the window.FruitLoops object. Deprecated delegates are in place but will be removed prior to the 1.0 release.

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.9.2...v0.10.0)

## v0.9.2 - July 28th, 2014
- [#38](https://github.com/walmartlabs/fruit-loops/issues/38) - serverCache can leave residual data if </script> exists in content ([@kpdecker](https://api.github.com/users/kpdecker))
- Fix incorrect global </script> replace in toJSON - 3ff398f
- Push ajax test coverage to 100% - 50dfa77

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.9.1...v0.9.2)

## v0.9.1 - July 10th, 2014
- Use _redirect flag rather than instanceOf - a27207e
- Make RedirectError a consumable error - 461e201

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.9.0...v0.9.1)

## v0.9.0 - July 10th, 2014
- Invalidate caching ajax requests on reset - c9fb8d8
- Remove legacy catbox failover code - 2e45f9a
- Add Storage.key implementation - bacabbe
- Explicitly break cross context DOM links - 4dca494
- Add dispose logic for jQuery objects - d4e4fcf

Compatibility notes:
- Catbox prior to 2.0 is no longer supported

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.8.0...v0.9.0)

## v0.8.0 - July 8th, 2014
- [#35](https://github.com/walmartlabs/fruit-loops/issues/35) - Allow for custom status codes on response ([@kpdecker](https://api.github.com/users/kpdecker))
- Fix pending cleanup on script load error - 07e7557

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.7.1...v0.8.0)

## v0.7.1 - June 9th, 2014
- Use setImmediate for beforeExec - f207080

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.7.0...v0.7.1)

## v0.7.0 - June 9th, 2014
- Allow graceful error handling in beforeExec - f73a8c6
- Handle $(function(){}) calls - c07a656
- Provide user agent for ajax calls - 4039e9f
- Handle additional dispose + loader race conditon - bdff9c7

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.6.5...v0.7.0)

## v0.6.5 - May 19th, 2014
- NOP race condition with errors in loader - 49332b4
- Catch throws from file resolvers and pass along - e295fb1

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.6.4...v0.6.5)

## v0.6.4 - May 12th, 2014
- Do not run cleanup for errored views - 7f2f752
- Improve error logging for inline scripts - 989c456
- Remove newline from script output - b0fcbf5
- Refactor pages and windows into named classes - 4dcd789

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.6.3...v0.6.4)

## v0.6.3 - May 5th, 2014
- Use setImmediate to isolate client and loader code - 5a693c8

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.6.2...v0.6.3)

## v0.6.2 - April 25th, 2014
- Add a few more cleanup cases in page dispose - d4ffe29, f107376
- Safely handle syntax errors in scripts - 1ff7f12
- Add isBoom flag for tracking of Errors - 9df9252
- Simplify if conditional - bd3cdda

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.6.1...v0.6.2)

## v0.6.1 - April 22nd, 2014
- Use empty string for empty location.search - e3e74d1

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.6.0...v0.6.1)

## v0.6.0 - April 21st, 2014
- Expose pool metadata via pool.info api - a7da70e
- Include usage data in page metadata - fc07c13

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.5.5...v0.6.0)

## v0.5.5 - April 11th, 2014
- Stop page execution on redirect - 961c226
- Fix global location assignment - 092f96e
- Add comment to magic constant - 635d874

Compatibility notes:
- Any redirect operations will now throw a known error to prevent further execution of the thread. Clients may need to account for this in cleanup operations.

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.5.4...v0.5.5)

## v0.5.4 - April 11th, 2014
- Perform explicit cleanup to avoid GC strain/bugs - cb2bfc0
- Provide better names for module functions - 1545a79

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.5.3...v0.5.4)

## v0.5.3 - April 10th, 2014
- Fix memory leak in defining window.location - 3f7da77

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.5.2...v0.5.3)

## v0.5.2 - April 10th, 2014
- Add missing redirect callback to history module - edb476f

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.5.1...v0.5.2)

## v0.5.1 - April 8th, 2014
- Remove $.get override - a2c837b
- Fix buffer handling under new Cheerio - f50353f

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.5.0...v0.5.1)

## v0.5.0 - April 6th, 2014
- Add cleanup callback for pool API - 2ce9c77
- Remove console log on emit - a318950
- Ensure ajax cache url does not change - 4cf33b0

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.4.0...v0.5.0)

## v0.4.0 - March 18th, 2014
- Include response metadata in page callback - 3a112d2

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.3.0...v0.4.0)

## v0.3.0 - March 17th, 2014
- [#32](https://github.com/walmartlabs/fruit-loops/pull/32) - Add sequence ID to emit calls to prevent race ([@kpdecker](https://api.github.com/users/kpdecker))
- [#31](https://github.com/walmartlabs/fruit-loops/pull/31) - Handle non-fully qualified ajax calls ([@kpdecker](https://api.github.com/users/kpdecker))
- Update for Catbox 2.1+ APIs - bd38d13

Compatibility notes:
- AJAX Cache users need to pass in a Catbox 2.1 object or use an adapter on 1.0 object.

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.2.2...v0.3.0)

## v0.2.2 - March 11th, 2014
- Use catbox 1.x.x and hope we are dealing with that - 122d7fc
- Relax catbox version requirements - 828be40
- Fix spelling of detach method name - 63a6a61
- Wrap beforeExec callback in a pending block - e228e2a

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.2.1...v0.2.2)

## v0.2.1 - March 4th, 2014
- Use https protocol for cheerio dependency - 0901a8f
- Remove testing comment - af4bdfe

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.2.0...v0.2.1)

## v0.2.0 - March 3rd, 2014
- Initial funcitoning release

Compatibility notes:
- Numerous changes to APIs. Reviewing the documentation is highly recommended.

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.2.0...v0.2.0)

## v0.1.0 - January 7th, 2014

- Initial release
