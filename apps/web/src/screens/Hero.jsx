import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';

const DESKTOP_FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
    title: 'AI-built interviews',
    tint: 'bg-badge-sky text-primary',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
    title: 'Two smart phases',
    tint: 'bg-secondary-container text-primary',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l1.4 4.2L17.5 9l-4.1 1.4L12 14.5 10.6 10.4 6.5 9l4.1-1.4L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    title: 'Tailored recovery plan',
    tint: 'bg-tertiary-fixed/70 text-tertiary-container',
  },
];

const MOBILE_STATS = [
  {
    stat: '74%',
    text: 'of professionals experience burnout without early detection.',
    tint: 'bg-badge-sky text-primary',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 18l4-8 4 4 4-10 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    stat: '5 min',
    text: 'is all it takes to gain AI-driven clinical grade insights.',
    tint: 'bg-secondary-container text-primary',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    stat: '10k+',
    text: 'users found their sanctuary with Recharge this year.',
    tint: 'bg-tertiary-fixed/80 text-tertiary-container',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17 20a4 4 0 00-8 0M12 14a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    title: 'Share your context',
    text: 'Name, location, age, and work — the AI uses this to write interviews that fit your life.',
  },
  {
    title: 'Personality interview',
    text: 'Answer 10–15 AI-generated questions. The AI reads your responses and builds your personality profile.',
  },
  {
    title: 'Burnout check-in',
    text: 'A second AI interview shaped by your personality — then a personalised recovery plan.',
  },
];

const MOBILE_STEPS = [
  {
    title: 'Your context',
    text: 'Tell us where you are and what you do — the AI builds custom interviews from this.',
  },
  {
    title: 'Personality read',
    text: 'Complete your AI personality interview, then see what the AI learned about you.',
  },
  {
    title: 'Burnout & recovery',
    text: 'A tailored burnout check-in leads to recommendations matched to your type and location.',
  },
];

export default function Hero({ onStart }) {
  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-landing px-margin-mobile pb-10 pt-2 text-center sm:px-8 lg:px-12 lg:pb-16 lg:pt-4">
          <span className="hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l1.2 3.6L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">Science-informed warmth</span>
            <span className="sm:hidden">A science-informed sanctuary</span>
          </span>

          <h1 className="mx-auto mt-8 max-w-3xl font-display text-headline-lg-mobile text-primary sm:text-display-lg">
            <span className="lg:hidden">Are you truly okay?</span>
            <span className="hidden lg:inline">Are you truly okay, or just managing?</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl font-sans text-body-md text-on-surface-variant lg:text-body-lg">
            <span className="lg:hidden">
              Quiet your mind, look inward, and discover the path back to your most resilient self.
            </span>
            <span className="hidden lg:inline">
              Two AI-built interviews — personality first, then burnout shaped by who you are.
              Personalised recommendations at the end. No account required.
            </span>
          </p>

          <div className="mt-10 hidden justify-center lg:flex">
            <Button size="lg" onClick={onStart} className="min-w-[220px]">
              Begin Assessment
            </Button>
          </div>
        </section>

        {/* Desktop feature cards */}
        <section className="mx-auto hidden max-w-4xl grid-cols-3 gap-6 px-8 lg:grid lg:px-12">
          {DESKTOP_FEATURES.map((card) => (
            <div key={card.title} className="surface-card flex flex-col items-center px-6 py-10">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.tint}`}
              >
                {card.icon}
              </div>
              <p className="mt-5 font-display text-body-lg font-medium text-primary">{card.title}</p>
            </div>
          ))}
        </section>

        {/* Mobile stat cards */}
        <section className="mx-auto max-w-container space-y-4 px-margin-mobile sm:px-gutter lg:hidden">
          {MOBILE_STATS.map((item) => (
            <div key={item.stat} className="surface-card flex items-center gap-4 p-5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.tint}`}
              >
                {item.icon}
              </div>
              <p className="text-left font-sans text-body-md leading-relaxed text-on-surface-variant">
                <strong className="text-primary">{item.stat}</strong> {item.text}
              </p>
            </div>
          ))}
        </section>

        {/* Sanctuary visual */}
        <section className="mx-auto mt-12 max-w-landing px-margin-mobile sm:px-8 lg:mt-20 lg:px-12">
          <div className="relative overflow-hidden rounded-xl lg:rounded-xl">
            <div
              className="sanctuary-gradient aspect-[4/3] lg:aspect-[21/9]"
              role="img"
              aria-label="Abstract calming landscape"
            />
            <div className="glass-panel absolute bottom-5 left-5 right-5 max-w-sm p-6 lg:bottom-8 lg:left-8 lg:right-auto lg:max-w-md">
              <h2 className="font-display text-headline-md text-primary">Designed for your Sanctuary</h2>
              <p className="mt-2 font-sans text-body-md leading-relaxed text-on-surface-variant">
                Our interface is a gentle companion, built to reduce cognitive load and provide space
                for self-discovery.
              </p>
            </div>
          </div>

          <div className="mt-8 lg:hidden">
            <h2 className="font-display text-headline-md text-primary">Designed for your Sanctuary</h2>
            <p className="mt-3 font-sans text-body-md leading-relaxed text-on-surface-variant">
              Our interface is more than just a tool; it&apos;s a digital breathing space crafted with
              soft minimalism and science-informed empathy.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section
          id="about"
          className="mx-auto mt-16 max-w-landing px-margin-mobile pb-12 sm:px-8 lg:mt-24 lg:px-12 lg:pb-16"
        >
          <h2 className="mb-10 text-center font-display text-headline-md text-primary lg:hidden">
            Your path to recovery
          </h2>

          <div className="mx-auto max-w-2xl space-y-10 lg:hidden">
            {MOBILE_STEPS.map((step, i) => (
              <StepItem key={step.title} step={step} index={i} isLast={i === MOBILE_STEPS.length - 1} />
            ))}
          </div>
          <div className="mx-auto hidden max-w-3xl space-y-12 lg:block">
            {STEPS.map((step, i) => (
              <StepItem key={step.title} step={step} index={i} isLast={i === STEPS.length - 1} />
            ))}
          </div>
        </section>

        <section id="faq" className="sr-only">
          FAQ placeholder
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-outline-variant/40 bg-warm/95 p-5 backdrop-blur-glass lg:hidden">
        <Button size="lg" className="w-full" onClick={onStart}>
          Begin Assessment
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>

      <Footer />
    </div>
  );
}

function StepItem({ step, index, isLast }) {
  return (
    <div className="flex gap-5 lg:gap-6">
      <div className="flex flex-col items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-sans text-label-sm text-on-primary lg:h-11 lg:w-11">
          {index + 1}
        </span>
        {!isLast && (
          <span className="mt-3 hidden h-16 w-px bg-outline-variant/60 lg:block" aria-hidden="true" />
        )}
      </div>
      <div className="pb-2 pt-1">
        <h3 className="font-display text-headline-md text-primary lg:text-[1.35rem]">{step.title}</h3>
        <p className="mt-2 font-sans text-body-md leading-relaxed text-on-surface-variant">
          {step.text}
        </p>
      </div>
    </div>
  );
}
