# BMW TechWorks Romania — Peviitor Scraper

**job_seeker_ro_spider** — scraper pentru job-urile BMW TechWorks Romania.

Extrage anunțurile de pe [BMW TechWorks Romania Careers](https://careers.bmwtechworks.ro/jobs) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Caută brand-ul în DemoANAF** — interoghează API-ul public ANAF după brand-ul "BMW TechWorks Romania" pentru a descoperi CIF-ul
2. **Validează compania** — fetch-uiește datele complete ANAF și verifică statusul (activ/inactiv)
3. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
4. **Scrape-uiește job-urile** — extrage lista completă de job-uri din feed-ul JSON public
5. **Transformă datele** — normalizează locațiile, tag-urile, workmode-ul
6. **Stochează în SOLR** — upsert în `job` core și `company` core
7. **Repară job-uri orfane** — corectează company/CIF pentru joburile BMW aduse de alte scrapere

## Structură proiect

```
├── index.js           # Orchestrator principal
├── company.js         # Validare companie (brand search + ANAF + Peviitor + SOLR)
├── demoanaf.js        # CLI wrapper pentru src/anaf.js
├── fix-bmw-data.js    # Reparare joburi BMW din alte scrapere
├── src/anaf.js        # Modul ANAF API (search + company details)
├── solr.js            # Operații SOLR (query, upsert, delete, company)
├── tests/
│   ├── unit/          # Teste unitare
│   ├── integration/   # Teste de integrare (ANAF + SOLR live)
│   └── e2e/           # Teste end-to-end (pipelin complet)
└── .github/workflows/
    ├── scrape.yml     # Rulează săptămânal (luni 6AM UTC)
    └── test.yml       # Teste automate la fiecare push/PR
```

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
| BMW Careers Feed | `https://careers.bmwtechworks.ro/jobs.json` | Public |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| Peviitor | `https://api.peviitor.ro/v1/company/` | Public |
| SOLR (job core) | `https://solr.peviitor.ro/solr/job` | `SOLR_AUTH` |
| SOLR (company core) | `https://solr.peviitor.ro/solr/company` | `SOLR_AUTH` |

## Robots.txt

BMW TechWorks Careers [robots.txt](https://careers.bmwtechworks.ro/robots.txt) permite tot (`Allow: /`). Scraper-ul face o singură cerere per feed, cu User-Agent standard.

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (necesită ANAF live, SOLR conditional)
npm run test:integration

# Doar E2E (API real BMW + ANAF + SOLR)
npm run test:e2e
```

Testele SOLR folosesc `itIfSolr` — se auto-skip dacă variabila `SOLR_AUTH` nu e setată.
