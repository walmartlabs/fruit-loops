# Release Notes

## Development

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.7.1...master)

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
