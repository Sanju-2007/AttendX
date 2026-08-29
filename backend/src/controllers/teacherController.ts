import { Request, Response } from 'express';
import { prisma } from '../index';
import crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';
import { sendLowAttendanceAlert } from '../utils/mailer';

export const getTeacherData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const teacherProfile = await prisma.teacherProfile.findUnique({ 
      where: { userId },
      include: { department: true }
    });
    
    if (!teacherProfile) return res.status(404).json({ message: 'Teacher profile not found' });

    // Fetch teacher's timetables
    const timetables = await prisma.timetable.findMany({
      where: { teacherId: teacherProfile.id },
      include: { subject: true, section: true }
    });
    
    // Fetch available subjects and sections for them to create new slots
    const subjects = await prisma.subject.findMany();
    const sections = await prisma.section.findMany();

    // Fetch teachers in the same department
    let departmentTeachers: any[] = [];
    if (teacherProfile.departmentId) {
      departmentTeachers = await prisma.teacherProfile.findMany({
        where: { departmentId: teacherProfile.departmentId, isApproved: true },
        include: { user: true }
      });
    }

    // Fetch students in the same department
    let departmentStudents: any[] = [];
    if (teacherProfile.departmentId) {
      departmentStudents = await prisma.studentProfile.findMany({
        where: { departmentId: teacherProfile.departmentId },
        include: { user: true, section: true }
      });
    }

    // Fetch subjects in the same department
    let departmentSubjects: any[] = [];
    if (teacherProfile.departmentId) {
      departmentSubjects = await prisma.subject.findMany({
        where: { departmentId: teacherProfile.departmentId }
      });
    }
    
    res.json({ 
      timetables, 
      subjects, 
      sections, 
      teacherId: teacherProfile.id,
      department: teacherProfile.department,
      departmentTeachers,
      departmentStudents,
      departmentSubjects
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTimetable = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { subjectId, sectionId, dayOfWeek, startTime, endTime } = req.body;
    
    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId } });
    if (!teacherProfile) return res.status(404).json({ message: 'Teacher profile not found' });

    const newTimetable = await prisma.timetable.create({
      data: {
        teacherId: teacherProfile.id,
        subjectId,
        sectionId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime
      },
      include: { subject: true, section: true }
    });

    res.status(201).json(newTimetable);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTimetable = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId } });
    
    if (!teacherProfile) return res.status(404).json({ message: 'Teacher profile not found' });

    const timetables = await prisma.timetable.findMany({
      where: { teacherId: teacherProfile.id },
      include: { subject: true, section: true }
    });
    
    res.json(timetables);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const generateQR = async (req: Request, res: Response) => {
  try {
    const { timetableId, expiresInMinutes } = req.body;
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);

    // This creates a global QR for the class session, we can store it or just return the token
    // For specific student registration, we can just return a token mapped to the timetable
    res.json({ token, expiresAt, timetableId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const saveAttendance = async (req: Request, res: Response) => {
  try {
    const { timetableId, date } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Classroom image file is required' });
    }

    const timetable = await prisma.timetable.findUnique({
      where: { id: timetableId },
      include: {
        section: {
          include: {
            students: {
              include: {
                user: true
              }
            }
          }
        },
        subject: true
      }
    });

    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });

    const allStudents = timetable.section.students;
    
    // Fetch registered embeddings for all students in this section
    const embeddingsMap: Record<string, number[]> = {};
    for (const student of allStudents) {
      const faceData = await prisma.faceEmbedding.findUnique({ where: { userId: student.userId } });
      if (faceData) {
        embeddingsMap[student.id] = faceData.embedding as unknown as number[];
      }
    }



    // Forward image and embeddings to AI service
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append('embeddings', JSON.stringify(embeddingsMap));

    const aiResponse = await axios.post('http://localhost:8000/process-attendance', formData, {
      headers: { ...formData.getHeaders() },
    });

    const targetDate = new Date(date);
    const normalizedDate = new Date(targetDate.setHours(0, 0, 0, 0));

    const recognizedStudentIds: string[] = aiResponse.data.recognized_student_ids || [];
    const attendanceRecords = [];

    for (const student of allStudents) {
      const isPresent = recognizedStudentIds.includes(student.id);
      
      const record = await prisma.attendance.upsert({
        where: {
          studentId_timetableId_date: {
            studentId: student.id,
            timetableId,
            date: normalizedDate
          }
        },
        update: {
          status: isPresent ? 'PRESENT' : 'ABSENT',
          confidence: isPresent ? 0.95 : null // AI could return actual confidence in the future
        },
        create: {
          studentId: student.id,
          timetableId,
          date: normalizedDate,
          status: isPresent ? 'PRESENT' : 'ABSENT',
          confidence: isPresent ? 0.95 : null
        }
      });
      attendanceRecords.push(record);

      // Calculate subject-specific attendance percentage for this student
      const totalSubjectAttendances = await prisma.attendance.count({
        where: {
          studentId: student.id,
          timetable: {
            subjectId: timetable.subjectId
          }
        }
      });

      const presentSubjectAttendances = await prisma.attendance.count({
        where: {
          studentId: student.id,
          timetable: {
            subjectId: timetable.subjectId
          },
          status: 'PRESENT'
        }
      });

      const attendancePercentage = totalSubjectAttendances === 0 ? 100 : Math.round((presentSubjectAttendances / totalSubjectAttendances) * 100);

      // Send email alert if attendance percentage falls below 75%
      if (attendancePercentage < 75) {
        const studentName = `${student.user.firstName} ${student.user.lastName}`;
        const email = student.user.email;
        const subjectName = timetable.subject.name;

        sendLowAttendanceAlert(email, studentName, subjectName, attendancePercentage).catch(err => {
          console.error(`Failed to send low attendance email to ${email}:`, err);
        });
      }
    }

    const recognizedStudents = allStudents
      .filter(s => recognizedStudentIds.includes(s.id))
      .map(s => ({
        id: s.id,
        rollNumber: s.rollNumber,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        email: s.user.email
      }))
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    // Fetch fully populated attendance records for this scan
    const populatedRecords = await prisma.attendance.findMany({
      where: {
        timetableId,
        date: normalizedDate
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        student: {
          rollNumber: 'asc'
        }
      }
    });

    // Deduplicate records just in case pre-existing duplicates exist
    const uniquePopulatedMap: Record<string, any> = {};
    for (const record of populatedRecords) {
      const studentId = record.studentId;
      if (!uniquePopulatedMap[studentId] || record.updatedAt > uniquePopulatedMap[studentId].updatedAt) {
        uniquePopulatedMap[studentId] = record;
      }
    }
    const uniquePopulatedRecords = Object.values(uniquePopulatedMap).sort((a: any, b: any) => 
      a.student.rollNumber.localeCompare(b.student.rollNumber)
    );

    res.json({ 
      message: 'Attendance saved successfully', 
      detected_faces_count: aiResponse.data.detected_faces_count,
      recognized_count: recognizedStudentIds.length,
      unknown_count: Math.max(0, aiResponse.data.detected_faces_count - recognizedStudentIds.length),
      recognized_students: recognizedStudents,
      attendanceRecords: uniquePopulatedRecords 
    });
  } catch (error: any) {
    console.error('Error processing attendance:', error.message);
    res.status(500).json({ message: error.response?.data?.detail || error.message });
  }
};

export const updateManualAttendance = async (req: Request, res: Response) => {
  try {
    const { attendanceId, status, remarks } = req.body;
    
    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { status, remarks, isManual: true }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const allowStudentSectionChange = async (req: Request, res: Response) => {
  try {
    const { studentId, allow } = req.body;
    
    const updated = await prisma.studentProfile.update({
      where: { id: studentId },
      data: { allowSectionChange: allow }
    });

    res.json({ message: 'Successfully updated section change permission.', student: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
