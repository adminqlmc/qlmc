/**
 * Daily AI Learning Scheduler
 * 
 * Script để chạy tự động hàng ngày vào 00:00 (24h)
 * Sử dụng node-cron để scheduling
 * 
 * Cách chạy:
 * 1. npm install node-cron
 * 2. node scripts/daily-ai-learning.js
 * 
 * Hoặc thêm vào package.json scripts:
 * "ai-learning": "node scripts/daily-ai-learning.js"
 */

const cron = require('node-cron');
const https = require('https');
const http = require('http');

// Cấu hình
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'default-secret-change-me';
const ENDPOINT = '/api/cron/daily-ai-learning';

// Hàm gọi API
function triggerDailyLearning() {
  const url = new URL(ENDPOINT, API_URL);
  const protocol = url.protocol === 'https:' ? https : http;

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
  };

  console.log(`\n🤖 [${new Date().toISOString()}] Triggering daily AI learning...`);

  const req = protocol.request(url, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Response:', JSON.stringify(response, null, 2));
        
        if (response.stats) {
          console.log('\n📊 Learning Stats:');
          console.log(`   - Total Feedback: ${response.stats.totalFeedback}`);
          console.log(`   - Like Count: ${response.stats.likeCount}`);
          console.log(`   - Dislike Count: ${response.stats.dislikeCount}`);
          console.log(`   - Documents Updated: ${response.stats.documentsUpdated}`);
          console.log(`   - Top Questions: ${response.stats.topQuestions?.length || 0}`);
        }
      } catch (error) {
        console.error('❌ Failed to parse response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.end();
}

// Chạy ngay khi start (để test)
console.log('🚀 Daily AI Learning Scheduler Started');
console.log(`📅 Schedule: Every day at 00:00 (24h)`);
console.log(`🔗 API: ${API_URL}${ENDPOINT}`);
console.log('\n⏰ Running initial test...');
triggerDailyLearning();

// Schedule: Chạy hàng ngày vào 00:00 (24h)
// Cron format: second minute hour day month weekday
// '0 0 * * *' = 00:00 mỗi ngày
cron.schedule('0 0 * * *', () => {
  triggerDailyLearning();
}, {
  timezone: 'Asia/Ho_Chi_Minh' // Múi giờ Việt Nam
});

console.log('\n✅ Scheduler is running. Press Ctrl+C to stop.');

// Để test nhanh hơn, uncomment dòng dưới (chạy mỗi phút)
// cron.schedule('* * * * *', triggerDailyLearning);
