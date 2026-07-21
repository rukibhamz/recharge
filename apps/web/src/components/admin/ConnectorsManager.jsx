import { useEffect, useMemo, useState } from 'react';
import {
  createAdminConnector,
  deleteAdminConnector,
  fetchAdminConnectors,
  testAdminConnector,
  updateAdminConnector,
} from '../../services/api.js';
import Button from '../shared/Button.jsx';

const inputClass =
  'w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 font-sans text-body-md text-on-surface outline-none focus:border-primary';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="font-sans text-label-sm text-on-surface-variant">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? (
        <p className="mt-1 font-sans text-[12px] text-on-surface-variant/80">{hint}</p>
      ) : null}
    </label>
  );
}

function emptyForm(providers) {
  const first = providers[0];
  return {
    name: first?.label || '',
    provider: first?.id || 'gemini',
    model: first?.defaultModel || '',
    baseUrl: first?.defaultBaseUrl || '',
    apiKey: '',
    enabled: true,
    priority: 10,
    notes: '',
  };
}

export default function ConnectorsManager({ getAccessToken }) {
  const [connectors, setConnectors] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testMessage, setTestMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => emptyForm([]));

  const selectedMeta = useMemo(
    () => providers.find((p) => p.id === form.provider),
    [providers, form.provider],
  );

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getAccessToken();
      const data = await fetchAdminConnectors(token);
      setConnectors(data.connectors ?? []);
      setProviders(data.providers ?? []);
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(providers));
    setShowForm(true);
    setTestMessage(null);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      provider: c.provider,
      model: c.model,
      baseUrl: c.baseUrl || '',
      apiKey: '',
      enabled: c.enabled,
      priority: c.priority,
      notes: c.notes || '',
    });
    setShowForm(true);
    setTestMessage(null);
  };

  const onProviderChange = (providerId) => {
    const meta = providers.find((p) => p.id === providerId);
    setForm((f) => ({
      ...f,
      provider: providerId,
      name: f.name || meta?.label || '',
      model: meta?.defaultModel || f.model,
      baseUrl: meta?.defaultBaseUrl || '',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const payload = {
        name: form.name,
        provider: form.provider,
        model: form.model,
        baseUrl: form.baseUrl,
        enabled: form.enabled,
        priority: Number(form.priority) || 100,
        notes: form.notes,
      };
      if (form.apiKey.trim()) payload.apiKey = form.apiKey.trim();

      if (editingId) {
        await updateAdminConnector(token, editingId, payload);
      } else {
        await createAdminConnector(token, payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c) => {
    setError(null);
    try {
      const token = await getAccessToken();
      await updateAdminConnector(token, c.id, { enabled: !c.enabled });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this AI connector?')) return;
    setError(null);
    try {
      const token = await getAccessToken();
      await deleteAdminConnector(token, id);
      if (editingId === id) setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    setTestMessage(null);
    setError(null);
    try {
      const token = await getAccessToken();
      const result = await testAdminConnector(token, id);
      setTestMessage(`OK — ${result.provider}`);
    } catch (err) {
      setTestMessage(null);
      setError(err.message);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-headline-md text-primary">AI connectors</h2>
          <p className="mt-1 max-w-2xl font-sans text-body-md text-on-surface-variant">
            Connect Gemini, OpenAI, Anthropic, OpenRouter, or Ollama for personality and burnout
            generation. Lower priority number is tried first. If none are saved, the API falls back
            to environment variables.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!providers.length && !loading}>
          Add connector
        </Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-status-severe/30 bg-status-severe/5 px-4 py-3 font-sans text-body-md text-on-surface">
          {error}
        </p>
      ) : null}
      {testMessage ? (
        <p className="rounded-xl border border-status-healthy/30 bg-status-healthy/10 px-4 py-3 font-sans text-body-md text-on-surface">
          {testMessage}
        </p>
      ) : null}

      {loading ? (
        <p className="font-sans text-body-md text-on-surface-variant">Loading connectors…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-soft">
          {connectors.length === 0 ? (
            <p className="p-6 font-sans text-body-md text-on-surface-variant">
              No connectors yet. Add Gemini or another provider, or keep using{' '}
              <code className="text-primary">GEMINI_API_KEY</code> from the API host env.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant/20">
              {connectors.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-sans text-body-md font-medium text-on-surface">
                      {c.name}
                      {!c.enabled ? (
                        <span className="ml-2 font-sans text-label-sm text-on-surface-variant">
                          (disabled)
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 font-sans text-label-sm text-on-surface-variant">
                      {c.provider} · {c.model} · priority {c.priority}
                      {c.apiKeyMasked ? ` · key ${c.apiKeyMasked}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleTest(c.id)}
                      disabled={testingId === c.id}
                    >
                      {testingId === c.id ? 'Testing…' : 'Test'}
                    </Button>
                    <Button variant="ghost" onClick={() => handleToggle(c)}>
                      {c.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(c.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm ? (
        <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-soft">
          <h3 className="font-display text-headline-md text-primary">
            {editingId ? 'Edit connector' : 'New AI connector'}
          </h3>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Display name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Provider">
              <select
                className={inputClass}
                value={form.provider}
                onChange={(e) => onProviderChange(e.target.value)}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Model"
              hint={
                selectedMeta?.modelHints?.length
                  ? `Examples: ${selectedMeta.modelHints.join(', ')}`
                  : undefined
              }
            >
              <input
                className={inputClass}
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </Field>
            <Field label="Priority (lower = first)">
              <input
                type="number"
                className={inputClass}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              />
            </Field>
            {(selectedMeta?.needsBaseUrl ||
              form.provider === 'openai' ||
              form.provider === 'openrouter' ||
              form.provider === 'ollama') && (
              <Field
                label="Base URL"
                hint={
                  form.provider === 'ollama'
                    ? 'e.g. http://localhost:11434'
                    : 'Leave blank for provider default'
                }
              >
                <input
                  className={inputClass}
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                />
              </Field>
            )}
            {selectedMeta?.needsApiKey !== false && form.provider !== 'ollama' ? (
              <Field
                label={editingId ? 'API key (leave blank to keep)' : 'API key'}
                hint="Stored on the server only; never shown in full again."
              >
                <input
                  type="password"
                  autoComplete="off"
                  className={inputClass}
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={editingId ? '••••••••' : ''}
                />
              </Field>
            ) : null}
            <Field label="Enabled">
              <select
                className={inputClass}
                value={form.enabled ? '1' : '0'}
                onChange={(e) => setForm({ ...form, enabled: e.target.value === '1' })}
              >
                <option value="1">Enabled</option>
                <option value="0">Disabled</option>
              </select>
            </Field>
            <Field label="Notes (optional)">
              <input
                className={inputClass}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save connector'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
