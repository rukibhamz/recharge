import { useEffect, useState } from 'react';
import {
  fetchAdminSmtpSettings,
  updateAdminSmtpSettings,
  testAdminSmtpSettings,
} from '../../services/api.js';
import Button from '../shared/Button.jsx';

const emptyForm = () => ({
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'Recharge',
  fromEmail: 'recharge@thedigitalerrand.com',
});

export default function SmtpSettingsPanel({ getAccessToken }) {
  const [form, setForm] = useState(emptyForm);
  const [hasPassword, setHasPassword] = useState(false);
  const [source, setSource] = useState('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getAccessToken();
        const data = await fetchAdminSmtpSettings(token);
        if (!mounted) return;
        const s = data.settings || {};
        setForm({
          host: s.host || '',
          port: s.port || 587,
          secure: Boolean(s.secure),
          user: s.user || '',
          pass: '',
          fromName: s.fromName || 'Recharge',
          fromEmail: s.fromEmail || 'recharge@thedigitalerrand.com',
        });
        setHasPassword(Boolean(s.hasPassword));
        setSource(s.source || 'none');
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getAccessToken]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getAccessToken();
      const payload = { ...form };
      if (!payload.pass.trim()) delete payload.pass;
      const data = await updateAdminSmtpSettings(token, payload);
      const s = data.settings || {};
      setHasPassword(Boolean(s.hasPassword));
      setSource(s.source || 'app');
      setForm((prev) => ({ ...prev, pass: '' }));
      setMessage('SMTP settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getAccessToken();
      await testAdminSmtpSettings(token, testEmail || undefined);
      setMessage(`Test email sent${testEmail ? ` to ${testEmail}` : ''}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <p className="font-sans text-body-md text-ink-soft">Loading SMTP settings…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-headline-md font-normal text-ink">SMTP email</h2>
        <p className="mt-2 max-w-xl font-sans text-body-md text-ink-soft">
          Configure outbound email for results delivery and newsletters. Password is never shown
          after save.
          {source === 'env' ? ' Currently using environment variables as a fallback.' : null}
        </p>
      </div>

      <form className="surface-card space-y-4 p-5 sm:p-6" onSubmit={handleSave}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="field-label">Host</span>
            <input
              className="field w-full"
              value={form.host}
              onChange={(e) => setField('host', e.target.value)}
              placeholder="smtp.example.com"
              required
            />
          </label>
          <label className="block">
            <span className="field-label">Port</span>
            <input
              className="field w-full"
              type="number"
              min={1}
              max={65535}
              value={form.port}
              onChange={(e) => setField('port', Number(e.target.value))}
              required
            />
          </label>
          <label className="flex items-center gap-2 pt-7 font-sans text-[14px] text-ink">
            <input
              type="checkbox"
              checked={form.secure}
              onChange={(e) => setField('secure', e.target.checked)}
            />
            Use TLS (secure)
          </label>
          <label className="block">
            <span className="field-label">Username</span>
            <input
              className="field w-full"
              value={form.user}
              onChange={(e) => setField('user', e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="field-label">Password{hasPassword ? ' (saved)' : ''}</span>
            <input
              className="field w-full"
              type="password"
              value={form.pass}
              onChange={(e) => setField('pass', e.target.value)}
              placeholder={hasPassword ? '••••••••' : ''}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="field-label">From name</span>
            <input
              className="field w-full"
              value={form.fromName}
              onChange={(e) => setField('fromName', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">From email</span>
            <input
              className="field w-full"
              type="email"
              value={form.fromEmail}
              onChange={(e) => setField('fromEmail', e.target.value)}
              required
            />
          </label>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save SMTP'}
        </Button>
      </form>

      <div className="surface-card space-y-3 p-5 sm:p-6">
        <h3 className="font-display text-lg text-ink">Send a test email</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="field flex-1"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Optional — defaults to your admin email"
          />
          <Button type="button" variant="secondary" onClick={handleTest} disabled={testing}>
            {testing ? 'Testing…' : 'Test SMTP'}
          </Button>
        </div>
      </div>

      {message ? <p className="font-sans text-body-md text-canopy">{message}</p> : null}
      {error ? (
        <p className="font-sans text-body-md text-signal-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
