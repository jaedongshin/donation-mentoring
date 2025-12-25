import { supabase } from '../utils/supabase';
import { getMentorsFromNotion } from '../utils/notion';

async function sync() {
  try {
    const mentors = await getMentorsFromNotion('1a5b88836faf8035b1cde2b985fdfbc4');
    console.log(`Prepared ${mentors.length} mentors to sync.`);

    for (const mentor of mentors) {
      // Check if exists
      const { data: existing } = await supabase
        .from('mentors')
        .select('id')
        .eq('name_ko', mentor.name_ko)
        .maybeSingle();
        
      if (existing) {
         console.log(`Updating ${mentor.name_ko}...`);
         const updatePayload = { ...mentor };
         if (!updatePayload.picture_url) delete (updatePayload as any).picture_url;
         
         await supabase.from('mentors').update(updatePayload).eq('id', existing.id);
      } else {
         console.log(`Inserting ${mentor.name_ko}...`);
         await supabase.from('mentors').insert([mentor]);
      }
    }
    console.log('Done.');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

sync();