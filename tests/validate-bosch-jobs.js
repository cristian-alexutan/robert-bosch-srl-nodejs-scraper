import { readFileSync, writeFileSync, existsSync } from 'fs';

async function fetchWithTimeout(url, timeout = 5000) {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeout) });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || !args.includes('--delete');

  console.log(`[Validator] Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'DELETE MODE'}`);

  let jobs = [];
  if (existsSync('jobs.json')) {
    jobs = JSON.parse(readFileSync('jobs.json', 'utf-8'));
  }

  if (jobs.length === 0) {
    console.log('[Validator] No jobs found in jobs.json');
    return;
  }

  console.log(`[Validator] Validating ${jobs.length} Bosch jobs...`);

  let valid = 0;
  let invalid = 0;

  for (const job of jobs) {
    const result = await fetchWithTimeout(job.url);
    if (result.ok) {
      valid++;
    } else {
      invalid++;
      console.log(`[Validator] INVALID: ${job.title} (${job.url}) - HTTP ${result.status}`);
    }
  }

  console.log(`[Validator] Results: ${valid} valid, ${invalid} invalid`);
}

main();
