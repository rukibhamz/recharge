import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import { COACH_NAME } from '@recharge/shared/coachPersona';

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

const OMA_FAQS = [
  {
    question: `Who is ${COACH_NAME}?`,
    answer: `${COACH_NAME} is your private wellbeing buddy inside Recharge. After you save an assessment to your account, you can talk to ${COACH_NAME} about stress, energy, boundaries, and recovery. She uses your check-in results to keep the conversation personal.`,
  },
  {
    question: `Is ${COACH_NAME} a therapist?`,
    answer: `No. ${COACH_NAME} is an AI wellbeing companion, not a licensed therapist, doctor, or crisis service. Conversations are for reflection and practical support, not diagnosis or treatment. If you are in crisis, contact emergency services or a qualified professional.`,
  },
  {
    question: `How do I talk to ${COACH_NAME}?`,
    answer: `Sign in, open your Account page, and use the Talk to ${COACH_NAME} button at the bottom right. You can start a new chat or continue a previous one. ${COACH_NAME} works best when you have at least one saved assessment.`,
  },
  {
    question: `What does ${COACH_NAME} know about me?`,
    answer: `${COACH_NAME} can use your saved assessment context: personality patterns, burnout level, recovery preferences, and your roadmap tips. She listens and asks questions before offering advice, so you can talk things through at your own pace.`,
  },
  {
    question: `Are chats with ${COACH_NAME} private?`,
    answer: `Your coach conversations are tied to your signed-in account and stored so you can continue earlier threads. You can export or delete your account data from account settings. Treat chats as private reflection, not a substitute for professional care.`,
  },
];

function FaqList({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.question} className="surface-card p-5 sm:p-6">
          <h3 className="font-display text-headline-md text-on-surface">{item.question}</h3>
          <p className="mt-3 font-sans text-body-md leading-relaxed text-on-surface-variant">
            {item.answer}
          </p>
        </article>
      ))}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="landing" />

      <main className="mx-auto w-full max-w-landing flex-1 px-margin-mobile py-10 sm:px-8 lg:px-12">
        <h1 className="font-display text-headline-lg text-primary">Frequently Asked Questions</h1>
        <p className="mt-4 max-w-2xl font-sans text-body-md text-on-surface-variant">
          Everything you need to know before taking or sharing an assessment, and how to talk to{' '}
          {COACH_NAME}.
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="font-display text-headline-md text-primary">Assessment &amp; account</h2>
          <FaqList items={FAQS} />
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-headline-md text-primary">Talking to {COACH_NAME}</h2>
          <p className="max-w-2xl font-sans text-body-md text-on-surface-variant">
            {COACH_NAME} is your in-app wellbeing buddy: a calm place to unpack how you feel after a
            check-in, without replacing professional care.
          </p>
          <FaqList items={OMA_FAQS} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
