import { createClient } from '@supabase/supabase-js';

// The URL and key should be in a .env file, using placeholders for local dev
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'example-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
