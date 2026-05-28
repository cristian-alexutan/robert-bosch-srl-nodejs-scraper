# Robert Bosch SRL - Node.js Scraper

Web scraper pentru a aduce locurile de munca de la Bosch in platforma [peviitor.ro](https://peviitor.ro).

## Company Details

- **Brand**: Robert Bosch
- **Legal Name**: ROBERT BOSCH SRL
- **CUI/CIF**: 5541546
- **Registration Number**: J1994007601405
- **Source**: SmartRecruiters API

## Usage

```bash
npm install
npm run scrape
```

## Structure

- `index.js` - Main scraper orchestrator
- `company.js` - Company validation and ANAF integration
- `demoanaf.js` - ANAF API client
- `solr.js` - Solr database operations
- `delete_request.json` - Solr delete query template
- `company.json` - Cached company data from ANAF

## Scraping Flow

1. Query Solr for existing jobs by CIF
2. Validate company via ANAF API
3. Scrape job listings from SmartRecruiters API (paginated)
4. Map jobs to the standard job model
5. Transform jobs for Solr (filter Romanian cities, normalize fields)
6. Upsert jobs to Solr
7. Save backup to `jobs.json`

## API Source

Uses the SmartRecruiters public API:
```
GET https://api.smartrecruiters.com/v1/companies/BoschGroup/postings?country=ro&limit=50&offset=N
```
