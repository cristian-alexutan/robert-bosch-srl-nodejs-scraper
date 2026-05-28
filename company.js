import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as anaf from './demoanaf.js';
import * as solr from './solr.js';

const COMPANY_BRAND = 'Robert Bosch';
const COMPANY_CIF = '5541546';
const COMPANY_FILE = 'company.json';

const COMPANY_MODEL_FIELDS = [
  { name: 'id', type: 'string', required: true },
  { name: 'company', type: 'string', required: true },
  { name: 'brand', type: 'string', required: false },
  { name: 'group', type: 'string', required: false },
  { name: 'status', type: 'string', required: true, allowed: ['activ', 'suspendat', 'inactiv', 'radiat'] },
  { name: 'location', type: 'array', required: false },
  { name: 'website', type: 'array', required: false },
  { name: 'career', type: 'array', required: false },
  { name: 'lastScraped', type: 'string', required: false },
  { name: 'scraperFile', type: 'string', required: false },
];

export function getCompanyBrand() {
  return COMPANY_BRAND;
}

export function getCompanyCif() {
  return COMPANY_CIF;
}

function validateCompanyModel(data) {
  const errors = [];

  for (const field of COMPANY_MODEL_FIELDS) {
    const value = data[field.name];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`Missing required field: ${field.name}`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (field.type === 'array' && !Array.isArray(value)) {
        errors.push(`Field ${field.name} should be an array`);
      }
      if (field.type === 'string' && typeof value !== 'string') {
        errors.push(`Field ${field.name} should be a string`);
      }
      if (field.allowed && !field.allowed.includes(value)) {
        errors.push(`Field ${field.name} has invalid value: ${value}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function getCompanyData() {
  if (existsSync(COMPANY_FILE)) {
    const cached = JSON.parse(readFileSync(COMPANY_FILE, 'utf-8'));
    return {
      company: cached.summary?.company || COMPANY_BRAND,
      cif: cached.summary?.cif || COMPANY_CIF,
      active: cached.summary?.active !== false,
      anafData: cached.anaf,
    };
  }

  const anafData = await anaf.getCompanyFromANAFWithFallback(COMPANY_CIF, null);
  const active = anafData?.inactive === false;

  return {
    company: anafData?.name || COMPANY_BRAND,
    cif: COMPANY_CIF,
    active,
    anafData,
  };
}

export async function validateAndGetCompany() {
  try {
    const existingJobs = await solr.querySOLR(COMPANY_CIF);
    const existingJobsCount = existingJobs?.response?.numFound || 0;

    const anafData = await anaf.getCompanyFromANAFWithFallback(COMPANY_CIF, null);
    const isActive = anafData ? !anafData.inactive : true;

    let peviitorData = null;
    try {
      const response = await fetch(`https://api.peviitor.ro/v1/company/?name=${encodeURIComponent(COMPANY_BRAND)}`);
      if (response.ok) {
        peviitorData = await response.json();
      }
    } catch (e) {
      console.warn(`[Company] Peviitor API unavailable: ${e.message}`);
    }

    saveCompanyData(anafData, peviitorData);

    if (!isActive) {
      console.log(`[Company] Company ${COMPANY_BRAND} is inactive. Deleting jobs...`);
      const deleteResult = await solr.deleteJobsByCIF(COMPANY_CIF);
      return { status: 'inactive', company: COMPANY_BRAND, cif: COMPANY_CIF, existingJobsCount };
    }

    return {
      status: 'active',
      company: COMPANY_BRAND,
      cif: COMPANY_CIF,
      existingJobsCount,
    };
  } catch (err) {
    console.error(`[Company] Validation error:`, err.message);
    return { status: 'error', company: COMPANY_BRAND, cif: COMPANY_CIF, error: err.message };
  }
}

function saveCompanyData(anafData, peviitorData) {
  const data = {
    validatedAt: new Date().toISOString(),
    source: anafData ? 'ANAF' : 'cache',
    brand: COMPANY_BRAND,
    anaf: anafData || null,
    peviitor: peviitorData || null,
    summary: {
      company: anafData?.name || COMPANY_BRAND,
      cif: COMPANY_CIF,
      active: anafData ? !anafData.inactive : true,
      inactiveSince: anafData?.inactiveSince || null,
      reactivatedSince: anafData?.reactivatedSince || null,
      address: anafData?.address || '',
      registrationNumber: anafData?.registrationNumber || '',
      caenCode: anafData?.caenCode || '',
      vatRegistered: anafData?.vatRegistered || false,
      eFacturaRegistered: anafData?.eFacturaRegistered || false,
    },
  };

  writeFileSync(COMPANY_FILE, JSON.stringify(data, null, 2));
}
