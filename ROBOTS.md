# Robots.txt Analysis — BMW TechWorks Romania

Sursa: https://careers.bmwtechworks.ro/robots.txt

## Reguli

```
User-agent: *
Allow: /
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` (root) | ✅ Da | Landing page |
| `/jobs` | ✅ Da | Lista de job-uri (front-end) |
| `/jobs.json` | ✅ Da | **Feed-ul JSON de la care scraper-ul extrage datele** |
| `/jobs/*` | ✅ Da | Paginile individuale de job |

## Recomandare

BMW TechWorks Romania are un robots.txt permisiv — nu blochează nimic. Scraper-ul face o singură cerere pentru `/jobs.json` per run, cu User-Agent standard `job_seeker_ro_spider`. Comportament rezonabil, neagresiv.

## Concluzie

Risc minim. Site-ul e public, răspunde fără autentificare, iar scraperul e politicos (o singură cerere, User-Agent standard).
