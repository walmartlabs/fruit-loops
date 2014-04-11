# Release Notes

## Development

[Commits](https://github.com/walmartlabs/fruit-loops/compare/v0.5.3...master)

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
