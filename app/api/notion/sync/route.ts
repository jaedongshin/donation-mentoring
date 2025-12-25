import { NextResponse } from 'next/server';
import { getMentorsFromNotion } from '@/utils/notion';
import { supabase } from '@/utils/supabase';

export async function POST() {
  try {
    const notionMentors = await getMentorsFromNotion('1a5b88836faf8035b1cde2b985fdfbc4');
    
    const results = [];
    
    for (const mentor of notionMentors) {
      // Try to find existing mentor by name
      // We use .eq() on name_en first, then name_ko if not found
      let { data: existing } = await supabase
        .from('mentors')
        .select('id')
        .eq('name_en', mentor.name_en)
        .maybeSingle();

      if (!existing && mentor.name_ko) {
        const { data: existingKo } = await supabase
          .from('mentors')
          .select('id')
          .eq('name_ko', mentor.name_ko)
          .maybeSingle();
        existing = existingKo;
      }

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('mentors')
          .update(mentor)
          .eq('id', existing.id)
          .select();
        
        if (error) throw error;
        results.push({ action: 'updated', data });
      } else {
        // Insert
        const { data, error } = await supabase
          .from('mentors')
          .insert([mentor])
          .select();
          
        if (error) throw error;
        results.push({ action: 'inserted', data });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
