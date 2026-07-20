export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function relativeAssessmentTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  return formatDate(iso);
}

export function burnoutMoodIcon(cls) {
  if (cls === 'healthy') return { icon: 'sentiment_satisfied', tone: 'text-status-healthy bg-status-healthy/10' };
  if (cls === 'mild') return { icon: 'sentiment_neutral', tone: 'text-status-warning bg-status-warning/10' };
  if (cls === 'severe') return { icon: 'sentiment_dissatisfied', tone: 'text-status-severe bg-status-severe/10' };
  return { icon: 'sentiment_neutral', tone: 'text-status-warning bg-status-warning/10' };
}
