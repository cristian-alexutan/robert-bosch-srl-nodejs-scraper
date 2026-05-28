let parseApiJobs, mapToJobModel, transformJobsForSOLR;

beforeAll(async () => {
  const mod = await import('../../index.js');
  parseApiJobs = mod.parseApiJobs;
  mapToJobModel = mod.mapToJobModel;
  transformJobsForSOLR = mod.transformJobsForSOLR;
});

describe('Index Module', () => {
  const sampleApiResponse = {
    content: [
      {
        id: '744000128928649',
        name: 'Order Management Analyst With German',
        uuid: '72af38b9-d9dc-46d9-ba98-a3b8ed112be9',
        location: {
          city: 'Timișoara',
          country: 'ro',
          remote: false,
          hybrid: true,
        },
        industry: { label: 'Logistics And Supply Chain' },
        function: { label: 'Analyst' },
      },
    ],
  };

  test('parseApiJobs maps SmartRecruiters format correctly', () => {
    const jobs = parseApiJobs(sampleApiResponse);
    expect(jobs.length).toBe(1);
    expect(jobs[0].title).toBe('Order Management Analyst With German');
    expect(jobs[0].workmode).toBe('hybrid');
    expect(jobs[0].location).toContain('Timișoara');
  });

  test('mapToJobModel adds status and removes undefined fields', () => {
    const raw = {
      url: 'https://careers.smartrecruiters.com/BoschGroup/744000128928649',
      title: 'Test Job',
      workmode: 'hybrid',
      location: ['Cluj-Napoca'],
      tags: ['it'],
    };
    const job = mapToJobModel(raw, '5541546', 'ROBERT BOSCH SRL');
    expect(job.status).toBe('scraped');
    expect(job.cif).toBe('5541546');
    expect(job.company).toBe('ROBERT BOSCH SRL');
    expect(job.date).toBeDefined();
  });

  test('transformJobsForSOLR filters locations and normalizes', () => {
    const jobs = [
      {
        url: 'https://example.com/job1',
        title: 'Test',
        company: 'ROBERT BOSCH SRL',
        cif: '5541546',
        location: ['Timișoara'],
        tags: ['it'],
        workmode: 'hybrid',
        date: new Date().toISOString(),
        status: 'scraped',
      },
    ];
    const transformed = transformJobsForSOLR(jobs);
    expect(transformed[0].location).toContain('Timișoara');
    expect(transformed[0].company).toBe('ROBERT BOSCH SRL');
    expect(transformed[0].workmode).toBe('hybrid');
  });
});
