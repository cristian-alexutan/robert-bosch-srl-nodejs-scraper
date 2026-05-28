describe('E2E: Scraper', () => {
  test('SmartRecruiters API is reachable', async () => {
    const response = await fetch('https://api.smartrecruiters.com/v1/companies/BoschGroup/postings?country=ro&limit=1', {
      signal: AbortSignal.timeout(10000),
    });
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('totalFound');
  });

  test('API returns Bosch jobs in Romania', async () => {
    const response = await fetch('https://api.smartrecruiters.com/v1/companies/BoschGroup/postings?country=ro&limit=10', {
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    expect(data.totalFound).toBeGreaterThan(0);
    for (const job of data.content) {
      expect(job).toHaveProperty('name');
      expect(job).toHaveProperty('id');
    }
  });
});
