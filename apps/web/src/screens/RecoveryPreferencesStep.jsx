import { useState } from 'react';
import {
  RECOVERY_ACTIVITY_OPTIONS,
  RECOVERY_SETTING_OPTIONS,
  RECOVERY_SOCIAL_OPTIONS,
  isValidRecoveryPreferences,
  sanitizeRecoveryPreferences,
} from '@recharge/shared/recoveryPreferences';
import AssessmentFlowBar from '../components/assessment/AssessmentFlowBar.jsx';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import SplitEditorialLayout from '../components/shared/SplitEditorialLayout.jsx';
import OptionButton from '../components/assessment/OptionButton.jsx';

function PreferenceGroup({ label, value, options, onChange }) {
  return (
    <fieldset className="space-y-2">
      <legend className="field-label">{label}</legend>
      {options.map((option) => (
        <OptionButton
          key={option.id}
          label={option.label}
          selected={value === option.id}
          onClick={() => onChange(option.id)}
        />
      ))}
    </fieldset>
  );
}

export default function RecoveryPreferencesStep({
  phase,
  initialPreferences = {},
  onBack,
  onClose,
  onContinue,
}) {
  const [social, setSocial] = useState(initialPreferences.social ?? '');
  const [activity, setActivity] = useState(initialPreferences.activity ?? '');
  const [setting, setSetting] = useState(initialPreferences.setting ?? '');
  const [touched, setTouched] = useState(false);

  const preferences = sanitizeRecoveryPreferences({ social, activity, setting });
  const valid = isValidRecoveryPreferences(preferences);

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!valid) return;
    onContinue(preferences);
  };

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="assessment-mobile" onBack={onBack} onClose={onClose} />

      <div className="mx-auto flex w-full max-w-landing flex-1 flex-col justify-center px-margin-mobile pb-12 pt-6 sm:px-gutter lg:px-8">
        {phase ? <AssessmentFlowBar phase={phase} className="mb-8" /> : null}
        <SplitEditorialLayout
          artworkVariant="recovery"
          asideBadge="Recovery style"
          asideTitle="How do you best unwind?"
          asideText="Tell us what actually helps you recharge so your recommendations feel practical and personal."
        >
          <div className="surface-card p-6 lg:p-12">
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.08em] text-fern">
              Recovery preferences
            </p>
            <h1 className="mt-4 text-center font-display text-headline-lg-mobile font-light text-ink lg:text-headline-lg">
              Let&apos;s tailor how you recover
            </h1>
            <p className="mt-3 text-center font-sans text-body-md text-ink-soft">
              Almost done — tell us what helps you recharge so your recovery plan feels personal.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6 lg:mt-10">
              <PreferenceGroup
                label="When you need to recharge, you usually prefer:"
                value={social}
                options={RECOVERY_SOCIAL_OPTIONS}
                onChange={setSocial}
              />

              <PreferenceGroup
                label="The activity that restores you fastest is:"
                value={activity}
                options={RECOVERY_ACTIVITY_OPTIONS}
                onChange={setActivity}
              />

              <PreferenceGroup
                label="The setting that feels best for recovery is:"
                value={setting}
                options={RECOVERY_SETTING_OPTIONS}
                onChange={setSetting}
              />

              {touched && !valid ? (
                <p className="text-center font-sans text-body-md text-signal-red" role="alert">
                  Please choose one option in each section to continue.
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={!valid}>
                Build my recovery plan
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center font-sans text-[13px] text-ink-faint lg:text-left">
            These preferences are used to shape your final recommendations.
          </p>
        </SplitEditorialLayout>
      </div>

      <Footer compact />
    </div>
  );
}
