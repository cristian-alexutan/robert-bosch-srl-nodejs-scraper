import { getCompanyBrand, getCompanyCif } from '../../company.js';

describe('Company Module', () => {
  test('getCompanyBrand returns Robert Bosch', () => {
    expect(getCompanyBrand()).toBe('Robert Bosch');
  });

  test('getCompanyCif returns 5541546', () => {
    expect(getCompanyCif()).toBe('5541546');
  });
});
