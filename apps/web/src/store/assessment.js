import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { isValidDemographics } from '@recharge/shared/demographics';
import { isValidRecoveryPreferences } from '@recharge/shared/recoveryPreferences';

/** Abandoned in-progress assessments expire after 12 hours. */
export const ASSESSMENT_TTL_MS = 12 * 60 * 60 * 1000;
export const STORAGE_KEY = 'recharge-assessment-v20';
const LEGACY_KEYS = ['recharge-assessment-v19', 'recharge-assessment-v18', 'recharge-assessment-v17', 'recharge-assessment-v16'];

const emptyAnswers = (n = 0) => Array(n).fill(null);
const emptyDemographics = () => ({
  country: '',
  city: '',
  ageBand: '',
  workContext: '',
  workSector: '',
});

const emptyRecoveryPreferences = () => ({
  social: '',
  activity: '',
  setting: '',
});

function isExpired(updatedAt) {
  if (!updatedAt) return true;
  return Date.now() - Number(updatedAt) > ASSESSMENT_TTL_MS;
}

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => map.set(name, value),
    removeItem: (name) => map.delete(name),
  };
}

function expiringLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return memoryStorage();
  return {
    getItem(name) {
      try {
        const raw = window.localStorage.getItem(name);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const updatedAt = parsed?.state?.updatedAt;
        if (isExpired(updatedAt)) {
          window.localStorage.removeItem(name);
          return null;
        }
        return raw;
      } catch {
        window.localStorage.removeItem(name);
        return null;
      }
    },
    setItem(name, value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state) parsed.state.updatedAt = Date.now();
        const payload = JSON.stringify(parsed);
        try {
          window.localStorage.setItem(name, payload);
        } catch (quotaErr) {
          // Full results + roadmap can exceed quota — drop bulky roadmap copy and retry.
          if (parsed?.state?.results?.recoveryRoadmap) {
            parsed.state.results = {
              ...parsed.state.results,
              recoveryRoadmap: {
                ...parsed.state.results.recoveryRoadmap,
                phases: (parsed.state.results.recoveryRoadmap.phases ?? []).map((p) => ({
                  ...p,
                  steps: (p.steps ?? []).map((s) => ({
                    icon: s.icon,
                    when: s.when,
                    title: s.title,
                    tip: s.tip,
                  })),
                })),
              },
            };
            window.localStorage.setItem(name, JSON.stringify(parsed));
            return;
          }
          throw quotaErr;
        }
      } catch {
        try {
          window.localStorage.setItem(name, value);
        } catch (err) {
          console.warn('Could not persist assessment session:', err?.message || err);
        }
      }
    },
    removeItem(name) {
      window.localStorage.removeItem(name);
    },
  };
}

if (typeof window !== 'undefined') {
  for (const key of LEGACY_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

const initialState = {
  phase: 'hero',
  userName: '',
  demographics: emptyDemographics(),
  recoveryPreferences: emptyRecoveryPreferences(),
  burnoutIndex: 0,
  personalityIndex: 0,
  burnoutAnswers: [],
  personalityAnswers: [],
  personalityQuestions: [],
  burnoutQuestions: [],
  personalityResult: null,
  results: null,
  error: null,
  errorPhase: null,
  updatedAt: 0,
};

export const useAssessmentStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),
      setUserName: (userName) => set({ userName }),
      setDemographics: (demographics) => set({ demographics }),
      setRecoveryPreferences: (recoveryPreferences) => set({ recoveryPreferences }),
      setPersonalityQuestions: (personalityQuestions) =>
        set({
          personalityQuestions,
          personalityAnswers: emptyAnswers(personalityQuestions.length),
          personalityIndex: 0,
        }),
      setBurnoutQuestions: (burnoutQuestions) =>
        set({
          burnoutQuestions,
          burnoutAnswers: emptyAnswers(burnoutQuestions.length),
          burnoutIndex: 0,
        }),
      setPersonalityResult: (personalityResult) => set({ personalityResult }),
      setBurnoutAnswer: (index, value) =>
        set((s) => {
          const burnoutAnswers = [...s.burnoutAnswers];
          burnoutAnswers[index] = value;
          return { burnoutAnswers };
        }),
      setPersonalityAnswer: (index, value) =>
        set((s) => {
          const personalityAnswers = [...s.personalityAnswers];
          personalityAnswers[index] = value;
          return { personalityAnswers };
        }),
      nextBurnout: () => set((s) => ({ burnoutIndex: s.burnoutIndex + 1 })),
      prevBurnout: () => set((s) => ({ burnoutIndex: Math.max(0, s.burnoutIndex - 1) })),
      setBurnoutIndex: (burnoutIndex) => set({ burnoutIndex }),
      nextPersonality: () => set((s) => ({ personalityIndex: s.personalityIndex + 1 })),
      prevPersonality: () =>
        set((s) => ({ personalityIndex: Math.max(0, s.personalityIndex - 1) })),
      setResults: (results) => set({ results, phase: 'results', error: null, errorPhase: null }),
      mergeResults: (patch) =>
        set((s) => ({
          results: s.results ? { ...s.results, ...patch } : patch,
        })),
      setError: (error, errorPhase = null) =>
        set({ error, errorPhase, phase: 'error' }),
      clearError: () => set({ error: null, errorPhase: null }),
      reset: () => set({ ...initialState, updatedAt: Date.now() }),
      expireIfStale: () => {
        // Don't wipe state before localStorage rehydration finishes.
        if (!useAssessmentStore.persist.hasHydrated()) return false;
        const { updatedAt, phase, results } = get();
        if (phase === 'hero') return false;
        if (phase === 'results' || results?.burnout) {
          if (isExpired(updatedAt)) {
            get().reset();
            return true;
          }
          return false;
        }
        if (isExpired(updatedAt)) {
          get().reset();
          return true;
        }
        return false;
      },
      getPayload: () => {
        const state = get();
        return {
          userName: state.userName,
          demographics: state.demographics,
          recoveryPreferences: state.recoveryPreferences,
          personality: state.personalityResult,
          personalityAnswers: state.personalityAnswers,
          personalityQuestions: state.personalityQuestions,
          burnoutAnswers: state.burnoutAnswers,
          burnoutQuestions: state.burnoutQuestions,
        };
      },
      isPersonalityComplete: () => {
        const { personalityAnswers, personalityQuestions } = get();
        return (
          personalityQuestions.length > 0 &&
          personalityAnswers.length === personalityQuestions.length &&
          personalityAnswers.every((a) => a !== null)
        );
      },
      isBurnoutComplete: () => {
        const { burnoutAnswers, burnoutQuestions } = get();
        return (
          burnoutQuestions.length > 0 &&
          burnoutAnswers.length === burnoutQuestions.length &&
          burnoutAnswers.every((a) => a !== null)
        );
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => expiringLocalStorage()),
      partialize: (s) => ({
        phase: s.phase,
        userName: s.userName,
        demographics: s.demographics,
        recoveryPreferences: s.recoveryPreferences,
        burnoutIndex: s.burnoutIndex,
        personalityIndex: s.personalityIndex,
        burnoutAnswers: s.burnoutAnswers,
        personalityAnswers: s.personalityAnswers,
        personalityQuestions: s.personalityQuestions,
        burnoutQuestions: s.burnoutQuestions,
        personalityResult: s.personalityResult,
        results: s.results,
        updatedAt: s.updatedAt,
      }),
      merge: (persisted, current) => {
        try {
        if (!persisted || isExpired(persisted.updatedAt)) {
          return { ...current, ...initialState, updatedAt: Date.now() };
        }
        const merged = {
          ...current,
          ...persisted,
          recoveryPreferences: {
            ...emptyRecoveryPreferences(),
            ...(persisted?.recoveryPreferences ?? {}),
          },
        };

        if (persisted.results?.burnout && persisted.results?.personality) {
          merged.phase = 'results';
          merged.results = persisted.results;
          merged.error = null;
          merged.errorPhase = null;
          return merged;
        }

        const hasName = Boolean(merged.userName?.trim());
        const hasProfile = isValidDemographics(merged.demographics);
        const hasRecoveryPreferences = isValidRecoveryPreferences(merged.recoveryPreferences);
        const hasPersonalityTest = merged.personalityQuestions?.length >= 10;
        const hasBurnoutTest = merged.burnoutQuestions?.length >= 10;
        const hasPersonalityResult = Boolean(merged.personalityResult?.typeCode);
        const personalityAnswers = Array.isArray(merged.personalityAnswers)
          ? merged.personalityAnswers
          : [];
        const burnoutAnswers = Array.isArray(merged.burnoutAnswers) ? merged.burnoutAnswers : [];
        const personalityDone =
          hasPersonalityTest &&
          personalityAnswers.length === merged.personalityQuestions?.length &&
          personalityAnswers.every((a) => a !== null);
        const burnoutStarted = burnoutAnswers.some((a) => a !== null);
        const burnoutDone =
          hasBurnoutTest &&
          burnoutAnswers.length === merged.burnoutQuestions?.length &&
          burnoutAnswers.every((a) => a !== null);

        const keepPhases = new Set([
          'hero',
          'name',
          'profile',
          'personality',
          'personality-insight',
          'burnout',
          'recovery-preferences',
          'processing',
          'loading-personality-test',
          'loading-burnout-test',
          'scoring-personality',
        ]);
        if (keepPhases.has(persisted.phase)) {
          merged.phase = persisted.phase;
          if (merged.phase === 'personality' && !hasPersonalityTest) {
            merged.phase = 'loading-personality-test';
          } else if (merged.phase === 'burnout' && !hasBurnoutTest) {
            merged.phase = 'loading-burnout-test';
          } else if (merged.phase === 'personality-insight' && !hasPersonalityResult) {
            merged.phase = personalityDone ? 'scoring-personality' : 'personality';
          }
        } else if (personalityDone && burnoutDone && !hasRecoveryPreferences) {
          merged.phase = 'recovery-preferences';
        } else if (personalityDone && burnoutDone) {
          merged.phase = 'processing';
        } else if (burnoutStarted || (hasPersonalityResult && hasBurnoutTest)) {
          merged.phase = 'burnout';
        } else if (hasPersonalityResult && !hasBurnoutTest) {
          merged.phase = 'personality-insight';
        } else if (personalityDone && !hasPersonalityResult) {
          merged.phase = 'scoring-personality';
        } else if (hasPersonalityTest) {
          merged.phase = 'personality';
        } else if (hasName && hasProfile) {
          merged.phase = 'loading-personality-test';
        } else if (hasName) {
          merged.phase = 'profile';
        } else {
          merged.phase = 'hero';
        }

        merged.results = null;
        merged.error = null;
        merged.errorPhase = null;
        return merged;
        } catch (err) {
          console.warn('Could not restore assessment session:', err);
          return { ...current, ...initialState, updatedAt: Date.now() };
        }
      },
    },
  ),
);

/** True after localStorage rehydration finished (safe to trust phase/results). */
export function useAssessmentHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    typeof window === 'undefined' ? false : useAssessmentStore.persist.hasHydrated(),
  );

  useEffect(() => {
    setHydrated(useAssessmentStore.persist.hasHydrated());
    return useAssessmentStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
