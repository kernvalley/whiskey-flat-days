<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Update `@kernvalley/components` in `/mayor/embed/`

## [v3.0.8] - 2024-01-29

### Added
- Add image to Whiskey Flat Mayor Events

### Changed
- Update `@kernvalley/components` to 1.1.4

## [v3.0.6] - 2024-01-21

### Added
- Add `/mayors/events.json`
- Add `/mayors/embed/` using `@kernvalley/components/wfd/mayor-events.js` / `<wfd-mayor-events>`

### Changed
- Add missing CORS headers to `/mayors/events.json`
- Update `@kernvalley/components`
- Update embed styles and directory structure

## [v3.0.5] - 2024-01-15

### Added
- List Mayor cause on profiles & mayor candidate list
- Structured data for mayor profile donation links & events
 
### Changed
- Misc. mayor info updates
- Misc. style updates

## [v3.0.4] - 2024-01-14

### Added
- Add Google Calendar embed (via `<button>` & `<iframe>`) to Mayor profiles
- Sort & filter mayor events

### Changed
- Update importmap and script SRI, etc
- Update Mayor event layout/styles

## [v3.0.3] - 2024-01-13

### Fixed
- Fix mayor campaign slogan
- Fix/update logo for GoFundMe mark

## [v3.0.2] - 2024-01-13

### Added
- Create WF Mayor Profiles

### Changed
- Build `/mayors/` based on `_mayors/*` candidates/data
- Update all `api/.js` to be `api/*.cjs` (For Module/CommonJS issues)
- Update dates and theme/slogan for 2024
- Update vendor applications

## [v3.0.1] - 2023-07-04

### Changed
- Update several packages and config
- Make more use of `site.data.importmap.imports` in SW cached and creating `<script>`s

### Removed
- Delete `<link rel="preload">` config (using HTTP headers)

## [v3.0.0] - 2023-05-15

### Added
- Implements import maps
- Switch to use unkpg.com
- Add support and enforcement of `TrustedTypes`

## [v2.3.1] - 2023-01-21

### Added
- Create actual WFD Mayors page with events

### Changed
- Updated Store to be (basically) fully functional

### Fixed
- Checkout no longer creates duplicate orders

## [v2.3.0] - 2023-01-09

### Changed
- Update to node v18.13.0
- Updated theme and various design details
- Add `"webapp"` platform to manifest
- Use `<app-stores>` to dynamically generate list of apps (not installed?)
- Use CDN service worker
- Update App Data
- List towns
- Show gas stations, lodging, and campgrounds in other areas

### Fixed
- Correctly set event status

## [v2.1.0]

### Added
- Notice that Whiskey Flat Days 2021 has been cancelled
- Whiskey Flat Days event info in `site.data.mainEvent`

### Changed
- Update to load `polyfill.io` and custom elements shim as `<script nomodule>`
- Use `<leaflet-map>` as separate script from CDN
- Use `site.data.mainEvent` for the majority of data for WFD
- Misc. component updates, especially for footer

## [v2.0.8] - 2020-12-12

### Added

- Add apps icon
- Use `<button is="app-list">` component
- Add `cookieStore` handling for theme

### Changed

- Allow `apps.kernvalley.us` in CSP
- Update style of nav links & buttons
- Use weather component via `_includes/` in sidebar

## [v2.0.7] - 2020-10-26

### Added
- Page to reset all data using HTTP `Clear-Site-Data: *` header
- Notification of outdated information on first visit (via cookie)

### Changed
- Add more sample ads
- Update to newer version of `<ad-block>`
- Update preloading
- Misc. style updates
- Update Leaflet Version
- Animate on intersection for event cards on events page
- Add options for ad layout and other attributes
- Move PWA install button to `<nav>`

## [v2.0.6] - 2020-09-06

### Added
- Add event status and attendance mode to events (including map)
- GA events for external link clicks

### Changed
- Update components/`_includes/`
- Make `crossorigin` and `referrerpolicy` attribute setting consistent

### Fixed
- Use `escape_once` to escape titles when used as attributes
- Disable bash linting due to issues with `.rvmrc`
- Re-enable Google Analytics

## [v2.0.5] - 2020-08-03

### Updated
- Various dependecy updates
- Dynamically load `polyfill.io`
- Mark pages as not having a header, & do not `@import url("header.css")`
- Update components from template repo
- Misc. performance improvements
- Preload / prefetch required assets / connections

### Fixed
- Quote attributes for `<leaflet-marker>`s
- Set `loading="lazy"` on all images
- Currectly set image for Twitter

## [v2.0.4] - 2020-07-18

### Added
- Share Target API support for sharing location

### Changed
- Update editor config file to specify indent style and width
- Update eslint to check all project JS
- Misc. config file updates
- Use `history.state` to manage Leaflet map markers

### Fixed
- Marker popups now restricted in size
- Ad image for Kern Valley Events (CSP)
- Do not set all pages titles to "Map" prefix

## [v2.0.3] - 2020-07-15

### Changed
- Update components to use external stylesheets

## [v2.0.2] - 2020-07-13

### Added
- Jumplist / shortcuts to PWA

### Changed
- Enable linting on `sw-config.js`
- Resize app icons
- Update icons with `purpose: maskable any`

## [v2.0.1] - 2020-07-03

### Added
- `.well-known/assetlinks.json` for TWA deployment
- Play Store info to webapp manifest

### Fixed
- Contact page content & style

## [v2.0.0] - 2020-07-03

### Added
- Minify JS & CSS using Rollup & PostCSS
- Add `<github-user>` to footer
- Implement Dependabot and Super Linter
- Create CHANGELOG
- Create Privacy Policy and Contact pages

### Changed
- Numerous dependency and other version updates
- Update assets and resources from Jekyll template repo

### Fixed
- Remove invisible link in nav

### Removed
- Travis-CI config file (just use GitHub Actions)
<!-- markdownlint-restore -->
