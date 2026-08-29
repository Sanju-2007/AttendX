import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to recursively parse date strings back to Date objects
function parseDates(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(parseDates);
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string' && (key.endsWith('At') || key === 'date')) {
        newObj[key] = new Date(val);
      } else {
        newObj[key] = parseDates(val);
      }
    }
    return newObj;
  }
  return obj;
}

async function main() {
  const args = process.argv.slice(2);
  const backupFileArg = args[0];

  if (!backupFileArg) {
    console.error('Error: Please provide a backup JSON file path relative to backend root.');
    console.error('Example: npx ts-node src/restore.ts backups/backup_2026-06-10T06-41-02-526Z.json');
    process.exit(1);
  }

  const backupPath = path.resolve(process.cwd(), backupFileArg);
  if (!fs.existsSync(backupPath)) {
    console.error(`Error: Backup file not found at ${backupPath}`);
    process.exit(1);
  }

  console.log(`Reading backup file from: ${backupPath}...`);
  const rawData = fs.readFileSync(backupPath, 'utf-8');
  const backupData = parseDates(JSON.parse(rawData));

  console.log('Restoring data inside a transaction...');

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all in reverse dependency order
      console.log('Clearing old data in reverse dependency order...');
      
      await tx.attendance.deleteMany();
      await tx.qRRegistration.deleteMany();
      await tx.timetable.deleteMany();
      await tx.faceEmbedding.deleteMany();
      await tx.studentProfile.deleteMany();
      await tx.teacherProfile.deleteMany();
      await tx.adminProfile.deleteMany();
      await tx.subject.deleteMany();
      await tx.section.deleteMany();
      await tx.department.deleteMany();
      await tx.user.deleteMany();
      await tx.teacherInviteToken.deleteMany();

      console.log('Inserting restored data in dependency order...');

      // 2. Insert in dependency order
      if (backupData.users && backupData.users.length > 0) {
        await tx.user.createMany({ data: backupData.users });
      }
      if (backupData.departments && backupData.departments.length > 0) {
        await tx.department.createMany({ data: backupData.departments });
      }
      if (backupData.sections && backupData.sections.length > 0) {
        await tx.section.createMany({ data: backupData.sections });
      }
      if (backupData.subjects && backupData.subjects.length > 0) {
        await tx.subject.createMany({ data: backupData.subjects });
      }
      if (backupData.adminProfiles && backupData.adminProfiles.length > 0) {
        await tx.adminProfile.createMany({ data: backupData.adminProfiles });
      }
      if (backupData.teacherProfiles && backupData.teacherProfiles.length > 0) {
        await tx.teacherProfile.createMany({ data: backupData.teacherProfiles });
      }
      if (backupData.studentProfiles && backupData.studentProfiles.length > 0) {
        await tx.studentProfile.createMany({ data: backupData.studentProfiles });
      }
      if (backupData.faceEmbeddings && backupData.faceEmbeddings.length > 0) {
        await tx.faceEmbedding.createMany({ data: backupData.faceEmbeddings });
      }
      if (backupData.timetables && backupData.timetables.length > 0) {
        await tx.timetable.createMany({ data: backupData.timetables });
      }
      if (backupData.attendances && backupData.attendances.length > 0) {
        await tx.attendance.createMany({ data: backupData.attendances });
      }
      if (backupData.qrRegistrations && backupData.qrRegistrations.length > 0) {
        await tx.qRRegistration.createMany({ data: backupData.qrRegistrations });
      }
      if (backupData.teacherInviteTokens && backupData.teacherInviteTokens.length > 0) {
        await tx.teacherInviteToken.createMany({ data: backupData.teacherInviteTokens });
      }
    }, { timeout: 30000 });

    console.log('\n--- Restore completed successfully! ---');
    console.log(`Users: ${backupData.users?.length || 0}`);
    console.log(`Admin Profiles: ${backupData.adminProfiles?.length || 0}`);
    console.log(`Teacher Profiles: ${backupData.teacherProfiles?.length || 0}`);
    console.log(`Student Profiles: ${backupData.studentProfiles?.length || 0}`);
    console.log(`Departments: ${backupData.departments?.length || 0}`);
    console.log(`Subjects: ${backupData.subjects?.length || 0}`);
    console.log(`Sections: ${backupData.sections?.length || 0}`);
    console.log(`Timetables: ${backupData.timetables?.length || 0}`);
    console.log(`Face Embeddings: ${backupData.faceEmbeddings?.length || 0}`);
    console.log(`Attendances: ${backupData.attendances?.length || 0}`);
    console.log(`QR Registrations: ${backupData.qrRegistrations?.length || 0}`);
    console.log(`Teacher Invite Tokens: ${backupData.teacherInviteTokens?.length || 0}`);

  } catch (error: any) {
    console.error('Restore failed and was rolled back:', error.message || error);
    process.exit(1);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
