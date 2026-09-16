import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';

const CONTACT_EMAIL = 'recharge@thedigitalerrand.com';

const PAGES = {
  privacy: {
    title: 'Privacy Policy',
    updated: '15 September 2026',
    body: [
      'Recharge (“we”, “us”) provides a burnout and personality self-reflection assessment, personalised recovery guidance, and an optional AI wellbeing companion (Oma).',
      'What we collect. When you use Recharge you may provide: a display name; profile details (country, city, age band, work context); recovery preferences; assessment answers; and, if you sign in, an email address via magic-link authentication.',
      'What we store. Assessment sessions, scores, recovery roadmaps, and (when you use them) coach conversations are stored so you can revisit history when signed in. Share links expose a summary result only, not your full profile.',
      'How we use AI. Language models help generate or polish questions, narratives, and recovery-plan wording. Prompts describe burnout patterns and personality context. We do not require your email or full identity in those prompts. AI providers process that content under their own terms.',
      'We do not sell your personal data. We use trusted processors (hosting, database, authentication, AI) solely to run the service.',
      'Your choices. From Account settings you can export a JSON copy of your data or delete your account. Deletion removes linked sessions and coach history we control. Cached or backup copies may take a short time to clear.',
      'Cookies and local storage. The app may store session progress and preferences in your browser so an unfinished assessment can resume. Clear site data on the device to remove them.',
      `Contact. Privacy questions: ${CONTACT_EMAIL}.`,
      'This policy may be updated as the product evolves. Material changes will be reflected on this page with a new “Last updated” date.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: '15 September 2026',
    body: [
      'By using Recharge you agree to these terms. If you do not agree, do not use the service.',
      'What Recharge is. Recharge provides wellbeing information, self-reflection tools, and personalised suggestions. It is not a medical device, and it does not provide medical diagnosis, therapy, counselling, or emergency services.',
      'Not a substitute for care. Results, roadmaps, and conversations with Oma (our AI companion) are for personal reflection only. If you are in crisis, or believe you may harm yourself or others, contact local emergency services or a qualified professional immediately.',
      'Accounts. Signing in with a magic link is optional for starting an assessment, and required to unlock the full multi-day plan, save history, and use Oma. You are responsible for access to the email inbox you use to sign in.',
      'Acceptable use. Do not misuse the service, attempt to disrupt it, scrape it at scale, or use it to harm others. We may suspend access that threatens the service or other users.',
      'Intellectual property. The Recharge name, design, and software remain ours or our licensors’. You retain rights to the answers you submit.',
      'Availability. We aim for reliable uptime but do not guarantee uninterrupted access. Features may change as we improve the product.',
      'Limitation. To the fullest extent permitted by law, Recharge is provided “as is” without warranties of fitness for a particular purpose. We are not liable for decisions you make based on informational guidance from the service.',
      `Contact. Questions about these terms: ${CONTACT_EMAIL}.`,
      'We may update these terms. Continued use after changes are posted constitutes acceptance.',
    ],
  },
  security: {
    title: 'Data Security',
    updated: '15 September 2026',
    body: [
      'Transport. Production traffic is served over HTTPS.',
      'Access control. Database credentials and AI API keys stay on the server. The browser uses a limited public key with row-level security policies for authenticated access.',
      'Sessions and sharing. Each saved assessment can include a random share token. Public share links show summary results only and are time-limited.',
      'Authentication. Magic links are issued by our auth provider and expire according to that provider’s settings. Sign out on shared devices after use.',
      'Coach chats. Conversations with Oma are tied to your signed-in account. Treat them as private reflection, not professional care.',
      `Report a concern. If you believe you have found a security issue, email ${CONTACT_EMAIL} with details (no public disclosure of exploits, please).`,
    ],
  },
};

export default function LegalPage({ kind = 'privacy' }) {
  const page = PAGES[kind] ?? PAGES.privacy;

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="account" />
      <article className="mx-auto w-full max-w-container flex-1 px-margin-mobile py-12 sm:px-gutter">
        <h1 className="font-display text-headline-lg text-primary">{page.title}</h1>
        {page.updated ? (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
            Last updated · {page.updated}
          </p>
        ) : null}
        <div className="mt-8 space-y-4">
          {page.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="font-sans text-body-md text-on-surface-variant">
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
