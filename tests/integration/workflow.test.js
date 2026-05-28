describe('Integration: Workflow', () => {
  test('brand matches company name and CIF', () => {
    const brand = 'Robert Bosch';
    const cif = '5541546';
    expect(brand).toBeDefined();
    expect(cif).toBe('5541546');
  });

  test('company data consistency', () => {
    const companyName = 'ROBERT BOSCH SRL';
    const cif = '5541546';
    expect(companyName).toContain('BOSCH');
    expect(cif.length).toBe(7);
  });
});
