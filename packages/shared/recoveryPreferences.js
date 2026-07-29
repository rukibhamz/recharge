export const RECOVERY_SOCIAL_OPTIONS = [
  { id: 'solo', label: 'Mostly alone or one trusted person' },
  { id: 'small_group', label: 'Small, familiar social settings' },
  { id: 'lively_social', label: 'Lively social spaces and group energy' },
];

export const RECOVERY_ACTIVITY_OPTIONS = [
  { id: 'quiet_rest', label: 'Quiet rest (reading, naps, calm time)' },
  { id: 'movement', label: 'Movement (walks, exercise, dance)' },
  { id: 'creative', label: 'Creative activities (music, art, writing)' },
  { id: 'social_hangout', label: 'Social hangouts (cafes, dinners, events)' },
];

export const RECOVERY_SETTING_OPTIONS = [
  { id: 'home', label: 'At home' },
  { id: 'outdoors', label: 'Outdoors / nature' },
  { id: 'city_spaces', label: 'City spaces (cafes, parks, bookstores)' },
  { id: 'mixed', label: 'A mix depending on the day' },
];

const VALID_SOCIAL = new Set(RECOVERY_SOCIAL_OPTIONS.map((option) => option.id));
const VALID_ACTIVITY = new Set(RECOVERY_ACTIVITY_OPTIONS.map((option) => option.id));
const VALID_SETTING = new Set(RECOVERY_SETTING_OPTIONS.map((option) => option.id));

export function sanitizeRecoveryPreferences(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const social = String(raw.social ?? '').trim();
  const activity = String(raw.activity ?? '').trim();
  const setting = String(raw.setting ?? '').trim();

  return {
    social: VALID_SOCIAL.has(social) ? social : '',
    activity: VALID_ACTIVITY.has(activity) ? activity : '',
    setting: VALID_SETTING.has(setting) ? setting : '',
  };
}

export function isValidRecoveryPreferences(raw) {
  const preferences = sanitizeRecoveryPreferences(raw);
  if (!preferences) return false;
  return Boolean(preferences.social && preferences.activity && preferences.setting);
}

function labelFor(options, id) {
  return options.find((option) => option.id === id)?.label ?? id;
}

export function recoveryPreferencesPromptContext(raw) {
  const preferences = sanitizeRecoveryPreferences(raw);
  if (!preferences || !isValidRecoveryPreferences(preferences)) return '';

  return [
    'Stated unwind preferences:',
    `- Social style: ${labelFor(RECOVERY_SOCIAL_OPTIONS, preferences.social)}`,
    `- Activity preference: ${labelFor(RECOVERY_ACTIVITY_OPTIONS, preferences.activity)}`,
    `- Preferred setting: ${labelFor(RECOVERY_SETTING_OPTIONS, preferences.setting)}`,
  ].join('\n');
}
