import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isValidDemographics } from '@recharge/shared/demographics';
import { isValidRecoveryPreferences } from '@recharge/shared/recoveryPreferences';

/** Abandoned in-progress assessments expire after 12 hours. */
export const ASSESSMENT_TTL_MS = 12 * 60 * 60 * 1000;
const STORAGE_KEY = 'recharge-assessment-v18';
const LEGACY_KEYS = ['recharge-assessment-v17', 'recharge-assessment-v16'];

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
        window.localStorage.setItem(name, JSON.stringify(parsed));
      } catch {
        window.localStorage.setItem(name, value);
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
      setError: (error, errorPhase = null) =>
        set({ error, errorPhase, phase: 'error' }),
      clearError: () => set({ error: null, errorPhase: null }),
      reset: () => set({ ...initialState, updatedAt: 0 }),
      expireIfStale: () => {
        const { updatedAt, phase } = get();
        if (phase === 'hero' || phase === 'results') return false;
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
        updatedAt: s.updatedAt,
      }),
      merge: (persisted, current) => {
        if (!persisted || isExpired(persisted.updatedAt)) {
          return { ...current, ...initialState };
        }
        const merged = {
          ...current,
          ...persisted,
          recoveryPreferences: {
            ...emptyRecoveryPreferences(),
            ...(persisted?.recoveryPreferences ?? {}),
          },
        };
        const hasName = Boolean(merged.userName?.trim());
        const hasProfile = isValidDemographics(merged.demographics);
        const hasRecoveryPreferences = isValidRecoveryPreferences(merged.recoveryPreferences);
        const hasPersonalityTest = merged.personalityQuestions?.length >= 10;
        const hasBurnoutTest = merged.burnoutQuestions?.length >= 10;
        const hasPersonalityResult = Boolean(merged.personalityResult?.typeCode);
        const personalityDone =
          hasPersonalityTest &&
          merged.personalityAnswers?.length === merged.personalityQuestions?.length &&
          merged.personalityAnswers?.every((a) => a !== null);
        const burnoutStarted = merged.burnoutAnswers?.some((a) => a !== null);
        const burnoutDone =
          hasBurnoutTest &&
          merged.burnoutAnswers?.length === merged.burnoutQuestions?.length &&
          merged.burnoutAnswers?.every((a) => a !== null);

        if (personalityDone && burnoutDone && !hasRecoveryPreferences) {
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
      },
    },
  ),
);
