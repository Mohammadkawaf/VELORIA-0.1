import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Querying categories...');
  const { data: cats, error: errCats } = await supabase.from('categories').select('*').limit(1);
  console.log('Categories result:', cats, errCats);

  console.log('Querying profiles...');
  const { data: profs, error: errProfs } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles result:', profs, errProfs);
}

run();
