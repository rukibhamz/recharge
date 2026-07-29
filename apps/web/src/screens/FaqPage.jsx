import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';

const FAQS = [
  {
    question: 'Is Recharge a medical diagnosis?',
    answer:
      'No. Recharge is a self-reflection tool that offers informational guidance, not medical diagnosis or treatment.',
  },
  {
    question: 'How long does the assessment take?',
    answer:
      'Most people complete it in under 10 minutes across two phases: personality and burnout check-in.',
  },
  {
    question: 'Can I share my result with someone else?',
    answer:
      'Yes. You can share a public link from your result screen. Shared links are valid for 24 hours.',
  },
  {
    question: 'Do you store my data?',
    answer:
      'We store assessment results securely so you can revisit your history when signed in. You can export or delete your data from account settings.',
  },
  {
    question: 'Do AI providers see my identity?',
    answer:
      'Recommendations are generated from burnout/personality context. Identity details are not required in recommendation prompts.',
  },
];

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="landing" />

      <main className="mx-auto w-full max-w-landing flex-1 px-margin-mobile py-10 sm:px-8 lg:px-12">
        <h1 className="font-display text-headline-lg text-primary">Frequently Asked Questions</h1>
        <p className="mt-4 max-w-2xl font-sans text-body-md text-on-surface-variant">
          Everything you need to know before taking or sharing an assessment.
        </p>

        <section className="mt-8 space-y-4">
          {FAQS.map((item) => (
            <article key={item.question} className="surface-card p-5 sm:p-6">
              <h2 className="font-display text-headline-md text-on-surface">{item.question}</h2>
              <p className="mt-3 font-sans text-body-md leading-relaxed text-on-surface-variant">
                {item.answer}
              </p>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
