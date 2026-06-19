/** ISO 3166-1 alpha-2 — common countries for profile capture (expand over time). */
export const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'EG', name: 'Egypt' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'OTHER', name: 'Other / prefer not to specify' },
];

export const AGE_BANDS = [
  { id: '18-24', label: '18–24' },
  { id: '25-34', label: '25–34' },
  { id: '35-44', label: '35–44' },
  { id: '45-54', label: '45–54' },
  { id: '55-64', label: '55–64' },
  { id: '65+', label: '65+' },
];

export const WORK_CONTEXTS = [
  { id: 'full_time', label: 'Employed full-time' },
  { id: 'part_time', label: 'Employed part-time' },
  { id: 'self_employed', label: 'Self-employed / freelancer' },
  { id: 'student', label: 'Student' },
  { id: 'caregiver', label: 'Caregiver / homemaker' },
  { id: 'between_roles', label: 'Between roles / job seeking' },
  { id: 'retired', label: 'Retired' },
];

export const WORK_SECTORS = [
  { id: 'technology', label: 'Technology' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'finance', label: 'Finance & professional services' },
  { id: 'retail_hospitality', label: 'Retail & hospitality' },
  { id: 'public_sector', label: 'Public sector & non-profit' },
  { id: 'creative', label: 'Creative & media' },
  { id: 'trades', label: 'Trades & operations' },
  { id: 'other', label: 'Other' },
];

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c.name]));
const AGE_BY_ID = new Map(AGE_BANDS.map((a) => [a.id, a.label]));
const WORK_BY_ID = new Map(WORK_CONTEXTS.map((w) => [w.id, w.label]));
const SECTOR_BY_ID = new Map(WORK_SECTORS.map((s) => [s.id, s.label]));

const VALID_COUNTRY = new Set(COUNTRIES.map((c) => c.code));
const VALID_AGE = new Set(AGE_BANDS.map((a) => a.id));
const VALID_WORK = new Set(WORK_CONTEXTS.map((w) => w.id));
const VALID_SECTOR = new Set(WORK_SECTORS.map((s) => s.id));

export function countryName(code) {
  return COUNTRY_BY_CODE.get(code) ?? code;
}

export function sanitizeCity(city) {
  return String(city ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

export function sanitizeDemographics(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const country = String(raw.country ?? '').toUpperCase();
  const ageBand = String(raw.ageBand ?? raw.age_band ?? '').trim();
  const workContext = String(raw.workContext ?? raw.work_context ?? '').trim();
  const workSector = String(raw.workSector ?? raw.work_sector ?? '').trim();
  const city = sanitizeCity(raw.city);

  return {
    country: VALID_COUNTRY.has(country) ? country : '',
    city,
    ageBand: VALID_AGE.has(ageBand) ? ageBand : '',
    workContext: VALID_WORK.has(workContext) ? workContext : '',
    workSector: VALID_SECTOR.has(workSector) ? workSector : '',
  };
}

export function isValidDemographics(demographics) {
  const d = sanitizeDemographics(demographics);
  if (!d) return false;
  return Boolean(d.country && d.ageBand && d.workContext);
}

export function demographicsLabels(demographics) {
  const d = sanitizeDemographics(demographics);
  if (!d) return null;

  return {
    country: countryName(d.country),
    city: d.city || null,
    ageBand: AGE_BY_ID.get(d.ageBand) ?? d.ageBand,
    workContext: WORK_BY_ID.get(d.workContext) ?? d.workContext,
    workSector: d.workSector ? (SECTOR_BY_ID.get(d.workSector) ?? d.workSector) : null,
  };
}

/** Plain-text block for LLM prompts — no PII beyond what user volunteered. */
export function demographicsPromptContext(demographics) {
  const d = sanitizeDemographics(demographics);
  if (!d) return '';

  const labels = demographicsLabels(d);
  const lines = [
    labels.city ? `City: ${labels.city}` : null,
    `Country: ${labels.country}`,
    `Age band: ${labels.ageBand}`,
    `Work situation: ${labels.workContext}`,
    labels.workSector ? `Sector: ${labels.workSector}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

/** Profile block for question generation — omits city/country so the LLM does not weave in places. */
export function demographicsQuestionContext(demographics) {
  const d = sanitizeDemographics(demographics);
  if (!d) return '';

  const labels = demographicsLabels(d);
  const lines = [
    `Age band: ${labels.ageBand}`,
    `Work situation: ${labels.workContext}`,
    labels.workSector ? `Sector: ${labels.workSector}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

/** Guess country code from browser locale (e.g. en-NG → NG). */
export function guessCountryFromLocale(locale = '') {
  const tag = String(locale || '').trim();
  const match = tag.match(/[-_]([A-Za-z]{2})$/);
  if (!match) return '';
  const code = match[1].toUpperCase();
  return VALID_COUNTRY.has(code) ? code : '';
}
