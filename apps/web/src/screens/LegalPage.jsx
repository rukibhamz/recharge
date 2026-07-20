import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';

const PAGES = {
  privacy: {
    title: 'Privacy Policy',
    body: [
      'Recharge collects only what you provide during the assessment: your name, profile details (country, city, age band, work context), and your answers.',
      'Results are stored securely in our database. If you sign in with a magic link, we associate saved results with your email via Supabase Auth.',
      'We do not sell your personal data. LLM providers receive prompts that describe burnout level and personality patterns — not your email or full identity.',
      'You may request a JSON export or delete your account from Account settings.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    body: [
      'Recharge provides wellbeing information and personalised suggestions — not medical diagnosis or treatment.',
      'Results are for self-reflection only. If you are in crisis, contact a qualified professional or emergency services.',
      'You may use the service for personal, non-commercial purposes unless we agree otherwise in writing.',
      'We may update these terms; continued use after changes constitutes acceptance.',
    ],
  },
  security: {
    title: 'Data Security',
    body: [
      'API keys and database credentials are server-side only. The browser uses the Supabase anon key with row-level security policies.',
      'Sessions are saved with a random share token; share links expose only summary results, not your full profile.',
      'Magic links expire per Supabase Auth settings. Sign out on shared devices after use.',
      'Transport is encrypted via HTTPS in production.',
    ],
  },
};

export default function LegalPage({ kind = 'privacy' }) {
  const page = PAGES[kind] ?? PAGES.privacy;

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="account" />
      <article className="mx-auto w-full max-w-container flex-1 px-margin-mobile py-12 sm:px-gutter">
        <h1 className="font-display text-headline-lg text-primary">{page.title}</h1>
        <div className="mt-8 space-y-4">
          {page.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="font-sans text-body-md text-on-surface-variant">
              {paragraph}
            </p>
          ))}
        </div>
        <Button className="mt-10" variant="secondary" onClick={() => { window.history.back(); }}>
          Back
        </Button>
      </article>
      <Footer compact />
    </div>
  );
}
