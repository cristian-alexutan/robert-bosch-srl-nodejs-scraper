# Instructiuni

## Colectare locala

```bash
npm install
npm run scrape
```

## Testare

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Validare job-uri

```bash
node tests/validate-bosch-jobs.js --dry-run
node tests/validate-bosch-jobs.js --delete
```

## Deploy

Push pe branch-ul main declanseaza deploy automat pe GitHub Pages.
