export const FLOW_STEPS = [
  { id: 'about', label: 'About you' },
  { id: 'personality', label: 'Personality' },
  { id: 'insight', label: 'Your type' },
  { id: 'burnout', label: 'Burnout' },
  { id: 'results', label: 'Results' },
];

export function flowStepIndex(phase) {
  switch (phase) {
    case 'name':
    case 'profile':
      return 0;
    case 'loading-personality-test':
    case 'personality':
      return 1;
    case 'scoring-personality':
    case 'personality-insight':
      return 2;
    case 'loading-burnout-test':
    case 'burnout':
      return 3;
    case 'processing':
    case 'results':
      return 4;
    default:
      return -1;
  }
}

export function phaseLabel(phase) {
  const labels = {
    'loading-personality-test': 'Building your interview',
    personality: 'Personality interview',
    'scoring-personality': 'Analysing personality',
    'personality-insight': 'Your personality',
    'loading-burnout-test': 'Building burnout check-in',
    burnout: 'Burnout check-in',
    processing: 'Finalising results',
  };
  return labels[phase] ?? '';
}
