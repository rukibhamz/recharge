import { useEffect, useState } from 'react';
import AssessmentFlowBar from '../components/assessment/AssessmentFlowBar.jsx';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';
import EditorialMobileBand from '../components/shared/EditorialMobileBand.jsx';

const DEFAULT_MESSAGES = [
  'Creating your personal recovery map.',
  'Mapping your personality type…',
  'Analyzing burnout dimensions…',
  'Generating your personalised recommendations…',
];

function ProcessingIcon() {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <div className="processing-ring absolute inset-0 rounded-full border border-primary/10" />
      <div className="processing-ring absolute inset-4 rounded-full border border-primary/10" />
      <svg
        className="processing-arc absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 160 160"
        aria-hidden="true"
      >
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="#2D6A4F"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="90 350"
        />
      </svg>
      <div className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-linen-raised shadow-card">
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="20" r="10" stroke="#2D6A4F" strokeWidth="2" />
          <path
            d="M10 42c2-8 8-12 14-12s12 4 14 12"
            stroke="#2D6A4F"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="30" cy="18" r="5" stroke="#2D6A4F" strokeWidth="1.5" />
          <circle cx="30" cy="18" r="2" fill="#2D6A4F" />
        </svg>
      </div>
    </div>
  );
}

export default function Processing({ phase, messages = DEFAULT_MESSAGES }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    setMsgIndex(0);
    setProgress(8);
  }, [phase, messages]);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 2200);
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 6, 92));
    }, 400);
    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [messages]);

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="processing-mobile" />
      <div className="hidden lg:block">
        <Header />
      </div>

      {phase ? (
        <div className="pt-6">
          <AssessmentFlowBar phase={phase} />
        </div>
      ) : null}

      <section className="mx-auto flex max-w-landing flex-1 items-center px-margin-mobile py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="text-center lg:text-left">
            <EditorialMobileBand
              variant="recovery"
              badge="Personal synthesis"
              title="Creating your recovery map"
              text="Combining personality, burnout signals, and tailored recommendations."
              compact
              className="text-left"
            />
            <ProcessingIcon />

            <h1
              className="mt-10 max-w-lg font-display text-headline-lg-mobile text-primary lg:text-headline-lg"
              aria-live="polite"
            >
              {messages[msgIndex]}
            </h1>
            <p className="mt-3 font-sans text-body-md text-on-surface-variant">
              This usually takes about 15 seconds
            </p>

            <span className="ai-badge mt-8">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3l1.2 3.6L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z" fill="currentColor" />
              </svg>
              Processing
            </span>
          </div>

          <div className="glass-card hidden p-5 lg:block">
            <EditorialArtwork variant="recovery" className="aspect-[1.1/1] w-full" />
            <div className="px-2 pb-2 pt-5">
              <p className="font-sans text-label-sm uppercase tracking-[0.08em] text-primary/70">
                Personal synthesis
              </p>
              <p className="mt-2 font-sans text-body-md leading-relaxed text-on-surface-variant">
                We&apos;re combining your personality pattern, burnout signals, and recovery fit into one
                response that feels more human and specific.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="px-margin-mobile pb-6 sm:px-8 lg:px-12 lg:pb-10">
        <div className="mx-auto h-1 max-w-landing overflow-hidden rounded-full bg-surface-soft">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Footer compact />
    </div>
  );
}
