import { createClient } from '@supabase/supabase-js';
import { getCloudflareContext } from '@opennextjs/cloudflare';

type RuntimeEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export function getSupabaseAdmin() {
  // On Cloudflare Workers/OpenNext, runtime secrets are bindings and may not
  // be available through process.env. Read Cloudflare bindings first.
  let cfEnv: RuntimeEnv = {};
  try {
    cfEnv = (getCloudflareContext().env || {}) as RuntimeEnv;
  } catch {
    // Local Next.js development/build: fall back to process.env below.
  }

  const url =
    cfEnv.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secret =
    cfEnv.SUPABASE_SECRET_KEY ||
    cfEnv.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    const missing = [
      !url ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
      !secret ? 'SUPABASE_SECRET_KEY' : null,
    ].filter(Boolean).join(', ');
    throw new Error(`Missing runtime binding(s): ${missing}`);
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
