import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isValidDemographics } from '@recharge/shared/demographics';

const emptyAnswers = (n = 0) => Array(n).fill(null);
const emptyDemographics = () => ({
  country: '',
  city: '',
  ageBand: '',
  workContext: '',
  workSector: '',
});

export const useAssessmentStore = create(
  persist(
    (set, get) => ({
      phase: 'hero',
      userName: '',
      demographics: emptyDemographics(),
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

      setPhase: (phase) => set({ phase }),
      setUserName: (userName) => set({ userName }),
      setDemographics: (demographics) => set({ demographics }),
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
      nextPersonality: () => set((s) => ({ personalityIndex: s.personalityIndex + 1 })),
      prevPersonality: () =>
        set((s) => ({ personalityIndex: Math.max(0, s.personalityIndex - 1) })),
      setResults: (results) => set({ results, phase: 'results', error: null, errorPhase: null }),
      setError: (error, errorPhase = null) =>
        set({ error, errorPhase, phase: 'error' }),
      clearError: () => set({ error: null, errorPhase: null }),
      reset: () =>
        set({
          phase: 'hero',
          userName: '',
          demographics: emptyDemographics(),
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
        }),
      getPayload: () => {
        const state = get();
        return {
          userName: state.userName,
          demographics: state.demographics,
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
      name: 'recharge-assessment-v14',
      partialize: (s) => ({
        userName: s.userName,
        demographics: s.demographics,
        burnoutIndex: s.burnoutIndex,
        personalityIndex: s.personalityIndex,
        burnoutAnswers: s.burnoutAnswers,
        personalityAnswers: s.personalityAnswers,
        personalityQuestions: s.personalityQuestions,
        burnoutQuestions: s.burnoutQuestions,
        personalityResult: s.personalityResult,
      }),
      merge: (persisted, current) => {
        const merged = { ...current, ...persisted };
        const hasName = Boolean(merged.userName?.trim());
        const hasProfile = isValidDemographics(merged.demographics);
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

        if (personalityDone && burnoutDone) {
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
