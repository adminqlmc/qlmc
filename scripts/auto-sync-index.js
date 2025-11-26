/**
 * Auto Sync FAISS Index to Git (Fully Automated)
 * 
 * Workflow:
 * 1. Download index từ Render về py-chatbot/prebuilt/
 * 2. Git add, commit, push tự động
 * 3. Vercel auto-deploy
 * 
 * Usage:
 *   node scripts/auto-sync-index.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

// Load .env
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

function runCommand(command, options = {}) {
  try {
    return execSync(command, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

async function downloadIndex() {
  console.log('📥 Downloading FAISS index from Render...\n');
  
  // Ensure prebuilt directory exists
  if (!fs.existsSync(PREBUILT_DIR)) {
    fs.mkdirSync(PREBUILT_DIR, { recursive: true });
  }
  
  // Download faiss.index
  console.log('📥 Downloading faiss.index...');
  await downloadFile(`${BACKEND_URL}/index/download?file=index`, INDEX_FILE);
  const indexSize = fs.statSync(INDEX_FILE).size;
  console.log(`✅ Downloaded faiss.index (${(indexSize / 1024).toFixed(2)} KB)`);
  
  // Download meta.json
  console.log('📥 Downloading meta.json...');
  await downloadFile(`${BACKEND_URL}/index/download?file=meta`, META_FILE);
  const metaContent = fs.readFileSync(META_FILE, 'utf-8');
  const meta = JSON.parse(metaContent);
  console.log(`✅ Downloaded meta.json`);
  console.log(`   📊 Chunks: ${meta.doc_ids?.length || 0}`);
  
  return meta;
}

function gitSyncToRemote(meta) {
  console.log('\n📤 Syncing to Git...\n');
  
  // Check if there are changes
  const status = runCommand('git status --porcelain py-chatbot/prebuilt/', { 
    silent: true 
  });
  
  if (!status || !status.trim()) {
    console.log('ℹ️  No changes detected. Index already up to date.');
    return false;
  }
  
  console.log('📝 Changes detected:');
  console.log(status);
  
  // Configure git with GitHub email to avoid Vercel check failure
  try {
    // Get current Git config
    const currentEmail = runCommand('git config user.email', { 
      silent: true, 
      ignoreError: true 
    })?.trim();
    
    // Only override if not already set to a real email
    if (!currentEmail || currentEmail.includes('@qlmc.local')) {
      runCommand('git config user.email "doantran28092005@gmail.com"', { 
        silent: true, 
        ignoreError: true 
      });
      runCommand('git config user.name "Trần Phương Đoàn"', { 
        silent: true, 
        ignoreError: true 
      });
      console.log('ℹ️  Git config updated to use GitHub account email');
    }
  } catch (e) {
    // Git config error, use default
    console.warn('⚠️  Could not set Git config, using default');
  }
  
  // Git add
  console.log('\n📝 Adding files to Git...');
  runCommand('git add py-chatbot/prebuilt/faiss.index py-chatbot/prebuilt/meta.json');
  console.log('✅ Files staged');
  
  // Git commit
  const chunks = meta.doc_ids?.length || 0;
  const timestamp = new Date().toISOString().split('T')[0];
  const commitMsg = `chore: Auto-sync FAISS index (${chunks} chunks) - ${timestamp}`;
  
  console.log('\n💾 Committing changes...');
  console.log(`   Message: ${commitMsg}`);
  runCommand(`git commit -m "${commitMsg}"`);
  console.log('✅ Committed');
  
  // Git push
  console.log('\n📤 Pushing to GitHub...');
  runCommand('git push origin main');
  console.log('✅ Pushed to GitHub');
  
  return true;
}

async function main() {
  console.log('🚀 Auto-Sync FAISS Index to Git\n');
  console.log('================================================\n');
  
  try {
    // Step 1: Download from Render
    const meta = await downloadIndex();
    
    // Step 2: Git commit and push
    const pushed = gitSyncToRemote(meta);
    
    console.log('\n================================================');
    console.log('✨ Auto-sync completed successfully!\n');
    
    if (pushed) {
      console.log('✅ Changes pushed to GitHub');
      console.log('⏳ Vercel will auto-deploy in ~2-3 minutes');
      console.log('🔄 Chat API will use new index after deployment');
      console.log('\n📍 Check deployment: https://vercel.com/adminqlmc/qlmc/deployments');
    } else {
      console.log('✅ Index already up to date');
      console.log('ℹ️  No deployment needed');
    }
    
  } catch (error) {
    console.error('\n❌ Auto-sync failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if Render backend is running');
    console.error('   2. Ensure you have trained the AI model first');
    console.error('   3. Check Git credentials are configured');
    console.error('   4. Verify network connection');
    process.exit(1);
  }
}

main();
