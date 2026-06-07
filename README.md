# BMW TechWorks Romania Scraper

Scraper for peviitor.ro — extracts job listings from [careers.bmwtechworks.ro](https://careers.bmwtechworks.ro/jobs) and pushes them to Apache SOLR.

## Quick Start

```bash
npm install
cp .env.local.example .env.local  # edit SOLR_AUTH
npm run scrape
```

## Components

| File | Purpose |
|---|---|
| `src/anaf.js` | ANAF API client: company validation, search by brand |
| `demoanaf.js` | CLI tool for ANAF lookups: `node demoanaf.js <cif>` or `node demoanaf.js search <brand>` |
| `company.js` | Company validation pipeline: brand search → ANAF → SOLR → Peviitor |
| `solr.js` | SOLR client: query, upsert, delete jobs and companies |
| `index.js` | Main scraper entry point |
| `fix-bmw-data.js` | Repair module: fixes company name/CIF for BMW jobs from other scrapers |

## Workflow

1. Search brand in DemoANAF → get CIF → validate via ANAF
2. Scrape JSON feed from careers.bmwtechworks.ro
3. Map to Peviitor job model
4. Upsert to SOLR
5. Fix orphan BMW jobs (brought by ANOFM/jobviewtrack scrapers)
