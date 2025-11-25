/**
 * Script test manual trigger daily AI learning
 * Chạy: node scripts/test-daily-learning.js
 */

const http = require('http');

const API_URL = 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'default-secret-change-me';
const ENDPOINT = '/api/cron/daily-ai-learning';

console.log('🧪 Testing Daily AI Learning...');
console.log(`📍 Endpoint: ${API_URL}${ENDPOINT}`);
console.log(`🔑 Using CRON_SECRET: ${CRON_SECRET}\n`);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: ENDPOINT,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`📡 Status Code: ${res.statusCode}\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📦 Response:');
      console.log(JSON.stringify(response, null, 2));

      if (response.stats) {
        console.log('\n📊 Learning Summary:');
        console.log(`   ✅ Success: ${response.success}`);
        console.log(`   📝 Total Feedback: ${response.stats.totalFeedback}`);
        console.log(`   👍 Like Count: ${response.stats.likeCount}`);
        console.log(`   👎 Dislike Count: ${response.stats.dislikeCount}`);
        console.log(`   📄 Documents Updated: ${response.stats.documentsUpdated}`);
        console.log(`   ❓ Top Questions: ${response.stats.topQuestions?.length || 0}`);
        
        if (response.stats.topQuestions?.length > 0) {
          console.log('\n🔥 Top 3 Questions:');
          response.stats.topQuestions.slice(0, 3).forEach((q, i) => {
            console.log(`   ${i + 1}. "${q.question}" (${q.count} times, score: ${q.avgScore.toFixed(2)})`);
          });
        }
      }

      console.log('\n✅ Test completed!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to parse response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.end();
