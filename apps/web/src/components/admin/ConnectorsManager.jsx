import { useEffect, useMemo, useState } from 'react';
import {
  createAdminConnector,
  deleteAdminConnector,
  fetchAdminConnectors,
  testAdminConnector,
  updateAdminConnector,
} from '../../services/api.js';
import Button from '../shared/Button.jsx';

const inputClass = 'field';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div>{children}</div>
      {hint ? <p className="mt-1 font-sans text-[12px] text-ink-faint">{hint}</p> : null}
    </label>
  );
}

function emptyForm(providers) {
  const first = providers[0];
  return {
    name: first?.label || '',
    provider: first?.id || 'mistral',
    model: first?.defaultModel || '',
    baseUrl: first?.defaultBaseUrl || '',
    apiKey: '',
    enabled: true,
    priority: 10,
    notes: '',
  };
}

function groupProviders(providers) {
  const map = new Map();
  for (const p of providers) {
    const cat = p.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(p);
  }
  return [...map.entries()];
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
          <p className="card-eyebrow">Providers</p>
          <h2 className="font-display text-headline-md font-normal text-ink">AI connectors</h2>
          <p className="mt-1 max-w-2xl font-sans text-body-md text-ink-soft">
            Connect Mistral, Gemini, Groq, Together, DeepSeek, OpenAI, Anthropic, OpenRouter,
            Ollama, or any OpenAI-compatible open-source host. Lower priority number is tried first.
            If none are saved, the API falls back to environment variables.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!providers.length && !loading}>
          Add connector
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-signal-red/30 bg-signal-red-tint px-4 py-3 font-sans text-body-md text-ink">
          {error}
        </p>
      ) : null}
      {testMessage ? (
        <p className="rounded-md border border-fern/30 bg-fern-tint px-4 py-3 font-sans text-body-md text-ink">
          {testMessage}
        </p>
      ) : null}

      {loading ? (
        <p className="font-sans text-body-md text-ink-soft">Loading connectors…</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-linen-sunken bg-linen-raised shadow-soft">
          {connectors.length === 0 ? (
            <p className="p-6 font-sans text-body-md text-ink-soft">
              No connectors yet. Add Gemini or another provider, or keep using{' '}
              <code className="font-mono text-canopy">GEMINI_API_KEY</code> from the API host env.
            </p>
          ) : (
            <ul className="divide-y divide-linen-sunken">
              {connectors.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-sans text-[15px] font-semibold text-ink">
                      {c.name}
                      {!c.enabled ? (
                        <span className="ml-2 font-mono text-[11px] text-ink-faint">(disabled)</span>
                      ) : null}
                    </p>
                    <p className="mt-1 font-mono text-[12px] text-ink-faint">
                      {c.provider} · {c.model} · priority {c.priority}
                      {c.apiKeyMasked ? ` · key ${c.apiKeyMasked}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest(c.id)}
                      disabled={testingId === c.id}
                    >
                      {testingId === c.id ? 'Testing…' : 'Test'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleToggle(c)}>
                      {c.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
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
        <div className="surface-card p-6">
          <h3 className="font-display text-headline-md font-normal text-ink">
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
            <Field
              label="Provider"
              hint={selectedMeta?.docsHint}
            >
              <select
                className={inputClass}
                value={form.provider}
                onChange={(e) => onProviderChange(e.target.value)}
              >
                {groupProviders(providers).map(([category, items]) => (
                  <optgroup key={category} label={category}>
                    {items.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
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
            {(selectedMeta?.needsBaseUrl || selectedMeta?.allowBaseUrlOverride) && (
              <Field
                label="Base URL"
                hint={
                  selectedMeta?.needsBaseUrl
                    ? 'Required — e.g. http://localhost:1234/v1 for LM Studio'
                    : `Optional override (default: ${selectedMeta?.defaultBaseUrl || 'provider default'})`
                }
              >
                <input
                  className={inputClass}
                  value={form.baseUrl}
                  placeholder={selectedMeta?.defaultBaseUrl || 'https://…/v1'}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                />
              </Field>
            )}
            {selectedMeta?.needsApiKey !== false || form.provider === 'openai-compat' ? (
              <Field
                label={
                  editingId
                    ? 'API key (leave blank to keep)'
                    : selectedMeta?.needsApiKey === false
                      ? 'API key (optional)'
                      : 'API key'
                }
                hint={
                  selectedMeta?.needsApiKey === false
                    ? 'Optional — many local servers need no key. Stored on the server only.'
                    : 'Stored on the server only; never shown in full again.'
                }
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
