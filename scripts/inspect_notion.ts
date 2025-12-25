import { Client } from '@notionhq/client';
import * as fs from 'fs';
import * as path from 'path';

// Manual env loader
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

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const dbId = '124b88836faf80ee9760e29058b759ab';

async function inspect() {
  try {
    console.log('Querying database:', dbId);
    // Workaround for missing query method
    const response = await notion.request({
      path: `databases/${dbId}/query`,
      method: 'post',
      body: {
        page_size: 1,
      },
    }) as any;

    if (response.results.length === 0) {
      console.log('No results found.');
      return;
    }

    const firstPage = response.results[0] as any;
    console.log('First page properties:', JSON.stringify(firstPage.properties, null, 2));
    
    // Also try to retrieve database details to see title/properties definition
    const db = await notion.request({
        path: `databases/${dbId}`,
        method: 'get',
    }) as any;
    console.log('Database title:', db.title[0]?.plain_text);
  } catch (error: any) {
    console.error('Error:', error.body || error);
  }
}

inspect();
