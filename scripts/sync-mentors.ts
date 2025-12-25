import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

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

if (!process.env.NOTION_API_KEY) {
  console.error('Error: NOTION_API_KEY environment variable is not set');
  console.error('Please add NOTION_API_KEY to your .env.local file');
  process.exit(1);
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Database ID - update this with your actual Notion database ID
// To find your database ID:
// 1. Open your Notion database in a browser
// 2. Look at the URL: https://www.notion.so/workspace/DATABASE_ID?v=...
// 3. Copy the DATABASE_ID (32-char hex string) and paste it here (remove any dashes)
// Example: If URL has '1a5b8883-6faf-8035-b1cd-e2b985fdfbc4', use '1a5b88836faf8035b1cde2b985fdfbc4'
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '124b88836faf80ee9760e29058b759ab';

interface NotionMentor {
  id: string;
  name: string;
  description: string;
  company: string;
  position: string[];
  location: string[];
  mentoringGuide: string;
  pictureUrl: string | null;
}

async function fetchAllMentorsFromNotion(): Promise<NotionMentor[]> {
  const mentors: NotionMentor[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const requestBody: any = {
      page_size: 100,
    };
    if (cursor) {
      requestBody.start_cursor = cursor;
    }
    
    // Use database ID directly (should be 32-char hex without dashes)
    const response = await notion.request({
      path: `databases/${NOTION_DATABASE_ID}/query`,
      method: 'post',
      body: requestBody,
    }) as any;
    
    if (!response || !response.results) {
      throw new Error('Invalid response from Notion API. Check your database ID and API key permissions.');
    }

    for (const page of response.results) {
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

        // Extract picture - try common property names
        let pictureUrl: string | null = null;
        const pictureFieldNames = ['Picture', 'Photo', 'Image', '프로필 사진', '사진', '프로필'];
        for (const fieldName of pictureFieldNames) {
          const field = props[fieldName] as any;
          if (field) {
            // Check for files property
            if (field.type === 'files' && field.files && field.files.length > 0) {
              const file = field.files[0];
              if (file.type === 'external' && file.external?.url) {
                pictureUrl = file.external.url;
                break;
              } else if (file.type === 'file' && file.file?.url) {
                pictureUrl = file.file.url;
                break;
              }
            }
            // Check for URL property
            if (field.type === 'url' && field.url) {
              pictureUrl = field.url;
              break;
            }
          }
        }

        if (name) {
          mentors.push({
            id: page.id,
            name,
            description,
            company,
            position: positions,
            location: locations,
            mentoringGuide,
            pictureUrl,
          });
        }
      }
    }

    hasMore = response.has_more || false;
    cursor = response.next_cursor || undefined;
  }

  return mentors;
}

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    // Check if this is a Notion file URL (s3.us-west-2.amazonaws.com or similar)
    const isNotionFile = url.includes('notion.so') || url.includes('amazonaws.com');
    
    const options: any = {
      headers: {},
    };
    
    // Add Notion authorization if it's a Notion file
    if (isNotionFile && process.env.NOTION_API_KEY) {
      options.headers['Authorization'] = `Bearer ${process.env.NOTION_API_KEY}`;
    }
    
    protocol.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          return downloadImage(redirectUrl).then(resolve).catch(reject);
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadImageToSupabase(imageBuffer: Buffer, fileName: string): Promise<string> {
  const fileExt = fileName.split('.').pop() || 'jpg';
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${Date.now()}_${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from('mentor-pictures')
    .upload(filePath, imageBuffer, {
      contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('mentor-pictures').getPublicUrl(filePath);
  return data.publicUrl;
}

async function processMentorPicture(notionPictureUrl: string | null, mentorName: string): Promise<string | null> {
  if (!notionPictureUrl) {
    return null;
  }

  try {
    console.log(`  Downloading picture for ${mentorName}...`);
    const imageBuffer = await downloadImage(notionPictureUrl);
    
    // Extract filename from URL or generate one
    const urlParts = new URL(notionPictureUrl);
    const pathParts = urlParts.pathname.split('/');
    const originalFileName = pathParts[pathParts.length - 1] || `${mentorName.replace(/\s+/g, '_')}.jpg`;
    
    console.log(`  Uploading picture for ${mentorName} to Supabase...`);
    const supabaseUrl = await uploadImageToSupabase(imageBuffer, originalFileName);
    console.log(`  ✓ Picture uploaded: ${supabaseUrl}`);
    return supabaseUrl;
  } catch (error) {
    console.error(`  ✗ Failed to process picture for ${mentorName}:`, error);
    return null;
  }
}

async function syncMentors() {
  try {
    console.log('Fetching mentors from Notion...');
    console.log(`Using database ID: ${NOTION_DATABASE_ID}`);
    console.log(`API Key present: ${!!process.env.NOTION_API_KEY}`);
    
    const notionMentors = await fetchAllMentorsFromNotion();
    console.log(`Found ${notionMentors.length} mentors in Notion`);

    // Get existing mentors from Supabase
    const { data: existingMentors, error: fetchError } = await supabase
      .from('mentors')
      .select('id, name_ko');

    if (fetchError) {
      console.error('Error fetching existing mentors:', fetchError);
      return;
    }

    const existingNames = new Set(
      existingMentors?.map(m => m.name_ko?.toLowerCase().trim()) || []
    );

    console.log(`Found ${existingMentors?.length || 0} existing mentors in Supabase`);

    // Process pictures first
    console.log('\nProcessing pictures from Notion...');
    const mentorsWithPictures = await Promise.all(
      notionMentors.map(async (mentor) => {
        const pictureUrl = await processMentorPicture(mentor.pictureUrl, mentor.name);
        return { ...mentor, processedPictureUrl: pictureUrl };
      })
    );

    // Prepare mentors for insertion
    const mentorsToInsert = mentorsWithPictures.map((mentor) => {
      const positionText = mentor.position.join(', ') || null;
      const locationText = mentor.location.join(', ') || null;

      // Determine if active (exclude mentors with "쉬는 중" or similar in name)
      const isActive = !mentor.name.toLowerCase().includes('쉬는 중');

      return {
        name_ko: mentor.name,
        name_en: null, // Will be filled later if needed
        description_ko: mentor.description || null,
        description_en: null,
        company_ko: mentor.company || null,
        company_en: null,
        position_ko: positionText,
        position_en: null,
        location_ko: locationText,
        location_en: null,
        calendly_url: mentor.mentoringGuide || null,
        linkedin_url: null,
        email: null,
        picture_url: mentor.processedPictureUrl,
        languages: null,
        tags: null,
        is_active: isActive,
      };
    });

    // Delete all existing mentors to do a full sync
    console.log('Clearing existing mentors...');
    const { data: allExisting, error: fetchAllError } = await supabase
      .from('mentors')
      .select('id');

    if (fetchAllError) {
      console.error('Error fetching mentors for deletion:', fetchAllError);
      return;
    }

    if (allExisting && allExisting.length > 0) {
      const idsToDelete = allExisting.map(m => m.id);
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
  } catch (error: any) {
    console.error('Error syncing mentors:', error.message || error);
    
    if (error.code === 'invalid_request_url') {
      console.error('\n⚠️  Invalid request URL error. This usually means:');
      console.error('1. The database ID is incorrect');
      console.error('2. The database doesn\'t exist or you don\'t have access');
      console.error('3. The API key doesn\'t have permission to access this database');
      console.error('\nTo fix this:');
      console.error('1. Get your database ID from the Notion URL:');
      console.error('   - Open your database in Notion');
      console.error('   - Look at the URL: https://www.notion.so/workspace/DATABASE_ID?v=...');
      console.error('   - Copy the DATABASE_ID (32-char hex, remove dashes)');
      console.error('2. Set it in .env.local: NOTION_DATABASE_ID=your_database_id');
      console.error('3. Make sure your API key has access to this database');
    }
    
    process.exit(1);
  }
}

syncMentors();

