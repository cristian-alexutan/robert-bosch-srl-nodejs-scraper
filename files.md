# Files

## Root

| File | Descriere |
|------|-----------|
| index.js | Main scraper orchestrator |
| company.js | Company validation + ANAF integration |
| demoanaf.js | ANAF API client |
| solr.js | Solr database operations |
| package.json | Node.js dependencies |
| delete_request.json | Solr delete query template |
| company.json | Cached ANAF company data |

## Docs

| File | Descriere |
|------|-----------|
| docs/index.html | CV / documentation page |

## Tests

| File | Descriere |
|------|-----------|
| tests/unit/index.test.js | Unit tests for scraper |
| tests/unit/company.test.js | Unit tests for company module |
| tests/unit/demoanaf.test.js | Unit tests for ANAF module |
| tests/unit/solr.test.js | Unit tests for Solr module |
| tests/integration/workflow.test.js | Integration tests |
| tests/e2e/scraper.test.js | End-to-end tests |
| tests/validate-bosch-jobs.js | Standalone job validator |
