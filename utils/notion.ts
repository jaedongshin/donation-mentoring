import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const notionDbId = process.env.NOTION_DATABASE_ID!;

export async function getMentorsFromNotion(customDatabaseId?: string) {
  const targetDbId = customDatabaseId || notionDbId;

  if (!process.env.NOTION_API_KEY || !targetDbId) {
    throw new Error('NOTION_API_KEY or targetDbId is not set');
  }

  console.log('Fetching from Notion DB:', targetDbId);

  try {
    // Workaround for missing query method or if we need to use request directly
    let response: any;
    if ((notion.databases as any).query) {
      response = await (notion.databases as any).query({ database_id: targetDbId });
    } else {
      console.log('Using notion.request workaround...');
      response = await notion.request({
        path: `databases/${targetDbId}/query`,
        method: 'post',
      });
    }

    return await Promise.all(response.results.map(async (page: any) => {
      const props = page.properties;
      
      // Helper to get text from various Notion property types
      const getText = (prop: any) => {
        if (!prop) return null;
        if (prop.type === 'title') return prop.title[0]?.plain_text || null;
        if (prop.type === 'rich_text') return prop.rich_text[0]?.plain_text || null;
        if (prop.type === 'select') return prop.select?.name || null;
        if (prop.type === 'multi_select') return prop.multi_select.map((s: any) => s.name)[0] || null; // Take first
        if (prop.type === 'checkbox') return prop.checkbox;
        if (prop.type === 'url') return prop.url;
        return null;
      };

      // Helper to map location to English
      const mapLocation = (loc: string | null) => {
        if (!loc) return null;
        const map: Record<string, string> = {
          '미국': 'USA',
          '한국': 'Korea',
          '독일': 'Germany',
          '네덜란드': 'Netherlands',
          '캐나다': 'Canada',
          '싱가폴': 'Singapore',
          '영국': 'UK',
        };
        return map[loc] || loc;
      };

      // Fetch page content to get image
      let imageUrl = null;
      try {
        const blocks = await notion.blocks.children.list({
          block_id: page.id,
        });
        
        // Find first image block
        const imageBlock = blocks.results.find((b: any) => b.type === 'image');
        if (imageBlock) {
          // @ts-ignore
          const img = imageBlock.image;
          imageUrl = img.type === 'file' ? img.file.url : img.external.url;
        }
      } catch (e) {
        console.error(`Error fetching content for ${page.id}`, e);
      }

      const name = getText(props['Name']);
      const description = getText(props['소개']);
      const company = getText(props['소속']);
      const position = getText(props['직책']);
      const locationKo = getText(props['거주지']);
      const calendlyUrl = getText(props['멘토링 가이드']);

      return {
        name_en: name, // Use same name for both
        name_ko: name,
        description_en: description, // Use same description for both
        description_ko: description,
        location_en: mapLocation(locationKo),
        location_ko: locationKo,
        position_en: position, // Positions seem to be in English already
        position_ko: position,
        company_en: company,
        company_ko: company,
        picture_url: imageUrl,
        calendly_url: calendlyUrl,
        tags: company ? [company] : [], // Use company as tag
        is_active: true,
      };
    }));
  } catch (error) {
    console.error("Notion sync error:", error);
    throw error;
  }
}
