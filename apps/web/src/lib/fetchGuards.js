/** Module-level guards survive React StrictMode remounts (prevents duplicate API calls). */
const inflight = {
  personality: null,
  burnout: null,
  assess: null,
};

export function runOnce(key, fn) {
  if (inflight[key]) return inflight[key];
  inflight[key] = Promise.resolve()
    .then(fn)
    .finally(() => {
      inflight[key] = null;
    });
  return inflight[key];
}

export function clearFetchGuards() {
  inflight.personality = null;
  inflight.burnout = null;
  inflight.assess = null;
}
