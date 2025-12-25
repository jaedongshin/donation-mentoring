const fs = require('fs');
const path = require('path');
const https = require('https');

// Manual env loader
const envPath = path.join(process.cwd(), '.env.local');
let NOTION_API_KEY = process.env.NOTION_API_KEY;

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      if (key.trim() === 'NOTION_API_KEY') {
          NOTION_API_KEY = value.trim();
      }
    }
  });
}

const dbId = '124b88836faf80ee9760e29058b759ab';

if (!NOTION_API_KEY) {
    console.error("No NOTION_API_KEY found.");
    process.exit(1);
}

const options = {
  hostname: 'api.notion.com',
  path: `/v1/databases/${dbId}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode !== 200) {
        console.error(`Error: ${res.statusCode} ${data}`);
        return;
    }
    const json = JSON.parse(data);
    console.log(JSON.stringify(json.properties, null, 2));
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
