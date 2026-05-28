import fetch from 'node-fetch';

const SOLR_URL = process.env.SOLR_URL || 'https://solr.peviitor.ro/solr/job';
const SOLR_COMPANY_URL = process.env.SOLR_COMPANY_URL || 'https://solr.peviitor.ro/solr/company';
const TIMEOUT = 10000;

function getSolrAuth() {
  const auth = process.env.SOLR_AUTH;
  if (!auth) return null;
  return 'Basic ' + Buffer.from(auth).toString('base64');
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const auth = getSolrAuth();
  if (auth) headers['Authorization'] = auth;
  return headers;
}

export async function querySOLR(cif) {
  const url = `${SOLR_URL}/select?q=cif:${cif}&rows=100&wt=json`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    signal: AbortSignal.timeout(TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`SOLR query error: ${response.status}`);
  }

  return response.json();
}

export async function queryCompanySOLR(companyQuery) {
  const url = `${SOLR_COMPANY_URL}/select?q=${encodeURIComponent(companyQuery)}&rows=10&wt=json`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    signal: AbortSignal.timeout(TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`SOLR company query error: ${response.status}`);
  }

  return response.json();
}

export async function deleteJobsByCIF(cif) {
  const url = `${SOLR_URL}/update?commit=true`;
  const body = { delete: { query: `cif:${cif}` } };

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`SOLR delete error: ${response.status}`);
  }

  return response.json();
}

export async function deleteJobByUrl(url) {
  const solrUrl = `${SOLR_URL}/update?commit=true`;
  const body = { delete: { query: `url:"${url}"` } };

  const response = await fetch(solrUrl, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`SOLR delete by URL error: ${response.status}`);
  }

  return response.json();
}

export async function upsertJobs(jobs) {
  const url = `${SOLR_URL}/update?commit=true`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(jobs),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`SOLR upsert error: ${response.status}`);
  }

  return response.json();
}

export async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'extract' && args[1]) {
    const result = await querySOLR(args[1]);
    const { writeFileSync } = await import('fs');
    writeFileSync('jobs_existing.json', JSON.stringify(result.response?.docs || [], null, 2));
    console.log(`Extracted ${result.response?.numFound || 0} existing jobs for CIF ${args[1]}`);
  } else if (args[0] === 'company') {
    const result = await queryCompanySOLR('*:*');
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0]) {
    const result = await querySOLR(args[0]);
    console.log(`Found ${result.response?.numFound || 0} jobs for CIF ${args[0]}`);
  } else {
    console.log('Usage: node solr.js <CIF> | node solr.js extract <CIF> | node solr.js company');
  }
}

if (process.argv[1]?.includes('solr')) {
  main();
}
