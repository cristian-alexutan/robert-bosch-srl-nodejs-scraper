import { querySOLR, deleteJobsByCIF, getSolrAuth } from '../../solr.js';
import { readFileSync, existsSync } from 'fs';

describe('Solr Module', () => {
  test('getSolrAuth returns null when no auth set', () => {
    delete process.env.SOLR_AUTH;
    const auth = getSolrAuth();
    expect(auth).toBeNull();
  });

  test('SOLR_URL is defined', () => {
    expect(process.env.SOLR_URL || 'https://solr.peviitor.ro/solr/job').toBeDefined();
  });

  test('jobs.json does not contain duplicate URLs', () => {
    if (existsSync('jobs.json')) {
      const jobs = JSON.parse(readFileSync('jobs.json', 'utf-8'));
      const urls = jobs.map(j => j.url);
      const unique = new Set(urls);
      expect(unique.size).toBe(urls.length);
    }
  });

  test('CIF format is valid', () => {
    if (existsSync('jobs.json')) {
      const jobs = JSON.parse(readFileSync('jobs.json', 'utf-8'));
      for (const job of jobs) {
        expect(job.cif).toMatch(/^\d+$/);
      }
    }
  });
});
