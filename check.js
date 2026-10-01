import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://othxceezbpfiauaevibt.supabase.co';
const supabaseKey = 'sb_publishable_ki8a43mdYzPTaypjvfBNFw_caZ1fTyv';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('certificate_number', 'NLIT-2026-000789')
    .single();

  console.log('Error:', error);
  console.log('PDF URL:', data?.pdf_url);
}

check();
