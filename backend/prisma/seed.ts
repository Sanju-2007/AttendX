import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function generateAvatar(firstName: string, lastName: string, bgColor: string) {
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="20" fill="${bgColor}"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="system-ui, sans-serif" font-weight="bold" fill="white">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function main() {
  console.log('Clearing database...');
  
  // Safe delete order to respect foreign key constraints
  await prisma.attendance.deleteMany();
  await prisma.qRRegistration.deleteMany();
  await prisma.faceEmbedding.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.section.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.teacherInviteToken.deleteMany();

  console.log('Seeding database...');

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@attendify.com',
      passwordHash,
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Admin',
      profilePic: generateAvatar('System', 'Admin', '#1E293B'),
      adminProfile: {
        create: {}
      }
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // 2. Create Department & Subjects
  const dept = await prisma.department.create({
    data: {
      name: 'Computer Science',
      code: 'CS',
      subjects: {
        create: [
          { name: 'Data Structures', code: 'CS101' },
          { name: 'Algorithms', code: 'CS102' }
        ]
      }
    }
  });
  console.log(`Created department: ${dept.name}`);

  // 3. Create Teacher
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@attendify.com',
      passwordHash,
      role: 'TEACHER',
      firstName: 'John',
      lastName: 'Doe',
      profilePic: generateAvatar('John', 'Doe', '#8B5CF6'),
      teacherProfile: {
        create: {
          departmentId: dept.id,
          isApproved: true,
          faceRegistered: false,
        }
      }
    },
    include: {
      teacherProfile: true
    }
  });
  console.log(`Created teacher: ${teacher.email}`);

  const teacherProfileId = teacher.teacherProfile?.id;
  if (!teacherProfileId) {
    throw new Error('Failed to create teacher profile during seeding');
  }

  // 4. Create Section
  const section = await prisma.section.create({
    data: { name: 'CS-A', year: 1 }
  });
  console.log(`Created section: ${section.name}`);

  // 5. Create 20 Students with unique SVG avatars
  const studentsData = [
    { email: 'student1@attendify.com', firstName: 'Alex', lastName: 'Johnson', rollNumber: 'CS2024001' },
    { email: 'student2@attendify.com', firstName: 'Brian', lastName: 'Miller', rollNumber: 'CS2024002' },
    { email: 'student3@attendify.com', firstName: 'Catherine', lastName: 'Davis', rollNumber: 'CS2024003' },
    { email: 'student4@attendify.com', firstName: 'Daniel', lastName: 'Garcia', rollNumber: 'CS2024004' },
    { email: 'student5@attendify.com', firstName: 'Emily', lastName: 'Rodriguez', rollNumber: 'CS2024005' },
    { email: 'student6@attendify.com', firstName: 'Frank', lastName: 'Wilson', rollNumber: 'CS2024006' },
    { email: 'student7@attendify.com', firstName: 'Grace', lastName: 'Martinez', rollNumber: 'CS2024007' },
    { email: 'student8@attendify.com', firstName: 'Henry', lastName: 'Anderson', rollNumber: 'CS2024008' },
    { email: 'student9@attendify.com', firstName: 'Isabella', lastName: 'Taylor', rollNumber: 'CS2024009' },
    { email: 'student10@attendify.com', firstName: 'Jack', lastName: 'Thomas', rollNumber: 'CS2024010' },
    { email: 'student11@attendify.com', firstName: 'Kate', lastName: 'White', rollNumber: 'CS2024011' },
    { email: 'student12@attendify.com', firstName: 'Luke', lastName: 'Harris', rollNumber: 'CS2024012' },
    { email: 'student13@attendify.com', firstName: 'Mason', lastName: 'Martin', rollNumber: 'CS2024013' },
    { email: 'student14@attendify.com', firstName: 'Nancy', lastName: 'Thompson', rollNumber: 'CS2024014' },
    { email: 'student15@attendify.com', firstName: 'Oliver', lastName: 'Garcia', rollNumber: 'CS2024015' },
    { email: 'student16@attendify.com', firstName: 'Patricia', lastName: 'Martinez', rollNumber: 'CS2024016' },
    { email: 'student17@attendify.com', firstName: 'Quinn', lastName: 'Robinson', rollNumber: 'CS2024017' },
    { email: 'student18@attendify.com', firstName: 'Rachel', lastName: 'Clark', rollNumber: 'CS2024018' },
    { email: 'student19@attendify.com', firstName: 'Samuel', lastName: 'Rodriguez', rollNumber: 'CS2024019' },
    { email: 'student20@attendify.com', firstName: 'Tina', lastName: 'Lewis', rollNumber: 'CS2024020' },
  ];

  const colors = ['#EC4899', '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#14B8A6', '#6366F1'];

  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];
    const bgColor = colors[i % colors.length];
    const student = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash,
        role: 'STUDENT',
        firstName: s.firstName,
        lastName: s.lastName,
        profilePic: generateAvatar(s.firstName, s.lastName, bgColor),
        studentProfile: {
          create: {
            rollNumber: s.rollNumber,
            departmentId: dept.id,
            sectionId: section.id,
            year: 1,
            faceRegistered: false,
          }
        }
      }
    });
    console.log(`Created student: ${student.email} (${s.rollNumber})`);
  }

  // 6. Create Timetable Slot for the teacher
  const subject = await prisma.subject.findFirst({ where: { code: 'CS101' } });
  if (subject) {
    await prisma.timetable.create({
      data: {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:00',
        teacherId: teacherProfileId,
        subjectId: subject.id,
        sectionId: section.id
      }
    });
    console.log(`Created default timetable slot for CS101`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
