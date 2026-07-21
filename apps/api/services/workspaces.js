import {
  DEFAULT_WORKSPACE_CONTENT,
  isValidSlug,
  mergeWorkspaceContent,
  sanitizeCustomDomain,
  sanitizePrimaryColor,
  sanitizeSlug,
  sanitizeWorkspaceContent,
} from '@recharge/shared/workspaceContent';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const TEAM_SELECT =
  'id, name, slug, brand_name, custom_domain, primary_color, content, status, contact_email, logo_url, admin_user_id, created_at, updated_at';

function mapWorkspace(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brandName: row.brand_name || row.name,
    customDomain: row.custom_domain || null,
    primaryColor: row.primary_color || '#003441',
    content: mergeWorkspaceContent(row.content),
    status: row.status || 'draft',
    contactEmail: row.contact_email || null,
    logoUrl: row.logo_url || null,
    adminUserId: row.admin_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWorkspaces() {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');
  const { data, error } = await supabase
    .from('teams')
    .select(TEAM_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapWorkspace);
}

export async function getWorkspace(id) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');
  const { data, error } = await supabase.from('teams').select(TEAM_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return mapWorkspace(data);
}

export async function resolveWorkspaceByHost(hostRaw) {
  if (!isSupabaseConfigured()) return null;
  const host = String(hostRaw ?? '')
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');
  if (!host) return null;

  const { data: byDomain, error: domainErr } = await supabase
    .from('teams')
    .select(TEAM_SELECT)
    .eq('status', 'active')
    .ilike('custom_domain', host)
    .maybeSingle();

  if (domainErr) throw domainErr;
  if (byDomain) return mapWorkspace(byDomain);

  // Optional: slug.localhost or slug.yourplatform.com
  const slugCandidate = host.split('.')[0];
  if (slugCandidate && isValidSlug(slugCandidate) && host !== 'localhost' && host !== '127.0.0.1') {
    const { data: bySlug, error: slugErr } = await supabase
      .from('teams')
      .select(TEAM_SELECT)
      .eq('status', 'active')
      .eq('slug', slugCandidate)
      .maybeSingle();
    if (slugErr) throw slugErr;
    if (bySlug) return mapWorkspace(bySlug);
  }

  return null;
}

export async function createWorkspace(input, adminUserId = null) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');

  const name = String(input?.name ?? '').trim().slice(0, 120);
  const slug = sanitizeSlug(input?.slug || name);
  if (!name) throw new Error('Business name is required.');
  if (!isValidSlug(slug)) throw new Error('Slug must be 2–48 characters (lowercase letters, numbers, hyphens).');

  const customDomain = sanitizeCustomDomain(input?.customDomain);
  const row = {
    name,
    slug,
    brand_name: String(input?.brandName ?? name).trim().slice(0, 120) || name,
    custom_domain: customDomain || null,
    primary_color: sanitizePrimaryColor(input?.primaryColor),
    content: sanitizeWorkspaceContent(input?.content),
    status: ['draft', 'active', 'suspended'].includes(input?.status) ? input.status : 'draft',
    contact_email: input?.contactEmail ? String(input.contactEmail).trim().slice(0, 254) : null,
    logo_url: input?.logoUrl ? String(input.logoUrl).trim().slice(0, 500) : null,
    admin_user_id: adminUserId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('teams').insert(row).select(TEAM_SELECT).single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('That slug or custom domain is already in use.');
    }
    throw error;
  }
  return mapWorkspace(data);
}

export async function updateWorkspace(id, input) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');

  const patch = { updated_at: new Date().toISOString() };

  if (input?.name != null) {
    const name = String(input.name).trim().slice(0, 120);
    if (!name) throw new Error('Business name is required.');
    patch.name = name;
  }
  if (input?.slug != null) {
    const slug = sanitizeSlug(input.slug);
    if (!isValidSlug(slug)) throw new Error('Invalid slug.');
    patch.slug = slug;
  }
  if (input?.brandName != null) {
    patch.brand_name = String(input.brandName).trim().slice(0, 120) || null;
  }
  if (input?.customDomain !== undefined) {
    const domain = sanitizeCustomDomain(input.customDomain);
    patch.custom_domain = domain || null;
  }
  if (input?.primaryColor != null) {
    patch.primary_color = sanitizePrimaryColor(input.primaryColor);
  }
  if (input?.content != null) {
    patch.content = sanitizeWorkspaceContent(input.content);
  }
  if (input?.status != null) {
    if (!['draft', 'active', 'suspended'].includes(input.status)) {
      throw new Error('Invalid status.');
    }
    patch.status = input.status;
  }
  if (input?.contactEmail !== undefined) {
    patch.contact_email = input.contactEmail
      ? String(input.contactEmail).trim().slice(0, 254)
      : null;
  }
  if (input?.logoUrl !== undefined) {
    patch.logo_url = input.logoUrl ? String(input.logoUrl).trim().slice(0, 500) : null;
  }

  const { data, error } = await supabase
    .from('teams')
    .update(patch)
    .eq('id', id)
    .select(TEAM_SELECT)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new Error('That slug or custom domain is already in use.');
    }
    throw error;
  }
  if (!data) throw new Error('Workspace not found.');
  return mapWorkspace(data);
}

export async function deleteWorkspace(id) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
  return { deleted: true };
}

export { DEFAULT_WORKSPACE_CONTENT };
