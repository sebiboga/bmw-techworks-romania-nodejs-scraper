# BMW TechWorks Romania Scraper

[![WebScraper BMW to Peviitor](https://github.com/sebiboga/bmw-techworks-romania-nodejs-scraper/actions/workflows/scrape.yml/badge.svg)](https://github.com/sebiboga/bmw-techworks-romania-nodejs-scraper/actions/workflows/scrape.yml)
[![Automation Tests](https://github.com/sebiboga/bmw-techworks-romania-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/sebiboga/bmw-techworks-romania-nodejs-scraper/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://ecma-international.org/)
[![Node.js](https://img.shields.io/badge/node-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**job_seeker_ro_spider** — un scraper pentru job-urile BMW TechWorks Romania. Extrage anunțurile de pe [careers.bmwtechworks.ro](https://careers.bmwtechworks.ro/jobs) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Overview

Proiectul automatizează colectarea săptămânală a job-urilor BMW TechWorks Romania, menținând board-ul peviitor.ro la zi cu cele mai recente oportunități de carieră.

## Features

- Extrage job-uri din feed-ul JSON public BMW TechWorks Careers
- Descoperă CIF-ul companiei via DemoANAF search (brand → CIF → detalii ANAF)
- Validează compania via ANAF (CUI, status activ/inactiv, adresă completă)
- Cross-validează cu Peviitor API
- Stochează în SOLR (job core + company core)
- Repară joburile BMW aduse de alte scrapere (ANOFM, jobviewtrack, hipo.ro)
- GitHub Actions: scrape săptămânal + testare automată (unit, integration, e2e)
- Se identifică prin User-Agent: `job_seeker_ro_spider`

## Project Structure

```
├── index.js           # Main scraper entry point
├── company.js         # Company validation via brand search + ANAF + Peviitor + SOLR
├── demoanaf.js        # CLI wrapper for src/anaf.js
├── fix-bmw-data.js    # Repair module for orphan BMW jobs
├── src/anaf.js        # ANAF API core module (search + company details)
├── solr.js            # SOLR operations (query, upsert, delete, company)
├── ROBOTS.md          # robots.txt analysis and scraping policy
├── tests/
│   ├── unit/          # Unit tests (mocked APIs)
│   ├── integration/   # Integration tests (ANAF + SOLR live)
│   └── e2e/           # E2E tests (full pipeline, real BMW feed)
├── .github/workflows/
│   ├── scrape.yml     # Weekly scraping at 6AM UTC Monday
│   └── test.yml       # Automation Tests on push/PR
└── package.json
```

## Setup

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
npm install
```

### Configuration

Set the `SOLR_AUTH` environment variable with your Solr credentials:

```bash
export SOLR_AUTH="username:password"
```

## Usage

### Run the Scraper

```bash
npm run scrape
```

### Run Tests

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Acknowledgments

This project was developed with assistance from:
- **[OpenCode](https://opencode.ai)** - AI-powered CLI tool for software engineering
- **Big Pickle LLM** - Large language model powering OpenCode

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE

Licensed under the [MIT License](LICENSE).

## Managed By

This project is managed by [ASOCIATIA OPORTUNITATI SI CARIERE](https://oportunitatisicariere.ro) and used as a web scraper for the [peviitor.ro](https://peviitor.ro) job board project.

## Robots.txt Policy

BMW TechWorks Careers [robots.txt](https://careers.bmwtechworks.ro/robots.txt) permite tot (`Allow: /`). Scraper-ul face o singură cerere pentru `/jobs.json` per run, cu User-Agent standard `job_seeker_ro_spider`. Pentru analiza completă, vezi [ROBOTS.md](ROBOTS.md).

## Disclaimer

This scraper is designed for educational purposes and legitimate job data aggregation for the Romanian job market. Please respect BMW TechWorks Romania's Terms of Service and robots.txt when using this scraper.
