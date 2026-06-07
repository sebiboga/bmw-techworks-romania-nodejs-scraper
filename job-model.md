# Job Model

## Required Fields

| Field | Type | Description |
|---|---|---|
| `url` | string | Unique job URL |
| `title` | string | Job title |
| `company` | string | Company name |
| `cif` | string | Company CIF/CUI |
| `location` | array of strings | Job locations |
| `workmode` | string | Work mode: "remote", "hybrid", "on-site" |
| `date` | string (ISO 8601) | Date when the job was scraped or reposted |
| `status` | string | "scraped" or "published" |

## Optional Fields

| Field | Type | Description |
|---|---|---|
| `tags` | array of strings | Job tags (seniority, technology, etc.) |
| `salary` | array of strings | Salary range(s) |

## Example

```json
{
  "url": "https://careers.bmwtechworks.ro/jobs/123456-senior-angular-developer",
  "title": "Senior Angular Developer",
  "company": "BMW TECHWORKS ROMANIA S.R.L.",
  "cif": "49775344",
  "location": ["Cluj-Napoca"],
  "tags": ["senior", "javascript", "it"],
  "workmode": "hybrid",
  "date": "2026-06-07T06:20:51.505Z",
  "status": "scraped"
}
```
