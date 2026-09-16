import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';
import { ArcDivider } from '../components/shared/Arc.jsx';

const STEPS = [
  {
    title: 'Share your context',
    text: 'Name, location, age, and work details help tailor the interview to your reality.',
  },
  {
    title: 'Personality interview',
    text: 'A focused set of questions builds a consistent profile of how you think and recover.',
  },
  {
    title: 'Burnout and recovery',
    text: 'A second phase maps your current energy state, then generates practical recovery actions.',
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="landing" />

      <main className="mx-auto w-full max-w-landing flex-1 px-margin-mobile py-10 sm:px-8 lg:px-12">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="hero-badge">About Recharge</p>
            <h1 className="mt-5 font-display text-headline-lg text-ink">A calmer way to understand burnout.</h1>
            <p className="mt-4 max-w-2xl font-sans text-body-md leading-relaxed text-ink-soft">
              Recharge combines a personality profile with a burnout check-in to produce a day-by-day
              recovery protocol. About 10 minutes. Designed for reflection, not diagnosis.
            </p>
          </div>
          <div className="editorial-frame">
            <EditorialArtwork variant="hero" className="aspect-[4/3]" />
          </div>
        </section>

        <div className="mt-10">
          <ArcDivider />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-headline-md text-ink">How it works</h2>
          <div className="mt-8 space-y-8">
            {STEPS.map((step, index) => (
              <article key={step.title} className="flex gap-5">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canopy-600 font-mono text-[12px] text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-[1.2rem] text-ink">{step.title}</h3>
                  <p className="mt-2 font-sans text-body-md leading-relaxed text-ink-soft">{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
