import fetch from 'node-fetch';
import * as company from './company.js';
import * as solr from './solr.js';
import * as anaf from './demoanaf.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const COMPANY_BRAND = 'Robert Bosch';
const COMPANY_CIF = '5541546';
const COMPANY_NAME = 'ROBERT BOSCH SRL';
const SMART_RECRUITERS_URL = 'https://api.smartrecruiters.com/v1/companies/BoschGroup/postings';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;
const MAX_PAGES = 10;

const ROMANIAN_CITIES = new Set([
  'Alba Iulia', 'Arad', 'Bacău', 'Baia Mare', 'Bistrița', 'Botoșani', 'Brașov', 'Brăila',
  'București', 'Buzău', 'Cluj', 'Cluj-Napoca', 'Jucu', 'Constanța', 'Craiova', 'Deva',
  'Drobeta-Turnu Severin', 'Focșani', 'Galați', 'Giurgiu', 'Iași', 'Iași', 'Târgu Frumos',
  'Oradea', 'Piatra Neamț', 'Pitești', 'Ploiești', 'Râmnicu Vâlcea', 'Reșița',
  'Satu Mare', 'Sfântu Gheorghe', 'Sibiu', 'Slatina', 'Slobozia', 'Suceava',
  'Târgoviște', 'Târgu Jiu', 'Târgu Mureș', 'Timișoara', 'Tulcea', 'Vaslui', 'Zalău',
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseApiJobs(apiData) {
  const jobs = [];
  if (!apiData || !apiData.content) return jobs;

  for (const job of apiData.content) {
    const uid = job.id || job.uuid;
    const city = job.location?.city || '';
    const country = job.location?.country || '';

    if (country !== 'ro') continue;

    let workmode = 'on-site';
    if (job.location?.remote === true) workmode = 'remote';
    else if (job.location?.hybrid === true) workmode = 'hybrid';

    const tags = [];
    if (job.industry?.label) {
      tags.push(job.industry.label.toLowerCase().replace(/\s+or\s+/g, '-'));
    }
    if (job.function?.label) {
      tags.push(job.function.label.toLowerCase().replace(/\s+/g, '-'));
    }

    const url = `https://careers.smartrecruiters.com/BoschGroup/${uid}`;

    jobs.push({
      url,
      title: job.name || '',
      uid,
      workmode,
      location: [city],
      tags,
      remote: job.location?.remote || false,
      hybrid: job.location?.hybrid || false,
    });
  }

  return jobs;
}

async function fetchJobsPage(offset) {
  const url = `${SMART_RECRUITERS_URL}?country=ro&limit=${PAGE_SIZE}&offset=${offset}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`SmartRecruiters API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function scrapeAllListings(testOnlyOnePage = false) {
  let allJobs = [];
  let offset = 0;
  const seenUrls = new Set();

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await fetchJobsPage(offset);
    const jobs = parseApiJobs(data);

    if (jobs.length === 0) break;

    for (const job of jobs) {
      if (!seenUrls.has(job.url)) {
        seenUrls.add(job.url);
        allJobs.push(job);
      }
    }

    if (testOnlyOnePage) break;
    if (offset + PAGE_SIZE >= data.totalFound) break;

    offset += PAGE_SIZE;
    await sleep(1000);
  }

  return allJobs;
}

function mapToJobModel(rawJob, cif, companyName) {
  const job = {
    url: rawJob.url,
    title: rawJob.title,
    company: companyName,
    cif,
    location: rawJob.location,
    tags: rawJob.tags,
    workmode: rawJob.workmode,
    date: new Date().toISOString(),
    status: 'scraped',
  };

  Object.keys(job).forEach(key => {
    if (job[key] === undefined) delete job[key];
  });

  return job;
}

function transformJobsForSOLR(payload) {
  return payload.map(job => {
    const locations = (job.location || [])
      .map(loc => {
        const city = loc.split(',')[0].trim();
        if (ROMANIAN_CITIES.has(city)) return city;
        if (ROMANIAN_CITIES.has(loc.trim())) return loc.trim();
        return null;
      })
      .filter(Boolean);

    const workmode = typeof job.workmode === 'string' ? job.workmode.toLowerCase() : 'on-site';

    return {
      ...job,
      company: COMPANY_NAME,
      location: locations.length > 0 ? locations : ['România'],
      workmode,
    };
  });
}

async function main() {
  console.log(`[${COMPANY_BRAND} Scraper] Starting...`);

  try {
    try {
      const existingResult = await solr.querySOLR(COMPANY_CIF);
      const existingCount = existingResult?.response?.numFound || 0;
      console.log(`[${COMPANY_BRAND} Scraper] Existing jobs in SOLR: ${existingCount}`);
    } catch (e) {
      console.warn(`[${COMPANY_BRAND} Scraper] SOLR unavailable (${e.message}), continuing without existing count`);
    }

    try {
      const companyData = await company.validateAndGetCompany();
      if (companyData && companyData.status === 'active') {
        console.log(`[${COMPANY_BRAND} Scraper] Company validated: ${companyData.company} (CIF: ${companyData.cif})`);
      } else {
        console.warn(`[${COMPANY_BRAND} Scraper] Company validation: ${companyData?.status || 'unknown'}`);
      }
    } catch (e) {
      console.warn(`[${COMPANY_BRAND} Scraper] Company validation skipped (${e.message})`);
    }

    const rawJobs = await scrapeAllListings();
    console.log(`[${COMPANY_BRAND} Scraper] Scraped ${rawJobs.length} raw jobs`);

    const mappedJobs = rawJobs.map(job => mapToJobModel(job, COMPANY_CIF, COMPANY_NAME));
    console.log(`[${COMPANY_BRAND} Scraper] Mapped ${mappedJobs.length} jobs`);

    const solrReadyJobs = transformJobsForSOLR(mappedJobs);
    console.log(`[${COMPANY_BRAND} Scraper] Transformed ${solrReadyJobs.length} jobs for SOLR`);

    if (solrReadyJobs.length > 0) {
      try {
        const result = await solr.upsertJobs(solrReadyJobs);
        console.log(`[${COMPANY_BRAND} Scraper] Upsert result:`, result);
      } catch (e) {
        console.warn(`[${COMPANY_BRAND} Scraper] SOLR upsert failed (${e.message}), saving locally only`);
      }
    }

    writeFileSync('jobs.json', JSON.stringify(solrReadyJobs, null, 2));
    console.log(`[${COMPANY_BRAND} Scraper] Jobs saved to jobs.json`);

    console.log(`[${COMPANY_BRAND} Scraper] Done! ${solrReadyJobs.length} jobs processed.`);
  } catch (err) {
    console.error(`[${COMPANY_BRAND} Scraper] Error:`, err.message);
    process.exit(1);
  }
}

export { parseApiJobs, mapToJobModel, transformJobsForSOLR };

main();
