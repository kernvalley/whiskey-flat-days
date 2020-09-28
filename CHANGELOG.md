---
layout: default
title: CHANGELOG
description: List of changes
robots: noindex
permalink: /changelog/
---
<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Update Leaflet Version
- Animate on intersection for event cards on events page

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
