import { useState } from 'react';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import AssessmentFlowBar from '../components/assessment/AssessmentFlowBar.jsx';
import { isValidName, sanitizeName } from '@recharge/shared/name';

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

      <div className="mx-auto flex w-full max-w-container flex-1 flex-col justify-center px-margin-mobile pb-12 pt-6 sm:px-gutter lg:max-w-assess lg:px-8">
        {phase ? <AssessmentFlowBar phase={phase} className="mb-8" /> : null}
        <div className="surface-card rounded-xl p-6 lg:p-12">
          <p className="text-center font-sans text-label-sm uppercase tracking-[0.14em] text-primary">
            Step 1 of 5
          </p>
          <h1 className="mt-4 text-center font-display text-headline-lg-mobile text-on-surface lg:text-headline-lg">
            What is your name?
          </h1>
          <p className="mt-3 text-center font-sans text-body-md text-on-surface-variant">
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
              className="w-full rounded-xl border border-outline-variant/50 bg-white px-5 py-4 text-center font-sans text-body-lg text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {touched && !valid && (
              <p className="mt-2 text-center font-sans text-body-md text-error" role="alert">
                Please enter your name to continue.
              </p>
            )}
            <Button type="submit" className="mt-6 w-full" disabled={!valid}>
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-sans text-[13px] text-on-surface-variant/70">
          Your name stays private and is never shared on public links.
        </p>
      </div>

      <Footer compact />
    </div>
  );
}
