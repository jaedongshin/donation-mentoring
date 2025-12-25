import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// This script will be run via a tool that has access to MCP Notion API
// For now, let's use a direct approach with fetch to Notion API

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const NOTION_DATABASE_ID = '1a5b8883-6faf-8035-b1cd-e2b985fdfbc4';

interface NotionMentor {
  id: string;
  name: string;
  description: string;
  company: string;
  position: string[];
  location: string[];
  mentoringGuide: string;
}

async function fetchAllMentorsFromNotion(): Promise<NotionMentor[]> {
  const mentors: NotionMentor[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const response: Response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    for (const page of data.results) {
      if ('properties' in page) {
        const props = page.properties;
        
        // Extract name from title field
        const nameField = props.Name as any;
        const name = nameField?.title?.[0]?.plain_text || '';

        // Extract 소개 (description)
        const descField = props.소개 as any;
        const description = descField?.rich_text?.[0]?.plain_text || '';

        // Extract 소속 (company)
        const companyField = props.소속 as any;
        const company = companyField?.rich_text?.[0]?.plain_text || '';

        // Extract 직책 (position) - multi_select
        const positionField = props.직책 as any;
        const positions = positionField?.multi_select?.map((item: any) => item.name) || [];

        // Extract 거주지 (location) - multi_select
        const locationField = props.거주지 as any;
        const locations = locationField?.multi_select?.map((item: any) => item.name) || [];

        // Extract 멘토링 가이드 (mentoring guide URL)
        const guideField = props['멘토링 가이드'] as any;
        const mentoringGuide = guideField?.url || '';

        if (name) {
          mentors.push({
            id: page.id,
            name,
            description,
            company,
            position: positions,
            location: locations,
            mentoringGuide,
          });
        }
      }
    }

    hasMore = data.has_more || false;
    cursor = data.next_cursor || undefined;
  }

  return mentors;
}

async function syncMentors() {
  try {
    console.log('Fetching mentors from Notion...');
    const notionMentors = await fetchAllMentorsFromNotion();
    console.log(`Found ${notionMentors.length} mentors in Notion`);

    // Get existing mentors from Supabase
    const { data: existingMentors, error: fetchError } = await supabase
      .from('mentors')
      .select('id');

    if (fetchError) {
      console.error('Error fetching existing mentors:', fetchError);
      return;
    }

    console.log(`Found ${existingMentors?.length || 0} existing mentors in Supabase`);

    // Delete all existing mentors to do a full sync
    console.log('Clearing existing mentors...');
    if (existingMentors && existingMentors.length > 0) {
      const idsToDelete = existingMentors.map(m => m.id);
      const { error: deleteError } = await supabase
        .from('mentors')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting existing mentors:', deleteError);
        return;
      }
      console.log(`Deleted ${idsToDelete.length} existing mentors`);
    }

    // Prepare mentors for insertion
    const mentorsToInsert = notionMentors.map((mentor) => {
      const positionText = mentor.position.join(', ') || null;
      const locationText = mentor.location.join(', ') || null;

      // Determine if active (exclude mentors with "쉬는 중" or similar in name)
      const isActive = !mentor.name.toLowerCase().includes('쉬는 중');

      return {
        name_ko: mentor.name,
        name_en: mentor.name, // Use Korean name as fallback for now
        description_ko: mentor.description || '',
        description_en: mentor.description || '', // Use Korean description as fallback
        company_ko: mentor.company || null,
        company_en: mentor.company || null,
        position_ko: positionText,
        position_en: positionText,
        location_ko: locationText,
        location_en: locationText,
        calendly_url: mentor.mentoringGuide || null,
        linkedin_url: null,
        email: null,
        picture_url: null,
        languages: null,
        tags: null,
        is_active: isActive,
      };
    });

    // Insert all mentors
    console.log(`Inserting ${mentorsToInsert.length} mentors...`);
    const { data: insertedMentors, error: insertError } = await supabase
      .from('mentors')
      .insert(mentorsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting mentors:', insertError);
      return;
    }

    console.log(`Successfully synced ${insertedMentors?.length || 0} mentors!`);
    console.log('\nSynced mentors:');
    insertedMentors?.forEach((mentor, index) => {
      console.log(`${index + 1}. ${mentor.name_ko} (${mentor.company_ko || 'No company'})`);
    });
  } catch (error) {
    console.error('Error syncing mentors:', error);
    process.exit(1);
  }
}

syncMentors();

