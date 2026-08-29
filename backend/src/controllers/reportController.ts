import { Request, Response } from 'express';
import { prisma } from '../index';

export const downloadAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { timetableId, date } = req.query;

    const whereClause: any = { timetableId: String(timetableId) };

    if (date) {
      const targetDate = new Date(String(date));
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: { include: { user: true } },
        timetable: { include: { subject: true, teacher: { include: { user: true } } } }
      },
      orderBy: {
        student: {
          rollNumber: 'asc'
        }
      }
    });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: 'No records found for this class' });
    }

    // Deduplicate records to ensure only one record per student is included (taking the latest update)
    const uniqueRecordsMap: Record<string, any> = {};
    for (const record of attendanceRecords) {
      const studentId = record.studentId;
      if (!uniqueRecordsMap[studentId] || record.updatedAt > uniqueRecordsMap[studentId].updatedAt) {
        uniqueRecordsMap[studentId] = record;
      }
    }
    const uniqueRecords = Object.values(uniqueRecordsMap).sort((a: any, b: any) => 
      a.student.rollNumber.localeCompare(b.student.rollNumber)
    );

    // Generate CSV data directly
    const headers = ['Student Name', 'Roll Number', 'Subject', 'Date', 'Status', 'Teacher'];
    const csvRows = [headers.join(',')];

    for (const record of uniqueRecords) {
      const studentName = `"${record.student.user.firstName} ${record.student.user.lastName}"`;
      const rollNumber = `"${record.student.rollNumber}"`;
      const subject = `"${record.timetable.subject.name}"`;
      const date = `"${record.date.toISOString().split('T')[0]}"`;
      const status = `"${record.status}"`;
      const teacher = `"${record.timetable.teacher.user.firstName} ${record.timetable.teacher.user.lastName}"`;

      csvRows.push([studentName, rollNumber, subject, date, status, teacher].join(','));
    }

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${timetableId}.csv`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
