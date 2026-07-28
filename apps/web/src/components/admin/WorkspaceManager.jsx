import { useEffect, useState } from 'react';
import {
  createAdminWorkspace,
  deleteAdminWorkspace,
  fetchAdminWorkspaces,
  updateAdminWorkspace,
} from '../../services/api.js';
import { DEFAULT_WORKSPACE_CONTENT } from '@recharge/shared/workspaceContent';
import Button from '../shared/Button.jsx';

const emptyForm = () => ({
  name: '',
  slug: '',
  brandName: '',
  customDomain: '',
  primaryColor: '#2D6A4F',
  contactEmail: '',
  status: 'draft',
  content: { ...DEFAULT_WORKSPACE_CONTENT },
});

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div>{children}</div>
    </label>
  );
}

const inputClass = 'field';

export default function WorkspaceManager({ getAccessToken }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getAccessToken();
      const { workspaces: items } = await fetchAdminWorkspaces(token);
      setWorkspaces(items ?? []);
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
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (ws) => {
    setEditingId(ws.id);
    setForm({
      name: ws.name || '',
      slug: ws.slug || '',
      brandName: ws.brandName || '',
      customDomain: ws.customDomain || '',
      primaryColor: ws.primaryColor || '#2D6A4F',
      contactEmail: ws.contactEmail || '',
      status: ws.status || 'draft',
      content: { ...DEFAULT_WORKSPACE_CONTENT, ...(ws.content || {}) },
    });
    setShowForm(true);
  };

  const setContentField = (key, value) => {
    setForm((f) => ({ ...f, content: { ...f.content, [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const payload = {
        name: form.name,
        slug: form.slug || form.name,
        brandName: form.brandName || form.name,
        customDomain: form.customDomain,
        primaryColor: form.primaryColor,
        contactEmail: form.contactEmail,
        status: form.status,
        content: form.content,
      };
      if (editingId) {
        await updateAdminWorkspace(token, editingId, payload);
      } else {
        await createAdminWorkspace(token, payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this business workspace? This cannot be undone.')) return;
    setError(null);
    try {
      const token = await getAccessToken();
      await deleteAdminWorkspace(token, id);
      if (editingId === id) setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="card-eyebrow">White-label</p>
          <h2 className="font-display text-headline-md font-normal text-ink">Business workspaces</h2>
          <p className="mt-1 max-w-2xl font-sans text-body-md text-ink-soft">
            Deploy Recharge as white-label SaaS: set a custom domain, brand colour, and landing
            copy. Attach the domain in Vercel, set status to Active, then visitors on that host see
            their branding.
          </p>
        </div>
        <Button onClick={openCreate}>Add business</Button>
      </div>

      {error ? (
        <p className="rounded-md border border-signal-red/30 bg-signal-red-tint px-4 py-3 font-sans text-body-md text-ink">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="font-sans text-body-md text-ink-soft">Loading workspaces…</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-linen-sunken bg-linen-raised shadow-soft">
          {workspaces.length === 0 ? (
            <p className="p-6 font-sans text-body-md text-ink-soft">
              No business workspaces yet. Create one to sell Recharge under a client domain.
            </p>
          ) : (
            <ul className="divide-y divide-linen-sunken">
              {workspaces.map((ws) => (
                <li
                  key={ws.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-sans text-[15px] font-semibold text-ink">
                      {ws.brandName || ws.name}
                    </p>
                    <p className="mt-1 font-mono text-[12px] text-ink-faint">
                      /{ws.slug}
                      {ws.customDomain ? ` · ${ws.customDomain}` : ''} · {ws.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(ws)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(ws.id)}>
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
            {editingId ? 'Edit workspace' : 'New business workspace'}
          </h3>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Business name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Slug (URL key)">
              <input
                className={inputClass}
                value={form.slug}
                placeholder="acme-wellbeing"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
            <Field label="Brand name (shown in header)">
              <input
                className={inputClass}
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              />
            </Field>
            <Field label="Custom domain">
              <input
                className={inputClass}
                value={form.customDomain}
                placeholder="wellbeing.acme.com"
                onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
              />
            </Field>
            <Field label="Primary colour">
              <input
                type="color"
                className="h-12 w-full cursor-pointer rounded-md border-[1.5px] border-linen-sunken bg-linen-raised p-1"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft (not live on domain)</option>
                <option value="active">Active (serve branding on domain)</option>
                <option value="suspended">Suspended</option>
              </select>
            </Field>
            <Field label="Contact email">
              <input
                className={inputClass}
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </Field>
          </div>

          <h4 className="mt-8 font-display text-headline-md font-normal text-ink">Landing content</h4>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {[
              ['badge', 'Badge (desktop)'],
              ['badgeMobile', 'Badge (mobile)'],
              ['headline', 'Headline (mobile)'],
              ['headlineDesktop', 'Headline (desktop)'],
              ['supporting', 'Supporting (mobile)'],
              ['supportingDesktop', 'Supporting (desktop)'],
              ['cta', 'CTA button'],
              ['footerTagline', 'Footer tagline'],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                {key.startsWith('supporting') ? (
                  <textarea
                    className={`${inputClass} min-h-[88px]`}
                    value={form.content[key] ?? ''}
                    onChange={(e) => setContentField(key, e.target.value)}
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={form.content[key] ?? ''}
                    onChange={(e) => setContentField(key, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save workspace'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>

          <p className="mt-6 font-sans text-[13px] text-ink-faint">
            After setting a custom domain: add it in Vercel → Domains, point DNS to Vercel, then set
            status to Active.
          </p>
        </div>
      ) : null}
    </section>
  );
}
