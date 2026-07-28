import { useState } from 'react';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import AssessmentFlowBar from '../components/assessment/AssessmentFlowBar.jsx';
import { isValidName, sanitizeName } from '@recharge/shared/name';
import SplitEditorialLayout from '../components/shared/SplitEditorialLayout.jsx';

export default function NameStep({ phase, initialName = '', onBack, onClose, onContinue }) {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);
  const valid = isValidName(name);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onContinue(sanitizeName(name));
  };

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="assessment-mobile" onBack={onBack} onClose={onClose} />

      <div className="mx-auto flex w-full max-w-landing flex-1 flex-col justify-center px-margin-mobile pb-12 pt-6 sm:px-gutter lg:px-8">
        {phase ? <AssessmentFlowBar phase={phase} className="mb-8" /> : null}
        <SplitEditorialLayout
          artworkVariant="hero"
          asideBadge="Step 1"
          asideTitle="A name makes it personal"
          asideText="We use your first name to shape the tone of your interviews — warm, direct, and specific to you."
        >
        <div className="surface-card p-6 lg:p-12">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.08em] text-fern">
            Step 1 of 5
          </p>
          <h1 className="mt-4 text-center font-display text-headline-lg-mobile font-light text-ink lg:text-headline-lg">
            What is your name?
          </h1>
          <p className="mt-3 text-center font-sans text-body-md text-ink-soft">
            We&apos;ll use this to personalise your personality and burnout interviews.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 lg:mt-10">
            <label htmlFor="user-name" className="sr-only">
              Your name
            </label>
            <input
              id="user-name"
              type="text"
              autoComplete="given-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="e.g. Alex"
              className="field text-center text-body-lg"
            />
            {touched && !valid && (
              <p className="mt-2 text-center font-sans text-body-md text-signal-red" role="alert">
                Please enter your name to continue.
              </p>
            )}
            <Button type="submit" className="mt-6 w-full" disabled={!valid}>
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-sans text-[13px] text-ink-faint lg:text-left">
          Your name stays private and is never shared on public share links.
        </p>
        </SplitEditorialLayout>
      </div>

      <Footer compact />
    </div>
  );
}
