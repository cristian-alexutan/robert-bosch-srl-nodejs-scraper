# Job Model

## Campuri

| Camp | Tip | Required | Descriere |
|------|-----|----------|-----------|
| url | string | da | URL-ul job-ului |
| title | string | da | Titlul job-ului |
| company | string | da | Numele companiei |
| cif | string | da | CUI-ul companiei |
| location | array | nu | Orasele unde e disponibil job-ul |
| tags | array | nu | Tag-uri relevante |
| workmode | string | nu | remote, on-site, hybrid |
| date | string | nu | Data publicarii (ISO8601) |
| status | string | nu | scraped, tested, published, verified |
