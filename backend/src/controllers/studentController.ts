import { Request, Response } from 'express';
import { prisma } from '../index';
import axios from 'axios';
import FormData from 'form-data';

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const attendance = await prisma.attendance.findMany({
      where: { studentId: studentProfile.id },
      include: { timetable: { include: { subject: true } } }
    });
    
    // Check if face biometric requires an update (older than 30 days)
    const faceEmbedding = await prisma.faceEmbedding.findUnique({ where: { userId } });
    let faceUpdateRequired = true;
    
    if (faceEmbedding) {
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const ageInMs = Date.now() - faceEmbedding.updatedAt.getTime();
      if (ageInMs < thirtyDaysInMs) {
        faceUpdateRequired = false;
      }
    }
    
    res.json({ attendance, faceUpdateRequired, studentProfile });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyEnrollment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const studentProfile = await prisma.studentProfile.findUnique({ 
      where: { userId },
      include: {
        department: true,
        section: {
          include: {
            timetables: {
              include: { subject: true, teacher: { include: { user: true } } }
            }
          }
        }
      }
    });

    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    // Fetch department subjects
    let departmentSubjects: any[] = [];
    if (studentProfile.departmentId) {
      departmentSubjects = await prisma.subject.findMany({
        where: { departmentId: studentProfile.departmentId }
      });
    }

    // Fetch department staff / teachers
    let departmentTeachers: any[] = [];
    if (studentProfile.departmentId) {
      departmentTeachers = await prisma.teacherProfile.findMany({
        where: { departmentId: studentProfile.departmentId, isApproved: true },
        include: { user: true }
      });
    }

    // Fetch classmates in same section
    let classmates: any[] = [];
    if (studentProfile.sectionId) {
      classmates = await prisma.studentProfile.findMany({
        where: { sectionId: studentProfile.sectionId, NOT: { id: studentProfile.id } },
        include: { user: true }
      });
    }

    res.json({ 
      enrolled: !!studentProfile.sectionId, 
      section: studentProfile.section,
      department: studentProfile.department,
      allowSectionChange: studentProfile.allowSectionChange,
      departmentSubjects,
      departmentTeachers,
      classmates
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const joinSection = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sectionCode } = req.body;

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    // Check if the student is already in a section
    if (studentProfile.sectionId) {
      // Enforce lock: cannot change section unless allowed by teacher
      if (!studentProfile.allowSectionChange) {
        return res.status(403).json({ 
          message: 'Class change is locked. You cannot join another class unless your teacher allows it.' 
        });
      }
    }

    const section = await prisma.section.findUnique({ where: { id: sectionCode } });
    if (!section) return res.status(404).json({ message: 'Invalid class code' });

    // Auto-associate with the first department in the system
    const defaultDept = await prisma.department.findFirst();

    await prisma.studentProfile.update({
      where: { userId },
      data: { 
        sectionId: section.id,
        departmentId: defaultDept ? defaultDept.id : undefined,
        allowSectionChange: false // Reset section change permission back to false
      }
    });

    res.json({ message: 'Successfully joined class section', section });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const registerFaceEmbedding = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Forward to Python AI Microservice
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const aiResponse = await axios.post('http://localhost:8000/register-face', formData, {
      headers: { ...formData.getHeaders() },
    });

    const { embedding } = aiResponse.data;

    if (!embedding) {
      return res.status(400).json({ message: 'Failed to extract face embedding' });
    }

    // Save embedding to Database
    await prisma.faceEmbedding.upsert({
      where: { userId },
      update: { embedding },
      create: { userId, embedding }
    });

    // Save uploaded face image as user profilePic Data URL
    const profilePic = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    await prisma.user.update({
      where: { id: userId },
      data: { profilePic }
    });
    
    // Also update student profile status
    const student = await prisma.studentProfile.findUnique({ where: { userId } });
    if (student) {
      await prisma.studentProfile.update({
        where: { userId },
        data: { faceRegistered: true }
      });
    }

    res.json({ message: 'Face registered successfully' });
  } catch (error: any) {
    console.error('Error registering face:', error.message);
    res.status(500).json({ message: error.response?.data?.detail || error.message });
  }
};

export const scanQRRegistration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { token, timetableId } = req.body;

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    // Assuming we have some token validation logic here
    const reg = await prisma.qRRegistration.create({
      data: {
        token,
        studentId: studentProfile.id,
        timetableId,
        expiresAt: new Date(Date.now() + 15 * 60000) // valid for 15 mins
      }
    });

    res.json({ message: 'Class session registered successfully via QR', registration: reg });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
