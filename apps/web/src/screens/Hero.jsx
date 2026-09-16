import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';
import ArcIcon, { ArcDivider } from '../components/shared/Arc.jsx';
import { useTenant } from '../context/TenantContext.jsx';

const FEATURES = [
  {
    eyebrow: 'About 10 minutes',
    title: 'Two short interviews',
    text: 'Personality first, then a burnout check-in shaped by how you actually operate.',
  },
  {
    eyebrow: 'Your pattern',
    title: 'A clear energy portrait',
    text: 'See what is draining you now — framed as information, never a medical verdict.',
  },
  {
    eyebrow: 'What to do',
    title: 'A day-by-day plan',
    text: 'Start Day 1 immediately. Sign in to unlock the full recovery roadmap and keep it.',
  },
];

const STEPS = [
  {
    title: 'Share a little context',
    text: 'Name, location, age band, and work setting — used only to personalise questions and tips.',
  },
  {
    title: 'Personality interview',
    text: 'A focused set of questions builds a stable profile of how you think, relate, and recover.',
  },
  {
    title: 'Burnout check-in & plan',
    text: 'Map your current load, then get a sequenced recovery protocol — not four generic tips.',
  },
];

const LANDING_FAQS = [
  {
    question: 'Is this a medical diagnosis?',
    answer:
      'No. Recharge is a self-reflection tool. Results and recommendations are informational, not diagnosis or treatment.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No account is required to take the assessment and see Day 1. Sign in with a magic link to unlock the full multi-day plan, save history, and talk to Oma.',
  },
  {
    question: 'How long does it take?',
    answer: 'Most people finish both interviews in under 10 minutes.',
  },
];

export default function Hero({ onStart }) {
  const { content } = useTenant();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="mx-auto grid max-w-landing gap-8 px-margin-mobile pb-10 pt-2 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-12 lg:pb-16 lg:pt-6">
          <div className="text-center lg:text-left">
            <span className="hero-badge">
              <ArcIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{content.badge}</span>
              <span className="sm:hidden">{content.badgeMobile}</span>
            </span>

            <h1 className="mx-auto mt-8 max-w-3xl font-display text-headline-lg-mobile font-light text-ink sm:text-display-lg lg:mx-0">
              <span className="lg:hidden">{content.headline}</span>
              <span className="hidden lg:inline">
                {content.headlineDesktop?.includes('?') ? (
                  <>
                    {content.headlineDesktop.split('?')[0]}?
                    {content.headlineDesktop.split('?')[1] ? (
                      <>
                        <br />
                        <em className="not-italic text-canopy-600">
                          {content.headlineDesktop.split('?').slice(1).join('?').trim()}
                        </em>
                      </>
                    ) : null}
                  </>
                ) : (
                  content.headlineDesktop
                )}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl font-sans text-[17px] leading-relaxed text-ink-soft lg:mx-0 lg:text-[19px] lg:leading-[1.65]">
              <span className="lg:hidden">{content.supporting}</span>
              <span className="hidden lg:inline">{content.supportingDesktop}</span>
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 lg:items-start">
              <Button size="lg" onClick={onStart} className="w-full max-w-[240px] sm:w-auto">
                {content.cta}
              </Button>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                Free · About 10 minutes · No account required to start
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
              {FEATURES.map((card) => (
                <div key={card.title} className="demo-card p-4 text-left">
                  <p className="card-eyebrow relative z-[1]">{card.eyebrow}</p>
                  <p className="relative z-[1] font-display text-[1.05rem] font-normal text-ink">
                    {card.title}
                  </p>
                  <p className="relative z-[1] mt-1 font-sans text-[13px] leading-relaxed text-ink-soft">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative editorial-frame">
            <EditorialArtwork variant="hero" className="aspect-[4/4.2] lg:aspect-[4/4.5]" />
            <div className="glass-panel absolute bottom-4 left-4 right-4 p-5 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-xs">
              <p className="card-eyebrow">Private and personal</p>
              <p className="font-display text-[1.25rem] font-normal leading-snug text-ink">
                Understand your capacity. Leave with a plan you can actually follow.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-landing px-margin-mobile sm:px-8 lg:px-12">
          <ArcDivider />
        </div>

        <section className="mx-auto mt-10 max-w-landing px-margin-mobile sm:px-8 lg:mt-14 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="relative overflow-hidden rounded-md">
              <EditorialArtwork variant="reflection" className="aspect-[4/3] lg:aspect-[5/4]" />
              <div className="glass-panel absolute bottom-5 left-5 right-5 max-w-sm p-5 lg:bottom-8 lg:left-8 lg:max-w-md">
                <h2 className="font-display text-headline-md font-normal text-ink">
                  Built for people who already feel tired
                </h2>
                <p className="mt-2 font-sans text-[14px] leading-relaxed text-ink-soft">
                  Warm language, unhurried screens, and a plan that starts with one concrete day —
                  not a pile of wellness advice.
                </p>
              </div>
            </div>

            <div className="demo-card">
              <p className="card-eyebrow relative z-[1]">What you leave with</p>
              <h3 className="relative z-[1] font-display text-headline-md font-normal text-ink">
                Portrait, score, and protocol
              </h3>
              <p className="relative z-[1] mt-3 font-sans text-[14px] leading-relaxed text-ink-soft">
                Your results combine personality patterns with burnout load, then turn them into a
                sequenced recovery roadmap. Severe ranges still get clear language — and a reminder
                this is reflection, not diagnosis.
              </p>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="mx-auto mt-16 max-w-landing px-margin-mobile pb-12 sm:px-8 lg:mt-24 lg:px-12 lg:pb-16"
        >
          <h2 className="mb-10 text-center font-display text-headline-md font-normal text-ink">
            How Recharge works
          </h2>

          <div className="mx-auto max-w-2xl space-y-10">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canopy-600 font-mono text-[12px] font-medium text-white">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 ? (
                    <span className="mt-3 h-12 w-px bg-linen-sunken" aria-hidden="true" />
                  ) : null}
                </div>
                <div className="pb-2 pt-1">
                  <h3 className="font-display text-[1.25rem] font-normal text-ink">{step.title}</h3>
                  <p className="mt-2 font-sans text-body-md leading-relaxed text-ink-soft">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto max-w-landing px-margin-mobile pb-16 sm:px-8 lg:px-12 lg:pb-20"
        >
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-headline-md font-normal text-ink">
              Common questions
            </h2>
            <div className="mt-8 space-y-4">
              {LANDING_FAQS.map((item) => (
                <article key={item.question} className="surface-card p-5 sm:p-6">
                  <h3 className="font-display text-[1.15rem] font-normal text-ink">{item.question}</h3>
                  <p className="mt-2 font-sans text-body-md leading-relaxed text-ink-soft">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-center font-sans text-body-md text-ink-soft">
              More detail on{' '}
              <a href="/faq" className="font-medium text-canopy-600 underline underline-offset-2">
                the FAQ
              </a>
              , including how Oma works.
            </p>
          </div>
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-white/50 bg-white/80 p-5 backdrop-blur-md lg:hidden">
        <Button size="lg" className="w-full" onClick={onStart}>
          {content.cta}
          <span aria-hidden="true">→</span>
        </Button>
      </div>

      <Footer />
    </div>
  );
}
