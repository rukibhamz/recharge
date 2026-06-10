import { useCallback, useEffect } from 'react';
import { useAssessmentStore } from './store/assessment.js';
import {
  fetchBurnoutQuestions,
  fetchPersonalityQuestions,
  submitAssessment,
} from './services/api.js';
import { useAuth } from './context/AuthContext.jsx';
import { runOnce, clearFetchGuards } from './lib/fetchGuards.js';
import ScreenTransition from './components/shared/ScreenTransition.jsx';
import Hero from './screens/Hero.jsx';
import NameStep from './screens/NameStep.jsx';
import BurnoutPhase from './screens/BurnoutPhase.jsx';
import PersonalityPhase from './screens/PersonalityPhase.jsx';
import Processing from './screens/Processing.jsx';
import QuestionLoading from './screens/QuestionLoading.jsx';
import Results from './screens/Results.jsx';
import SharePage from './screens/SharePage.jsx';
import Login from './screens/Login.jsx';
import AuthCallback from './screens/AuthCallback.jsx';
import HistoryPage from './screens/HistoryPage.jsx';
import SavedResult from './screens/SavedResult.jsx';

const SHARE_PATH = /^\/share\/([a-f0-9]{32})$/i;
const HISTORY_DETAIL_PATH = /^\/history\/([0-9a-f-]{36})$/i;

function usePathRoute() {
  if (typeof window === 'undefined') return { kind: 'app' };

  const path = window.location.pathname;

  if (path === '/auth/callback') return { kind: 'auth-callback' };
  if (path === '/login') return { kind: 'login' };
  if (path === '/history') return { kind: 'history' };

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
  if (route.kind === 'history') return <HistoryPage />;
  if (route.kind === 'history-detail') return <SavedResult sessionId={route.sessionId} />;
  if (route.kind === 'share') return <SharePage shareToken={route.shareToken} />;

  return <AssessmentFlow />;
}

function AssessmentFlow() {
  const { getAccessToken } = useAuth();
  const {
    phase,
    userName,
    burnoutIndex,
    personalityIndex,
    burnoutAnswers,
    personalityAnswers,
    personalityQuestions,
    burnoutQuestions,
    results,
    error,
    setPhase,
    setUserName,
    setPersonalityQuestions,
    setBurnoutQuestions,
    setBurnoutAnswer,
    setPersonalityAnswer,
    nextBurnout,
    prevBurnout,
    nextPersonality,
    prevPersonality,
    setResults,
    setError,
    reset,
    getPayload,
  } = useAssessmentStore();

  const handleProcessing = useCallback(() => {
    runOnce('assess', async () => {
      try {
        const payload = getPayload();
        const token = await getAccessToken();
        const data = await submitAssessment(payload, token);
        setResults(data);
      } catch (err) {
        setError(err.message);
      }
    });
  }, [getPayload, setResults, setError, getAccessToken]);

  const handleLoadPersonalityQuestions = useCallback(() => {
    if (personalityQuestions.length === 12) {
      setPhase('personality');
      return;
    }
    runOnce('personality', async () => {
      try {
        const { questions } = await fetchPersonalityQuestions(userName);
        setPersonalityQuestions(questions);
        setPhase('personality');
      } catch (err) {
        setError(err.message);
      }
    });
  }, [userName, personalityQuestions.length, setPersonalityQuestions, setPhase, setError]);

  const handleLoadBurnoutQuestions = useCallback(() => {
    if (burnoutQuestions.length === 12) {
      setPhase('burnout');
      return;
    }
    runOnce('burnout', async () => {
      try {
        const { questions } = await fetchBurnoutQuestions({
          userName,
          personalityAnswers,
          personalityQuestions,
        });
        setBurnoutQuestions(questions);
        setPhase('burnout');
      } catch (err) {
        setError(err.message);
      }
    });
  }, [
    userName,
    personalityAnswers,
    personalityQuestions,
    burnoutQuestions.length,
    setBurnoutQuestions,
    setPhase,
    setError,
  ]);

  useEffect(() => {
    if (phase === 'loading-personality') handleLoadPersonalityQuestions();
  }, [phase, handleLoadPersonalityQuestions]);

  useEffect(() => {
    if (phase === 'loading-burnout') handleLoadBurnoutQuestions();
  }, [phase, handleLoadBurnoutQuestions]);

  useEffect(() => {
    if (phase === 'processing') handleProcessing();
  }, [phase, handleProcessing]);

  const handleClose = () => {
    clearFetchGuards();
    reset();
  };

  const handleRetake = () => {
    clearFetchGuards();
    reset();
  };

  const activePhase =
    phase === 'results' && !results && !error ? 'hero' : phase;

  return (
    <ScreenTransition screenKey={activePhase}>
      {activePhase === 'hero' && <Hero onStart={() => setPhase('name')} />}

      {activePhase === 'name' && (
        <NameStep
          initialName={userName}
          onBack={() => setPhase('hero')}
          onClose={handleClose}
          onContinue={(name) => {
            setUserName(name);
            setPhase('loading-personality');
          }}
        />
      )}

      {activePhase === 'loading-personality' && (
        <QuestionLoading
          messages={[
            'Conducting your personality test…',
            userName
              ? `${userName.split(' ')[0]}, preparing your questions…`
              : 'Preparing your questions…',
          ]}
        />
      )}

      {activePhase === 'personality' && personalityQuestions.length === 12 && (
        <PersonalityPhase
          questions={personalityQuestions}
          index={personalityIndex}
          answers={personalityAnswers}
          onAnswer={(value) => setPersonalityAnswer(personalityIndex, value)}
          onNext={nextPersonality}
          onBack={() => {
            if (personalityIndex === 0) setPhase('name');
            else prevPersonality();
          }}
          onClose={handleClose}
          onComplete={() => setPhase('loading-burnout')}
        />
      )}

      {activePhase === 'loading-burnout' && (
        <QuestionLoading
          messages={[
            'Tailoring your burnout check…',
            userName
              ? `${userName.split(' ')[0]}, matching questions to your profile…`
              : 'Matching questions to your profile…',
          ]}
        />
      )}

      {activePhase === 'burnout' && burnoutQuestions.length === 12 && (
        <BurnoutPhase
          questions={burnoutQuestions}
          index={burnoutIndex}
          answers={burnoutAnswers}
          onAnswer={(value) => setBurnoutAnswer(burnoutIndex, value)}
          onNext={nextBurnout}
          onBack={() => {
            if (burnoutIndex === 0) setPhase('personality');
            else prevBurnout();
          }}
          onClose={handleClose}
          onComplete={() => setPhase('processing')}
        />
      )}

      {activePhase === 'processing' && <Processing />}

      {activePhase === 'results' && (
        <Results data={results} error={error} onRetake={handleRetake} />
      )}
    </ScreenTransition>
  );
}
