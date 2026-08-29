import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Attendify database backup...');
  
  try {
    const backupData: any = {};
    
    // Fetch all records from all tables
    backupData.users = await prisma.user.findMany();
    backupData.adminProfiles = await prisma.adminProfile.findMany();
    backupData.teacherProfiles = await prisma.teacherProfile.findMany();
    backupData.studentProfiles = await prisma.studentProfile.findMany();
    backupData.departments = await prisma.department.findMany();
    backupData.subjects = await prisma.subject.findMany();
    backupData.sections = await prisma.section.findMany();
    backupData.timetables = await prisma.timetable.findMany();
    backupData.faceEmbeddings = await prisma.faceEmbedding.findMany();
    backupData.teacherInviteTokens = await prisma.teacherInviteToken.findMany();
    backupData.attendances = await prisma.attendance.findMany();
    backupData.qrRegistrations = await prisma.qRRegistration.findMany();

    // Log counts
    console.log('\n--- Records Retrieved ---');
    console.log(`Users: ${backupData.users.length}`);
    console.log(`Admin Profiles: ${backupData.adminProfiles.length}`);
    console.log(`Teacher Profiles: ${backupData.teacherProfiles.length}`);
    console.log(`Student Profiles: ${backupData.studentProfiles.length}`);
    console.log(`Departments: ${backupData.departments.length}`);
    console.log(`Subjects: ${backupData.subjects.length}`);
    console.log(`Sections: ${backupData.sections.length}`);
    console.log(`Timetables: ${backupData.timetables.length}`);
    console.log(`Face Embeddings: ${backupData.faceEmbeddings.length}`);
    console.log(`Teacher Invite Tokens: ${backupData.teacherInviteTokens.length}`);
    console.log(`Attendances: ${backupData.attendances.length}`);
    console.log(`QR Registrations: ${backupData.qrRegistrations.length}`);

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsDir, `backup_${timestamp}.json`);

    // Write backup file (handling Dates and JSON serialization)
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    console.log(`\nSuccess! Database backup saved to:`);
    console.log(backupPath);
  } catch (error: any) {
    console.error('Backup failed:', error.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
