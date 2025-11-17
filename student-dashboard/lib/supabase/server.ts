import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import '../env'; // БАГ #56: Валидация environment variables

export async function createClient() {
  const cookieStore = await cookies();

  // БАГ #56: Environment variables валидированы в lib/env.ts
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  );
}
