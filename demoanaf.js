import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const ANAF_API_URL = 'https://demoanaf.ro/api/company/';
const ANAF_SEARCH_URL = 'https://demoanaf.ro/api/search';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCompanyFromANAF(cif) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${ANAF_API_URL}${cif}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`ANAF API error: ${response.status}`);
      }

      const json = await response.json();
      if (json.success && json.data) {
        return json.data;
      }
      throw new Error('Invalid ANAF response format');
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.warn(`[ANAF] Attempt ${attempt}/${MAX_RETRIES} failed for CIF ${cif}: ${err.message}. Retrying...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw err;
      }
    }
  }
}

export async function getCompanyFromANAFWithFallback(cif, cachedData) {
  try {
    return await getCompanyFromANAF(cif);
  } catch (err) {
    console.warn(`[ANAF] All attempts failed for CIF ${cif}: ${err.message}`);
    if (cachedData) {
      console.log('[ANAF] Falling back to cached company data');
      return cachedData;
    }

    if (existsSync('company.json')) {
      try {
        const cached = JSON.parse(readFileSync('company.json', 'utf-8'));
        if (cached.anaf) {
          console.log('[ANAF] Falling back to company.json cache');
          return cached.anaf;
        }
      } catch (e) {
        // ignore
      }
    }

    return null;
  }
}

export async function searchCompany(brandName) {
  try {
    const response = await fetch(`${ANAF_SEARCH_URL}?q=${encodeURIComponent(brandName)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`ANAF search API error: ${response.status}`);
    }

    const json = await response.json();
    return json.data || [];
  } catch (err) {
    console.error(`[ANAF] Search failed for ${brandName}: ${err.message}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'search' && args[1]) {
    const results = await searchCompany(args[1]);
    console.log(JSON.stringify(results, null, 2));
  } else if (args[0]) {
    const data = await getCompanyFromANAF(args[0]);
    console.log(JSON.stringify(data, null, 2));
  } else {
    const data = await getCompanyFromANAF('5541546');
    console.log(JSON.stringify(data, null, 2));
  }
}

if (process.argv[1]?.includes('demoanaf')) {
  main();
}
