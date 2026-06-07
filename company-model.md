# Company Model

## Fields

| Field | Required | Type | Description |
|---|---|---|---|
| `id` | Yes | string | Company CIF |
| `company` | Yes | string | Company name |
| `brand` | No | string | Brand name |
| `group` | No | string | Group name |
| `status` | No | string | "activ", "suspendat", "inactiv", "radiat" |
| `location` | No | array | Company location(s) |
| `website` | No | array | Company website(s) |
| `career` | No | array | Career page URL(s) |
| `lastScraped` | No | string | Date of last scrape |
| `scraperFile` | No | string | Link to workflow file |

## Example

```json
{
  "id": "49775344",
  "company": "BMW TECHWORKS ROMANIA SRL",
  "brand": "BMW TechWorks Romania",
  "status": "activ",
  "location": ["Cluj-Napoca"],
  "website": ["https://www.bmwtechworks.ro"],
  "career": ["https://careers.bmwtechworks.ro/jobs"],
  "lastScraped": "2026-06-07",
  "scraperFile": "https://raw.githubusercontent.com/sebiboga/bmw-techworks-romania-nodejs-scraper/master/.github/workflows/scrape.yml"
}
```
