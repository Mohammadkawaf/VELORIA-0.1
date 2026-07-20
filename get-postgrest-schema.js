import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`;
  console.log('Fetching OpenAPI with apikey query parameter:', url);
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey
      }
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body length:', text.length);
    if (response.ok) {
      const obj = JSON.parse(text);
      console.log('Title:', obj.info?.title);
      console.log('Available tables:', Object.keys(obj.definitions || {}));
      console.log('Products definition:', JSON.stringify(obj.definitions?.products, null, 2));
    } else {
      console.log('Error body:', text);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
run();
