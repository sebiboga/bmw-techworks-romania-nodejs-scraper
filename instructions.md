# Instructions

## Project Purpose

This scraper extracts job listings from BMW TechWorks Romania career page and imports them to peviitor.ro.

Target: https://careers.bmwtechworks.ro/jobs
Feed: https://careers.bmwtechworks.ro/jobs.json

## Technologies

- **Node.js & JavaScript** - For scraping and data extraction
- **Apache SOLR** - For data storage and indexing

## Workflow Steps

1. **Start with brand** - We know the brand (e.g., "BMW TechWorks Romania")
2. **Search in DemoANAF** - Find company by brand, get CIF from search results
3. **Get company details from ANAF** - Using CIF, fetch full company data from ANAF
4. **Validate with Peviitor** - Verify company exists in Peviitor
5. **Check existing jobs in SOLR** - Query SOLR by CIF to see what jobs already exist
6. **Scrape jobs** - Fetch JSON Feed from careers.bmwtechworks.ro
7. **Map to job model** - Transform scraped data to the Peviitor job model
8. **Upsert jobs to SOLR** - Push jobs to SOLR (upsert by URL)
9. **Fix company data** - Repair any BMW jobs in SOLR with missing/incomplete company name or CIF

## Environment

Create `.env.local` with:
```
SOLR_AUTH=your-solr-credentials
```
