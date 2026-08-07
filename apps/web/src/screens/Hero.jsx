import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';
import ArcIcon, { ArcDivider } from '../components/shared/Arc.jsx';
import { useTenant } from '../context/TenantContext.jsx';

const FEATURES = [
  {
    title: 'Tailored interviews',
    text: 'Questions shaped around your context — not a generic form.',
  },
  {
    title: 'Two calm phases',
    text: 'Personality first, then a burnout check-in calibrated to you.',
  },
  {
    title: 'Recovery plan',
    text: 'Clear next steps framed as information, never a verdict.',
  },
];

const STEPS = [
  {
    title: 'Share your context',
    text: 'Name, location, age, and work — used only to personalize questions and tips.',
  },
  {
    title: 'Personality interview',
    text: 'Answer tailored questions. We build a consistent profile from your responses.',
  },
  {
    title: 'Burnout & recovery',
    text: 'A second interview shaped by your personality, then a personalised recovery plan.',
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

            <div className="mt-10 flex justify-center lg:justify-start">
              <Button size="lg" onClick={onStart} className="min-w-[220px]">
                {content.cta}
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
              {FEATURES.map((card) => (
                <div key={card.title} className="demo-card p-4 text-left">
                  <p className="card-eyebrow relative z-[1]">Step</p>
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
                A calmer way to understand your capacity.
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
                  Designed as a calm room
                </h2>
                <p className="mt-2 font-sans text-[14px] leading-relaxed text-ink-soft">
                  Warm linen surfaces, unhurried motion, and plain language — built for someone who
                  may already feel tired.
                </p>
              </div>
            </div>

            <div className="demo-card">
              <p className="card-eyebrow relative z-[1]">Foundation</p>
              <h3 className="relative z-[1] font-display text-headline-md font-normal text-ink">
                Plain, never clinical
              </h3>
              <p className="relative z-[1] mt-3 font-sans text-[14px] leading-relaxed text-ink-soft">
                Results are framed as information, not verdicts — even at the most severe burnout
                level. Green carries the brand; amber and red stay reserved for severity only.
              </p>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="mx-auto mt-16 max-w-landing px-margin-mobile pb-12 sm:px-8 lg:mt-24 lg:px-12 lg:pb-16"
        >
          <h2 className="mb-10 text-center font-display text-headline-md font-normal text-ink">
            Your path to recovery
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

        <section id="faq" className="sr-only">
          FAQ placeholder
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
