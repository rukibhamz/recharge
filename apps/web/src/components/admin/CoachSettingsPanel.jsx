import { useEffect, useMemo, useState } from 'react';
import {
  fetchAdminCoachSettings,
  fetchAdminConnectors,
  updateAdminCoachSettings,
} from '../../services/api.js';
import Button from '../shared/Button.jsx';

export default function CoachSettingsPanel({ getAccessToken }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [form, setForm] = useState({ name: 'Oma', connectorId: '' });

  const connectorOptions = useMemo(
    () => connectors.filter((c) => c.enabled),
    [connectors],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const [settingsRes, connectorsRes] = await Promise.all([
        fetchAdminCoachSettings(token),
        fetchAdminConnectors(token),
      ]);

      setConnectors(connectorsRes.connectors ?? []);
      const settings = settingsRes.settings ?? {};
      setForm({
        name: settings.name || 'Oma',
        connectorId: settings.connectorId || '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const token = await getAccessToken();
      const payload = {
        name: form.name,
        connectorId: form.connectorId || null,
      };
      const data = await updateAdminCoachSettings(token, payload);
      setForm({
        name: data.settings?.name || form.name,
        connectorId: data.settings?.connectorId || '',
      });
      setOk('Coach settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="card-eyebrow">Coach config</p>
        <h2 className="font-display text-headline-md font-normal text-ink">Oma settings</h2>
        <p className="mt-1 max-w-2xl font-sans text-body-md text-ink-soft">
          Set the coach display name and optionally pin a dedicated model connector for coach chats.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-signal-red/30 bg-signal-red-tint px-4 py-3 font-sans text-body-md text-ink">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="rounded-md border border-fern/30 bg-fern-tint px-4 py-3 font-sans text-body-md text-ink">
          {ok}
        </p>
      ) : null}

      {loading ? (
        <p className="font-sans text-body-md text-ink-soft">Loading coach settings…</p>
      ) : (
        <div className="surface-card grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <label className="block">
            <span className="field-label">Coach display name</span>
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={40}
              placeholder="Oma"
            />
            <p className="mt-1 font-sans text-[12px] text-ink-faint">
              Used in greetings and chat responses.
            </p>
          </label>

          <label className="block">
            <span className="field-label">Coach model connector</span>
            <select
              className="field"
              value={form.connectorId}
              onChange={(e) => setForm((f) => ({ ...f, connectorId: e.target.value }))}
            >
              <option value="">Auto (use priority chain)</option>
              {connectorOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.provider} · {c.model}
                </option>
              ))}
            </select>
            <p className="mt-1 font-sans text-[12px] text-ink-faint">
              If set, coach chats try this connector first, then fall back to the normal chain.
            </p>
          </label>

          <div className="md:col-span-2">
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save coach settings'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
