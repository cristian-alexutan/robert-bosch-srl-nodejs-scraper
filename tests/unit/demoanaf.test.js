import { searchCompany, getCompanyFromANAFWithFallback } from '../../demoanaf.js';

describe('ANAF Module', () => {
  test('searchCompany returns array with cui and name', async () => {
    const results = await searchCompany('Robert Bosch');
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('cui');
      expect(results[0]).toHaveProperty('name');
    }
  });

  test('searchCompany returns empty array for non-existent brand', async () => {
    const results = await searchCompany('NonExistentBrandXYZ123');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  test('getCompanyFromANAFWithFallback returns cached data', async () => {
    const cachedData = { cui: 5541546, name: 'ROBERT BOSCH SRL' };
    const result = await getCompanyFromANAFWithFallback('0000000', cachedData);
    expect(result).not.toBeNull();
    expect(result.cui).toBe(5541546);
  });
});
