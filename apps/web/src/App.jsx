import { useCallback, useEffect } from 'react';
import { useAssessmentStore } from './store/assessment.js';
import {
  completeAssessment,
  fetchBurnoutTest,
  fetchPersonalityTest,
  scorePersonalityTest,
} from './services/api.js';
import { useAuth } from './context/AuthContext.jsx';
import { runOnce, clearFetchGuards } from './lib/fetchGuards.js';
import ScreenTransition from './components/shared/ScreenTransition.jsx';
import Hero from './screens/Hero.jsx';
import NameStep from './screens/NameStep.jsx';
import ProfileStep from './screens/ProfileStep.jsx';
import BurnoutPhase from './screens/BurnoutPhase.jsx';
import PersonalityPhase from './screens/PersonalityPhase.jsx';
import PersonalityInsight from './screens/PersonalityInsight.jsx';
import AssessmentError from './screens/AssessmentError.jsx';
import Processing from './screens/Processing.jsx';
import QuestionLoading from './screens/QuestionLoading.jsx';
import Results from './screens/Results.jsx';
import SharePage from './screens/SharePage.jsx';
import Login from './screens/Login.jsx';
import AuthCallback from './screens/AuthCallback.jsx';
import AccountSettings from './screens/AccountSettings.jsx';
import HistoryRedirect from './screens/HistoryRedirect.jsx';
import SavedResult from './screens/SavedResult.jsx';
import LegalPage from './screens/LegalPage.jsx';

const SHARE_PATH = /^\/share\/([a-f0-9]{32})$/i;
const HISTORY_DETAIL_PATH = /^\/history\/([0-9a-f-]{36})$/i;

function usePathRoute() {
  if (typeof window === 'undefined') return { kind: 'app' };

  const path = window.location.pathname;

  if (path === '/auth/callback') return { kind: 'auth-callback' };
  if (path === '/login') return { kind: 'login' };
  if (path === '/account') return { kind: 'account' };
  if (path === '/history') return { kind: 'history' };
  if (path === '/privacy') return { kind: 'legal', legal: 'privacy' };
  if (path === '/terms') return { kind: 'legal', legal: 'terms' };
  if (path === '/security') return { kind: 'legal', legal: 'security' };

  const historyMatch = path.match(HISTORY_DETAIL_PATH);
  if (historyMatch) return { kind: 'history-detail', sessionId: historyMatch[1] };

  const shareMatch = path.match(SHARE_PATH);
  if (shareMatch) return { kind: 'share', shareToken: shareMatch[1] };

  return { kind: 'app' };
}

export default function App() {
  const route = usePathRoute();

  if (route.kind === 'auth-callback') return <AuthCallback />;
  if (route.kind === 'login') return <Login />;
  if (route.kind === 'account') return <AccountSettings />;
  if (route.kind === 'legal') return <LegalPage kind={route.legal} />;
  if (route.kind === 'history') return <HistoryRedirect />;
  if (route.kind === 'history-detail') return <SavedResult sessionId={route.sessionId} />;
  if (route.kind === 'share') return <SharePage shareToken={route.shareToken} />;

  return <AssessmentFlow />;
}

function AssessmentFlow() {
  const { getAccessToken } = useAuth();
  const {
    phase,
    userName,
    demographics,
    burnoutIndex,
    personalityIndex,
    burnoutAnswers,
    personalityAnswers,
    personalityQuestions,
    burnoutQuestions,
    personalityResult,
    results,
    error,
    errorPhase,
    setPhase,
    setUserName,
    setDemographics,
    setPersonalityQuestions,
    setBurnoutQuestions,
    setPersonalityResult,
    setBurnoutAnswer,
    setPersonalityAnswer,
    nextBurnout,
    prevBurnout,
    nextPersonality,
    prevPersonality,
    setResults,
    setError,
    clearError,
    reset,
    getPayload,
    isPersonalityComplete,
  } = useAssessmentStore();

  const firstName = userName?.trim().split(/\s+/)[0] ?? '';

  // Recover from stale persisted state that would otherwise render a blank screen
  useEffect(() => {
    if (phase === 'personality' && personalityQuestions.length < 10) {
      setPhase('loading-personality-test');
    } else if (phase === 'burnout' && burnoutQuestions.length < 10) {
      setPhase('loading-burnout-test');
    } else if (phase === 'personality-insight' && !personalityResult) {
      setPhase(personalityQuestions.length >= 10 ? 'personality' : 'loading-personality-test');
    }
  }, [
    phase,
    personalityQuestions.length,
    burnoutQuestions.length,
    personalityResult,
    setPhase,
  ]);

  const fail = useCallback(
    (message, failedPhase) => {
      setError(message, failedPhase ?? phase);
    },
    [phase, setError],
  );

  const handleLoadPersonalityTest = useCallback(() => {
    if (personalityQuestions.length >= 10) {
      setPhase('personality');
      return;
    }
    runOnce('personality-test', async () => {
      try {
        const { questions } = await fetchPersonalityTest(userName, demographics);
        setPersonalityQuestions(questions);
        setPhase('personality');
      } catch (err) {
        fail(err.message, 'loading-personality-test');
      }
    });
  }, [
    userName,
    demographics,
    personalityQuestions.length,
    setPersonalityQuestions,
    setPhase,
    fail,
  ]);

  const handleScorePersonality = useCallback(() => {
    runOnce('personality-score', async () => {
      try {
        const { personality } = await scorePersonalityTest({
          userName,
          demographics,
          questions: personalityQuestions,
          answers: personalityAnswers,
        });
        setPersonalityResult(personality);
        setPhase('personality-insight');
      } catch (err) {
        fail(err.message, 'scoring-personality');
      }
    });
  }, [
    userName,
    demographics,
    personalityQuestions,
    personalityAnswers,
    setPersonalityResult,
    setPhase,
    fail,
  ]);

  const handleLoadBurnoutTest = useCallback(() => {
    if (!personalityResult?.typeCode) {
      setPhase('scoring-personality');
      return;
    }
    if (burnoutQuestions.length >= 10) {
      setPhase('burnout');
      return;
    }
    runOnce('burnout-test', async () => {
      try {
        const { questions } = await fetchBurnoutTest({
          userName,
          demographics,
          personality: personalityResult,
        });
        setBurnoutQuestions(questions);
        setPhase('burnout');
      } catch (err) {
        fail(err.message, 'loading-burnout-test');
      }
    });
  }, [
    userName,
    demographics,
    personalityResult,
    burnoutQuestions.length,
    setBurnoutQuestions,
    setPhase,
    fail,
  ]);

  const handleComplete = useCallback(() => {
    runOnce('complete', async () => {
      try {
        const payload = getPayload();
        const token = await getAccessToken();
        const data = await completeAssessment(payload, token);
        setResults(data);
      } catch (err) {
        fail(err.message, 'processing');
      }
    });
  }, [getPayload, setResults, fail, getAccessToken]);

  useEffect(() => {
    if (phase === 'loading-personality-test') handleLoadPersonalityTest();
  }, [phase, handleLoadPersonalityTest]);

  useEffect(() => {
    if (phase === 'scoring-personality') handleScorePersonality();
  }, [phase, handleScorePersonality]);

  useEffect(() => {
    if (phase === 'loading-burnout-test') handleLoadBurnoutTest();
  }, [phase, handleLoadBurnoutTest]);

  useEffect(() => {
    if (phase === 'processing') handleComplete();
  }, [phase, handleComplete]);

  const handleClose = () => {
    clearFetchGuards();
    reset();
  };

  const handleRetake = () => {
    clearFetchGuards();
    reset();
  };

  const handleRetry = () => {
    const retryPhase = errorPhase ?? 'loading-personality-test';
    clearError();
    clearFetchGuards();
    setPhase(retryPhase);
  };

  const activePhase = phase === 'error' ? 'error' : phase === 'results' && !results ? 'hero' : phase;

  if (activePhase === 'error') {
    return (
      <AssessmentError
        error={error}
        errorPhase={errorPhase}
        onRetry={handleRetry}
        onStartOver={handleRetake}
      />
    );
  }

  return (
    <ScreenTransition screenKey={activePhase}>
      {activePhase === 'hero' && <Hero onStart={() => setPhase('name')} />}

      {activePhase === 'name' && (
        <NameStep
          phase="name"
          initialName={userName}
          onBack={() => setPhase('hero')}
          onClose={handleClose}
          onContinue={(name) => {
            setUserName(name);
            setPhase('profile');
          }}
        />
      )}

      {activePhase === 'profile' && (
        <ProfileStep
          phase="profile"
          initialProfile={demographics}
          onBack={() => setPhase('name')}
          onClose={handleClose}
          onContinue={(profile) => {
            setDemographics(profile);
            setPhase('loading-personality-test');
          }}
        />
      )}

      {activePhase === 'loading-personality-test' && (
        <QuestionLoading
          phase="loading-personality-test"
          badge="Building your interview"
          messages={[
            'Building your personality interview…',
            firstName
              ? `${firstName}, we're writing questions just for you.`
              : 'Writing questions tailored to your profile.',
          ]}
        />
      )}

      {activePhase === 'personality' && personalityQuestions.length >= 10 && (
        <PersonalityPhase
          phase="personality"
          questions={personalityQuestions}
          index={personalityIndex}
          answers={personalityAnswers}
          onAnswer={(value) => setPersonalityAnswer(personalityIndex, value)}
          onNext={nextPersonality}
          onBack={() => {
            if (personalityIndex === 0) setPhase('profile');
            else prevPersonality();
          }}
          onClose={handleClose}
          onComplete={() => {
            if (isPersonalityComplete()) setPhase('scoring-personality');
          }}
        />
      )}

      {activePhase === 'scoring-personality' && (
        <Processing
          phase="scoring-personality"
          messages={[
            'Reading your personality patterns…',
            'Understanding how you recharge and decide…',
          ]}
        />
      )}

      {activePhase === 'personality-insight' && personalityResult && (
        <PersonalityInsight
          personality={personalityResult}
          userName={userName}
          onContinue={() => setPhase('loading-burnout-test')}
          onBack={() => setPhase('personality')}
          onClose={handleClose}
        />
      )}

      {activePhase === 'loading-burnout-test' && (
        <QuestionLoading
          phase="loading-burnout-test"
          badge="Preparing check-in"
          messages={[
            'Preparing your burnout check-in…',
            personalityResult?.type?.title
              ? `Questions shaped for a ${personalityResult.type.title} profile.`
              : 'Questions shaped to your personality profile.',
          ]}
        />
      )}

      {activePhase === 'burnout' && burnoutQuestions.length >= 10 && (
        <BurnoutPhase
          phase="burnout"
          questions={burnoutQuestions}
          index={burnoutIndex}
          answers={burnoutAnswers}
          personalityType={personalityResult?.type?.title}
          onAnswer={(value) => setBurnoutAnswer(burnoutIndex, value)}
          onNext={nextBurnout}
          onBack={() => {
            if (burnoutIndex === 0) setPhase('personality-insight');
            else prevBurnout();
          }}
          onClose={handleClose}
          onComplete={() => setPhase('processing')}
        />
      )}

      {activePhase === 'processing' && (
        <Processing
          phase="processing"
          messages={[
            'Assessing your energy and stress levels…',
            'Crafting personalised recommendations…',
          ]}
        />
      )}

      {activePhase === 'results' && (
        <Results data={results} onRetake={handleRetake} />
      )}
    </ScreenTransition>
  );
}
