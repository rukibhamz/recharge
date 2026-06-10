import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const emptyAnswers = () => Array(12).fill(null);

export const useAssessmentStore = create(
  persist(
    (set, get) => ({
      phase: 'hero',
      userName: '',
      burnoutIndex: 0,
      personalityIndex: 0,
      burnoutAnswers: emptyAnswers(),
      personalityAnswers: emptyAnswers(),
      personalityQuestions: [],
      burnoutQuestions: [],
      results: null,
      error: null,

      setPhase: (phase) => set({ phase }),
      setUserName: (userName) => set({ userName }),
      setPersonalityQuestions: (personalityQuestions) => set({ personalityQuestions }),
      setBurnoutQuestions: (burnoutQuestions) => set({ burnoutQuestions }),
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
      setResults: (results) => set({ results, phase: 'results', error: null }),
      setError: (error) => set({ error, phase: 'results' }),
      reset: () =>
        set({
          phase: 'hero',
          userName: '',
          burnoutIndex: 0,
          personalityIndex: 0,
          burnoutAnswers: emptyAnswers(),
          personalityAnswers: emptyAnswers(),
          personalityQuestions: [],
          burnoutQuestions: [],
          results: null,
          error: null,
        }),
      getPayload: () => {
        const {
          userName,
          burnoutAnswers,
          personalityAnswers,
          burnoutQuestions,
          personalityQuestions,
        } = get();
        return {
          userName,
          burnoutAnswers,
          personalityAnswers,
          burnoutQuestions,
          personalityQuestions,
        };
      },
    }),
    {
      name: 'recharge-assessment-v8',
      partialize: (s) => ({
        userName: s.userName,
        burnoutIndex: s.burnoutIndex,
        personalityIndex: s.personalityIndex,
        burnoutAnswers: s.burnoutAnswers,
        personalityAnswers: s.personalityAnswers,
        personalityQuestions: s.personalityQuestions,
        burnoutQuestions: s.burnoutQuestions,
      }),
      merge: (persisted, current) => {
        const merged = { ...current, ...persisted };
        const hasName = Boolean(merged.userName?.trim());
        const burnoutStarted = merged.burnoutAnswers?.some((a) => a !== null);
        const personalityStarted = merged.personalityAnswers?.some((a) => a !== null);
        const burnoutDone = merged.burnoutAnswers?.every((a) => a !== null);
        const personalityDone = merged.personalityAnswers?.every((a) => a !== null);
        const hasPersonalityQuestions = merged.personalityQuestions?.length === 12;
        const hasBurnoutQuestions = merged.burnoutQuestions?.length === 12;

        if (personalityDone && burnoutDone) {
          merged.phase = 'processing';
        } else if (burnoutStarted || (personalityDone && !burnoutDone)) {
          merged.phase = hasBurnoutQuestions ? 'burnout' : 'loading-burnout';
        } else if (personalityStarted) {
          merged.phase = hasPersonalityQuestions ? 'personality' : 'loading-personality';
        } else if (hasName && hasPersonalityQuestions) {
          merged.phase = 'personality';
        } else if (hasName) {
          merged.phase = 'loading-personality';
        } else {
          merged.phase = 'hero';
        }

        merged.results = null;
        merged.error = null;
        return merged;
      },
    },
  ),
);
