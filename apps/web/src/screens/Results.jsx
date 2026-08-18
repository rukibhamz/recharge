import {
  DEFAULT_RECOVERY_TIPS,
  normalizeRecommendationsList,
} from '@recharge/shared/recommendations';
import {
  buildMoodboardSections,
  resolveBurnoutReport,
  stripEmDashes,
} from '@recharge/shared/resultNarratives';
import { buildPsychometricProfile } from '@recharge/shared/psychometricEngine';
import { resolveOcean } from '@recharge/shared/oceanScoring';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import ScoreRing from '../components/results/ScoreRing.jsx';
import TraitBars from '../components/results/TraitBars.jsx';
import RecommendationCard from '../components/results/RecommendationCard.jsx';
import ShareCard from '../components/results/ShareCard.jsx';
import StructuredCopy, { MoodboardCopy } from '../components/results/StructuredCopy.jsx';
import PsychometricProfile from '../components/results/PsychometricProfile.jsx';
import RecoveryRoadmap from '../components/results/RecoveryRoadmap.jsx';
import { hydrateRecoveryRoadmap } from '@recharge/shared/recoveryRoadmap';
import { useShareCard } from '../hooks/useShareCard.js';
import SaveResultsSection from '../components/results/SaveResultsSection.jsx';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';
import FeedbackForm from '../components/shared/FeedbackForm.jsx';
import { ArcDivider } from '../components/shared/Arc.jsx';
import { BURNOUT_BADGE_CLASSES } from '../lib/design.js';
import { useAssessmentStore } from '../store/assessment.js';
export default function Results({ data, error, onRetake, showSaveSection = true }) {
  const mergeResults = useAssessmentStore((s) => s.mergeResults);
  const recoveryPreferences = useAssessmentStore((s) => s.recoveryPreferences);
  const shareToken = data?.shareToken ?? null;
  const shareCardPayload =
    data?.burnout && data?.personality
      ? {
          displayName: data.displayName,
          burnout: data.burnout,
          personality: data.personality,
        }
      : null;
  const { downloading, copied, downloadError, downloadCard, copyLink } = useShareCard(
    shareToken,
    shareCardPayload,
  );

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <section className="mx-auto max-w-container flex-1 px-margin-mobile py-16 text-center sm:px-gutter">
          <h2 className="font-display text-headline-lg text-primary">Something went wrong</h2>
          <p className="mt-4 font-sans text-body-md text-on-surface-variant">{error}</p>
          <Button className="mt-8" onClick={onRetake}>
            Try again
          </Button>
        </section>
        <Footer compact />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <section className="mx-auto max-w-container flex-1 px-margin-mobile py-16 text-center sm:px-gutter">
          <h2 className="font-display text-headline-lg text-primary">Session expired</h2>
          <p className="mt-4 font-sans text-body-md text-on-surface-variant">
            Your results aren&apos;t available anymore. Please retake the assessment.
          </p>
          <Button className="mt-8" onClick={onRetake}>
            Begin assessment
          </Button>
        </section>
        <Footer compact />
      </div>
    );
  }

  const {
    displayName,
    burnout = {},
    personality = {},
    recommendations: rawRecommendations,
    aiSource,
    persisted,
    persistError,
    sessionId,
    linked,
    recoveryRoadmap,
    roadmapLocked,
  } = data;
  const recommendations = normalizeRecommendationsList(rawRecommendations ?? [], DEFAULT_RECOVERY_TIPS);
  const report = resolveBurnoutReport(burnout, personality);
  const moodboardSections = buildMoodboardSections(personality, burnout);
  const psychometricProfile =
    personality.psychometricProfile ??
    (() => {
      const { scores } = resolveOcean(personality);
      if (scores?.O != null && burnout?.dimensions) {
        return buildPsychometricProfile({ scores }, burnout);
      }
      return null;
    })();
  const displayRoadmap = hydrateRecoveryRoadmap(
    recoveryRoadmap,
    {
      burnout,
      personality,
      psychometricProfile: psychometricProfile ?? personality.psychometricProfile,
      recoveryPreferences: personality.recoveryPreferences ?? recoveryPreferences,
    },
    { guestPreview: Boolean(roadmapLocked || recoveryRoadmap?.guestPreview) },
  );
  const roadmapIsLocked = Boolean(roadmapLocked || displayRoadmap?.guestPreview);
  const isPersonalised = aiSource && !['static', 'bank'].includes(aiSource);
  const cloudSaved = persisted !== false;
  const personalityTitle =
    psychometricProfile?.diagnostic_summary?.primary_archetype ||
    personality.type?.title ||
    personality.type?.name ||
    'Your profile';
  const badgeClass = BURNOUT_BADGE_CLASSES[burnout.cls] ?? BURNOUT_BADGE_CLASSES.moderate;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-container flex-1 space-y-stack-gap px-margin-mobile py-stack-gap sm:px-gutter">
        {persisted === false ? (
          <div className="rounded-md border border-signal-red/30 bg-signal-red-tint px-4 py-3 text-center font-sans text-body-md text-ink-soft">
            Your results could not be saved to the cloud
            {persistError ? ` (${persistError})` : ''}. Share links and account history will not work
            until database setup is complete.
          </div>
        ) : null}

        <section className="surface-card p-6">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="hero-badge">Your reset portrait</span>
              <h1 className="mt-5 font-display text-headline-lg font-light text-ink">
                {displayName ? (
                  <>
                    {displayName}, here is what your energy looks like{' '}
                    <em className="text-canopy-600">right now</em>.
                  </>
                ) : (
                  <>
                    Here is what your energy looks like <em className="text-canopy-600">right now</em>.
                  </>
                )}
              </h1>
              <p className="mt-4 max-w-xl font-sans text-body-md text-ink-soft">
                Your burnout pattern, personality profile, and recovery plan, framed as information,
                not a verdict.
              </p>
            </div>
            <EditorialArtwork variant="recovery" className="editorial-frame aspect-[4/3] lg:aspect-[1.1/1]" />
          </div>
        </section>

        <section className="surface-card p-gutter">
          <div className="text-center">
            <ScoreRing pct={burnout.pct} cls={burnout.cls} level={null} />
            <div className="mt-5 flex justify-center">
              <span className={badgeClass}>● {burnout.level}</span>
            </div>
            {burnout.rawPct != null && burnout.rawPct !== burnout.pct ? (
              <p className="mt-3 font-mono text-[12px] text-ink-faint">
                Relative to your personality profile
                {burnout.calibrationNote ? ` · ${burnout.calibrationNote}` : ''}
              </p>
            ) : null}
          </div>
          <StructuredCopy report={report} className="mx-auto mt-8 max-w-2xl" />
          {psychometricProfile ? (
            <PsychometricProfile profile={psychometricProfile} className="mx-auto mt-10 max-w-2xl" />
          ) : null}
        </section>

        <ArcDivider />

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-card p-gutter">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fern-tint text-2xl">
                {personality.type?.icon ?? '✨'}
              </div>
              <div>
                <h3 className="font-display text-headline-md font-normal text-ink">{personalityTitle}</h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                  Big Five (OCEAN)
                </span>
              </div>
            </div>
            <p className="mb-8 font-sans text-body-md text-ink-soft">
              {stripEmDashes(
                psychometricProfile?.diagnostic_summary?.core_conflict ||
                  personality.summary ||
                  personality.type?.desc,
              )}
            </p>
            <TraitBars traits={personality.traits} />
          </div>

          <div className="surface-card p-4 sm:p-5">
            <EditorialArtwork variant="reflection" className="aspect-[4/3] w-full rounded-md" />
            <div className="px-2 pb-2 pt-5">
              <p className="card-eyebrow">Profile moodboard</p>
              <MoodboardCopy sections={moodboardSections} className="mt-3" />
            </div>
          </div>
        </section>

        <section className="space-y-gutter">
          {displayRoadmap?.phases?.length ? (
            <RecoveryRoadmap
              roadmap={displayRoadmap}
              locked={roadmapIsLocked}
              sessionId={sessionId}
              linked={linked}
              cloudSaved={cloudSaved}
              isPersonalised={isPersonalised}
              onUnlocked={(session) => {
                if (!session) return;
                mergeResults({
                  recommendations: session.recommendations ?? data.recommendations,
                  recoveryRoadmap: session.recoveryRoadmap,
                  roadmapLocked: false,
                  linked: true,
                });
              }}
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-headline-md font-normal text-ink">Your recovery roadmap</h3>
                <span className="ai-badge">{isPersonalised ? 'Personalised' : 'Curated'}</span>
              </div>
              <p className="font-sans text-body-md text-ink-soft">
                Four practical steps for this week. Start today, then protect your energy as you go.
              </p>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                {recommendations.map((rec, i) => (
                  <RecommendationCard key={i} {...rec} />
                ))}
              </div>
            </>
          )}
        </section>

        <FeedbackForm page="results" compact />

        <section className="flex flex-col gap-3">
          {shareToken && cloudSaved ? (
            <Button variant="ember" className="w-full" size="lg" onClick={copyLink}>
              {copied ? 'Link copied!' : 'Share results'}
            </Button>
          ) : null}

          <Button variant="secondary" className="w-full" onClick={onRetake}>
            Retake assessment
          </Button>

          {shareToken && cloudSaved ? (
            <>
              <Button variant="ghost" className="w-full" onClick={downloadCard} disabled={downloading}>
                {downloading ? 'Preparing image…' : 'Download share card'}
              </Button>
              {downloadError ? (
                <p className="text-center font-sans text-body-md text-signal-red">{downloadError}</p>
              ) : null}
            </>
          ) : null}

          {showSaveSection && sessionId && !roadmapIsLocked ? (
            <SaveResultsSection
              sessionId={sessionId}
              initiallyLinked={linked}
              cloudSaved={cloudSaved}
            />
          ) : null}
        </section>

        {shareToken && cloudSaved ? (
          <div className="flex w-full max-w-full justify-center overflow-x-auto overflow-y-hidden rounded-md border border-linen-sunken bg-linen-sunken/50 p-4">
            <ShareCard displayName={displayName} burnout={burnout} personality={personality} />
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
