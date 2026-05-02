
import { getSupabase } from '../src/db/queries';

async function checkTables() {
  try {
    const supabase = await getSupabase();
    console.log('Checking tables...');
    
    const { data: cat, error: catErr } = await supabase.from('expense_categories').select('id').limit(1);
    console.log('expense_categories:', catErr ? `Error: ${catErr.message}` : 'Exists');
    
    const { data: exp, error: expErr } = await supabase.from('expenses').select('id').limit(1);
    console.log('expenses:', expErr ? `Error: ${expErr.message}` : 'Exists');
    
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

checkTables();
