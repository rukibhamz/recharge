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
  primaryColor: '#003441',
  contactEmail: '',
  status: 'draft',
  content: { ...DEFAULT_WORKSPACE_CONTENT },
});

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-sans text-label-sm text-on-surface-variant">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 font-sans text-body-md text-on-surface outline-none focus:border-primary';

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
      primaryColor: ws.primaryColor || '#003441',
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
          <h2 className="font-display text-headline-md text-primary">Business workspaces</h2>
          <p className="mt-1 max-w-2xl font-sans text-body-md text-on-surface-variant">
            Deploy Recharge as white-label SaaS: set a custom domain, brand colour, and landing
            copy. Attach the domain in Vercel, set status to Active, then visitors on that host see
            their branding.
          </p>
        </div>
        <Button onClick={openCreate}>Add business</Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-status-severe/30 bg-status-severe/5 px-4 py-3 font-sans text-body-md text-on-surface">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="font-sans text-body-md text-on-surface-variant">Loading workspaces…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-soft">
          {workspaces.length === 0 ? (
            <p className="p-6 font-sans text-body-md text-on-surface-variant">
              No business workspaces yet. Create one to sell Recharge under a client domain.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant/20">
              {workspaces.map((ws) => (
                <li
                  key={ws.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-sans text-body-md font-medium text-on-surface">
                      {ws.brandName || ws.name}
                    </p>
                    <p className="mt-1 font-sans text-label-sm text-on-surface-variant">
                      /{ws.slug}
                      {ws.customDomain ? ` · ${ws.customDomain}` : ''} · {ws.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => openEdit(ws)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(ws.id)}>
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
                className="h-12 w-full cursor-pointer rounded-xl border border-outline-variant/40 bg-white p-1"
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

          <h4 className="mt-8 font-display text-headline-md text-primary">Landing content</h4>
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

          <p className="mt-6 font-sans text-label-sm text-on-surface-variant">
            After setting a custom domain: add it in Vercel → Domains, point DNS to Vercel, then set
            status to Active.
          </p>
        </div>
      ) : null}
    </section>
  );
}
