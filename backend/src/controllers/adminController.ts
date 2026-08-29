import { Request, Response } from 'express';
import { prisma } from '../index';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalTeachers = await prisma.teacherProfile.count();
    const totalStudents = await prisma.studentProfile.count();
    const totalDepartments = await prisma.department.count();
    const groupedClasses = await prisma.attendance.groupBy({
      by: ['timetableId', 'date']
    });

    res.json({
      totalTeachers,
      totalStudents,
      totalDepartments,
      classesConducted: groupedClasses.length
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminData = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany();
    const subjects = await prisma.subject.findMany({ include: { department: true } });
    const sections = await prisma.section.findMany();
    const inviteTokens = await prisma.teacherInviteToken.findMany({ orderBy: { createdAt: 'desc' } });
    
    // Fetch all approved/active teachers
    const teachers = await prisma.teacherProfile.findMany({
      where: { isApproved: true },
      include: { user: true, department: true }
    });
    
    // Fetch all students
    const students = await prisma.studentProfile.findMany({
      include: { user: true, department: true, section: true }
    });

    // Fetch all timetables with relations
    const timetables = await prisma.timetable.findMany({
      include: {
        teacher: { include: { user: true } },
        subject: true,
        section: true
      }
    });
    
    res.json({ departments, subjects, sections, inviteTokens, teachers, students, timetables });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;
    
    // Restrict to exactly one department
    const existingCount = await prisma.department.count();
    if (existingCount >= 1) {
      return res.status(400).json({ message: 'Only one department is allowed in the system.' });
    }
    
    const department = await prisma.department.create({
      data: { name, code }
    });
    res.status(201).json(department);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await prisma.teacherProfile.findMany({
      where: { isApproved: false },
      include: { 
        user: { include: { faceEmbedding: true } }, 
        department: true 
      }
    });
    res.json(teachers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import crypto from 'crypto';

export const generateTeacherInviteToken = async (req: Request, res: Response) => {
  try {
    const adminUserId = (req as any).user.id;
    const token = crypto.randomBytes(16).toString('hex');
    
    const invite = await prisma.teacherInviteToken.create({
      data: {
        token,
        createdBy: adminUserId
      }
    });

    res.status(201).json({ message: "Teacher invite token generated", token: invite.token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacherProfile.update({
      where: { id },
      data: { isApproved: true }
    });
    res.json(teacher);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name, code, departmentId } = req.body;
    const subject = await prisma.subject.create({
      data: { name, code, departmentId }
    });
    res.status(201).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSection = async (req: Request, res: Response) => {
  try {
    const { name, year } = req.body;
    const section = await prisma.section.create({
      data: { name, year }
    });
    res.status(201).json(section);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignTimetable = async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, startTime, endTime, teacherId, subjectId, sectionId } = req.body;
    const timetable = await prisma.timetable.create({
      data: { dayOfWeek: parseInt(dayOfWeek), startTime, endTime, teacherId, subjectId, sectionId }
    });
    res.status(201).json(timetable);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTimetable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.timetable.delete({
      where: { id }
    });
    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find all timetable slots for this subject
    const timetables = await prisma.timetable.findMany({
      where: { subjectId: id }
    });
    
    const timetableIds = timetables.map(t => t.id);
    
    // Delete in order of dependency to prevent foreign key errors
    await prisma.$transaction([
      prisma.attendance.deleteMany({
        where: { timetableId: { in: timetableIds } }
      }),
      prisma.qRRegistration.deleteMany({
        where: { timetableId: { in: timetableIds } }
      }),
      prisma.timetable.deleteMany({
        where: { id: { in: timetableIds } }
      }),
      prisma.subject.delete({
        where: { id }
      })
    ]);

    res.json({ message: 'Subject and related schedule slots deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find all timetable slots for this section
    const timetables = await prisma.timetable.findMany({
      where: { sectionId: id }
    });
    
    const timetableIds = timetables.map(t => t.id);
    
    // Delete related records and disassociate students to prevent foreign key errors
    await prisma.$transaction([
      prisma.attendance.deleteMany({
        where: { timetableId: { in: timetableIds } }
      }),
      prisma.qRRegistration.deleteMany({
        where: { timetableId: { in: timetableIds } }
      }),
      prisma.timetable.deleteMany({
        where: { id: { in: timetableIds } }
      }),
      prisma.studentProfile.updateMany({
        where: { sectionId: id },
        data: { sectionId: null }
      }),
      prisma.section.delete({
        where: { id }
      })
    ]);

    res.json({ message: 'Section and related schedule slots deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
