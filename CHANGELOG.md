# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-07

### Added
- Initial release
- Job scraping from BMW TechWorks Romania JSON feed
- Company validation via ANAF (CIF: 49775344)
- SOLR integration for job storage
- GitHub Actions workflows for weekly scraping and testing
- `fix-bmw-data.js` — repair module for BMW jobs from other scrapers (ANOFM, jobviewtrack, hipo.ro)
- ANAF brand search to discover CIF dynamically
- Comprehensive test suite (unit, integration, E2E)

### Features
- Automated weekly job scraping (Mondays 6AM UTC)
- Company core validation and management
- Job URL validation and 404 detection
- Orphan BMW job repair (company name + CIF correction)
- 409 conflict resolution via `_version_` deletion

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE
Licensed under MIT License
