import { useEffect, useState } from 'react';
import {
  AGE_BANDS,
  COUNTRIES,
  WORK_CONTEXTS,
  WORK_SECTORS,
  guessCountryFromLocale,
  isValidDemographics,
  sanitizeDemographics,
} from '@recharge/shared/demographics';
import AssessmentFlowBar from '../components/assessment/AssessmentFlowBar.jsx';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';

const fieldClass =
  'w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3.5 font-sans text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function ProfileStep({ phase, initialProfile = {}, onBack, onClose, onContinue }) {
  const [country, setCountry] = useState(initialProfile.country ?? '');
  const [city, setCity] = useState(initialProfile.city ?? '');
  const [ageBand, setAgeBand] = useState(initialProfile.ageBand ?? '');
  const [workContext, setWorkContext] = useState(initialProfile.workContext ?? '');
  const [workSector, setWorkSector] = useState(initialProfile.workSector ?? '');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!country && typeof navigator !== 'undefined') {
      const guessed = guessCountryFromLocale(navigator.language);
      if (guessed) setCountry(guessed);
    }
  }, [country]);

  const profile = sanitizeDemographics({ country, city, ageBand, workContext, workSector });
  const valid = isValidDemographics(profile);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onContinue(profile);
  };

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="assessment-mobile" onBack={onBack} onClose={onClose} />

      <div className="mx-auto flex w-full max-w-container flex-1 flex-col justify-center px-margin-mobile pb-12 pt-6 sm:px-gutter lg:max-w-assess lg:px-8">
        {phase ? <AssessmentFlowBar phase={phase} className="mb-8" /> : null}
        <div className="surface-card rounded-xl p-6 lg:p-12">
          <p className="text-center font-sans text-label-sm uppercase tracking-[0.14em] text-primary">
            About you
          </p>
          <h1 className="mt-4 text-center font-display text-headline-lg-mobile text-on-surface lg:text-headline-lg">
            Help the AI understand your context
          </h1>
          <p className="mt-3 text-center font-sans text-body-md text-on-surface-variant">
            Location, age, and work shape your custom interviews and final recommendations.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 lg:mt-10">
            <div>
              <label htmlFor="country" className="mb-1.5 block font-sans text-body-md text-on-surface">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={fieldClass}
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className="mb-1.5 block font-sans text-body-md text-on-surface">
                City <span className="text-on-surface-variant">(recommended)</span>
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Abuja, London, Toronto"
                className={fieldClass}
                autoComplete="address-level2"
              />
              <p className="mt-1.5 font-sans text-[13px] text-on-surface-variant/80">
                Helps tailor examples to your area — we only use the city you enter here.
              </p>
            </div>

            <div>
              <label htmlFor="age-band" className="mb-1.5 block font-sans text-body-md text-on-surface">
                Age band
              </label>
              <select
                id="age-band"
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value)}
                className={fieldClass}
                required
              >
                <option value="">Select age range</option>
                {AGE_BANDS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="work-context"
                className="mb-1.5 block font-sans text-body-md text-on-surface"
              >
                Current work situation
              </label>
              <select
                id="work-context"
                value={workContext}
                onChange={(e) => setWorkContext(e.target.value)}
                className={fieldClass}
                required
              >
                <option value="">Select situation</option>
                {WORK_CONTEXTS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="work-sector"
                className="mb-1.5 block font-sans text-body-md text-on-surface"
              >
                Industry / sector <span className="text-on-surface-variant">(optional)</span>
              </label>
              <select
                id="work-sector"
                value={workSector}
                onChange={(e) => setWorkSector(e.target.value)}
                className={fieldClass}
              >
                <option value="">Prefer not to say</option>
                {WORK_SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {touched && !valid && (
              <p className="text-center font-sans text-body-md text-error" role="alert">
                Please complete country, age, and work situation to continue.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={!valid}>
              Build my interview
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-sans text-[13px] text-on-surface-variant/70">
          Demographics are used only to personalize questions and tips. They are never shown on
          public share links.
        </p>
      </div>

      <Footer compact />
    </div>
  );
}
