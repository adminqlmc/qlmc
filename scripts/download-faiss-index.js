/**
 * Download FAISS Index from Render and Save to Git
 * 
 * Workflow sau khi train trên admin panel:
 * 1. Train data trên Render → Lưu vào MongoDB
 * 2. Chạy script này để download index từ Render
 * 3. Lưu vào py-chatbot/prebuilt/
 * 4. Commit và push lên GitHub
 * 5. Vercel auto-deploy → Chat API dùng index từ Git
 * 
 * Usage:
 *   npm run download-index
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load .env manually (avoid dotenv dependency)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 
                    process.env.PY_CHATBOT_URL || 
                    'https://qlmc-python-backend-chrc.onrender.com';

const PREBUILT_DIR = path.join(__dirname, '..', 'py-chatbot', 'prebuilt');
const INDEX_FILE = path.join(PREBUILT_DIR, 'faiss.index');
const META_FILE = path.join(PREBUILT_DIR, 'meta.json');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('🚀 Downloading FAISS index from Render...\n');
  
  try {
    // Ensure prebuilt directory exists
    if (!fs.existsSync(PREBUILT_DIR)) {
      fs.mkdirSync(PREBUILT_DIR, { recursive: true });
      console.log('✅ Created prebuilt directory');
    }
    
    // Download faiss.index
    console.log('📥 Downloading faiss.index...');
    await downloadFile(`${BACKEND_URL}/index/download?file=index`, INDEX_FILE);
    const indexSize = fs.statSync(INDEX_FILE).size;
    console.log(`✅ Downloaded faiss.index (${(indexSize / 1024).toFixed(2)} KB)`);
    
    // Download meta.json
    console.log('\n📥 Downloading meta.json...');
    await downloadFile(`${BACKEND_URL}/index/download?file=meta`, META_FILE);
    const metaContent = fs.readFileSync(META_FILE, 'utf-8');
    const meta = JSON.parse(metaContent);
    console.log(`✅ Downloaded meta.json`);
    console.log(`   📊 Chunks: ${meta.doc_ids?.length || 0}`);
    console.log(`   📐 Embedding dim: ${meta.emb_dim || 384}`);
    
    console.log('\n✨ Download completed successfully!');
    console.log('📍 Files saved to: py-chatbot/prebuilt/');
    console.log('\n📝 Next steps:');
    console.log('   1. Review changes: git status');
    console.log('   2. Commit: git add py-chatbot/prebuilt/ && git commit -m "chore: Update FAISS index"');
    console.log('   3. Push: git push origin main');
    console.log('   4. Vercel will auto-deploy with new index');
    console.log('   5. Chat API will use updated index from Git');
    
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

main();
