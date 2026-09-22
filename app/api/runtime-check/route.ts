import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
export const dynamic='force-dynamic';

export async function GET(){
  let env:any={};
  try { env=getCloudflareContext().env || {}; } catch {}
  return NextResponse.json({
    cloudflareBindings:{
      NEXT_PUBLIC_SUPABASE_URL:Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SECRET_KEY:Boolean(env.SUPABASE_SECRET_KEY),
      SUPABASE_SERVICE_ROLE_KEY:Boolean(env.SUPABASE_SERVICE_ROLE_KEY)
    },
    processEnv:{
      NEXT_PUBLIC_SUPABASE_URL:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SECRET_KEY:Boolean(process.env.SUPABASE_SECRET_KEY),
      SUPABASE_SERVICE_ROLE_KEY:Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
  });
}
