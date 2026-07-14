import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Querying products with profiles...');
  const { data, error } = await supabase
    .from('products')
    .select('*, profiles:user_id(*)');
  
  if (error) {
    console.error('Error selecting products with profiles:', error);
  } else {
    console.log('Products count:', data.length);
    if (data.length > 0) {
      console.log('Product 0 profile:', data[0].profiles);
    }
  }
}

run();
