import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isConfigured = Boolean(url && key);

// Only used when isConfigured is true; placeholders keep createClient from throwing otherwise.
export const supabase = createClient(url || 'http://localhost', key || 'not-configured');
