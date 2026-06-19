/** Module-level guards survive React StrictMode remounts (prevents duplicate API calls). */
const inflight = {
  'personality-test': null,
  'personality-score': null,
  'burnout-test': null,
  complete: null,
  assess: null,
};

const inflightKeyed = new Map();

export function runOnce(key, fn) {
  if (inflight[key]) return inflight[key];
  inflight[key] = Promise.resolve()
    .then(fn)
    .finally(() => {
      inflight[key] = null;
    });
  return inflight[key];
}

export function runOnceKeyed(key, fn) {
  if (inflightKeyed.has(key)) return inflightKeyed.get(key);
  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      inflightKeyed.delete(key);
    });
  inflightKeyed.set(key, promise);
  return promise;
}

export function clearFetchGuards() {
  inflight['personality-test'] = null;
  inflight['personality-score'] = null;
  inflight['burnout-test'] = null;
  inflight.complete = null;
  inflight.assess = null;
  inflightKeyed.clear();
}
