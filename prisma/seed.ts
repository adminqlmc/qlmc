import { PrismaClient, Role, ProjectorStatus } from '@prisma/client';
import { hashPassword } from '@/lib/bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Tạo users
  const users = [
    {
      userID: 'QNU0000000',
      fullName: 'Quản trị viên',
      email: 'admin@qlmc.com',
      password: await hashPassword('Admin123!'),
      role: Role.admin,
    },
    {
      userID: 'QNU0000001',
      fullName: 'Nguyễn Văn A',
      email: 'teacher@qlmc.com',
      password: await hashPassword('Teacher123!'),
      role: Role.teacher,
    },
    {
      userID: 'QNU0000002',
      fullName: 'Trần Văn B',
      email: 'technician@qlmc.com',
      password: await hashPassword('Tech123!'),
      role: Role.technician,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { userID: user.userID },
      update: {},
      create: user,
    });
  }
  console.log('✅ Created 3 users (Admin, Teacher, Technician)');

  // MongoDB không hỗ trợ skipDuplicates trong createMany
  // Sử dụng upsert cho từng projector
  const projectors = [
    { 
      serialNumber: 'SN-001',
      name: 'Epson X100', 
      model: 'X100', 
      room: 'Phòng 101',
      building: 'Tòa A', 
      status: ProjectorStatus.available,
      purchaseDate: new Date('2023-01-15'),
      warrantyExpiry: new Date('2026-01-15'),
      timeUsed: 150,
    },
    { 
      serialNumber: 'SN-002',
      name: 'Sony VPL', 
      model: 'VPL-EX', 
      room: 'Phòng 102',
      building: 'Tòa A',
      status: ProjectorStatus.maintenance,
      purchaseDate: new Date('2023-03-20'),
      warrantyExpiry: new Date('2026-03-20'),
      timeUsed: 200,
    },
    { 
      serialNumber: 'SN-003',
      name: 'BenQ MH535', 
      model: 'MH535', 
      room: 'Phòng 201',
      building: 'Tòa B',
      status: ProjectorStatus.available,
      purchaseDate: new Date('2023-06-10'),
      warrantyExpiry: new Date('2026-06-10'),
      timeUsed: 80,
    },
    { 
      serialNumber: 'SN-004',
      name: 'ViewSonic PA503S', 
      model: 'PA503S', 
      room: 'Phòng 202',
      building: 'Tòa B',
      status: ProjectorStatus.available,
      purchaseDate: new Date('2023-09-05'),
      warrantyExpiry: new Date('2026-09-05'),
      timeUsed: 50,
    },
  ];

  for (const projector of projectors) {
    await prisma.projector.upsert({
      where: { serialNumber: projector.serialNumber },
      update: {},
      create: projector,
    });
  }
  console.log('✅ Created 4 projectors');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Default accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 Admin:');
  console.log('   Email: admin@qlmc.com');
  console.log('   Password: Admin123!');
  console.log('   UserID: QNU0000000');
  console.log('');
  console.log('👨‍🏫 Teacher:');
  console.log('   Email: teacher@qlmc.com');
  console.log('   Password: Teacher123!');
  console.log('   UserID: QNU0000001');
  console.log('');
  console.log('🔧 Technician:');
  console.log('   Email: technician@qlmc.com');
  console.log('   Password: Tech123!');
  console.log('   UserID: QNU0000002');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
