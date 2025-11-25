/**
 * Script tạo sample learning log data để test UI
 * Chạy: node scripts/create-sample-learning-log.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating sample AI learning logs...');

  // Tạo 5 sample logs trong 5 ngày gần đây
  const now = new Date();
  const logs = [];

  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const totalFeedback = Math.floor(Math.random() * 30) + 10;
    const likeCount = Math.floor(totalFeedback * 0.7);
    const dislikeCount = totalFeedback - likeCount;
    const documentsUpdated = Math.floor(Math.random() * 15) + 5;

    const topQuestions = [
      {
        question: `Làm thế nào để đặt mượn thiết bị? (Ngày ${i + 1})`,
        count: Math.floor(Math.random() * 10) + 5,
        avgScore: (Math.random() * 1.5 - 0.5).toFixed(2),
      },
      {
        question: `Giờ hỗ trợ kỹ thuật là mấy giờ? (Ngày ${i + 1})`,
        count: Math.floor(Math.random() * 8) + 3,
        avgScore: (Math.random() * 1.5 - 0.5).toFixed(2),
      },
      {
        question: `Cách hủy yêu cầu đặt mượn? (Ngày ${i + 1})`,
        count: Math.floor(Math.random() * 7) + 2,
        avgScore: (Math.random() * 1.5 - 0.5).toFixed(2),
      },
    ];

    const improvements = [
      `Processed ${totalFeedback} feedback entries`,
      `Updated scores for ${documentsUpdated} documents`,
      `Identified ${topQuestions.length} frequently asked questions`,
      `Like rate: ${((likeCount / totalFeedback) * 100).toFixed(1)}%`,
    ];

    const log = await prisma.aILearningLog.create({
      data: {
        totalFeedback,
        likeCount,
        dislikeCount,
        documentsUpdated,
        topQuestions: JSON.stringify(topQuestions),
        improvements: JSON.stringify(improvements),
        learningDate: date,
      },
    });

    logs.push(log);
    console.log(`✅ Created log for ${date.toLocaleDateString('vi-VN')}: ${totalFeedback} feedback, ${documentsUpdated} docs updated`);
  }

  console.log(`\n🎉 Successfully created ${logs.length} sample learning logs!`);
  console.log('📊 View them at: /admin/ai-learning-history');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
