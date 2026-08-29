import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';
import axios from 'axios';
import FormData from 'form-data';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, inviteToken, ...profileData } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'TEACHER') {
      if (!inviteToken) {
        return res.status(400).json({ message: 'Teacher registration requires an invite token' });
      }
      const validToken = await prisma.teacherInviteToken.findUnique({ where: { token: inviteToken } });
      if (!validToken || validToken.used) {
        return res.status(400).json({ message: 'Invalid or already used invite token' });
      }
      // Mark token as used
      await prisma.teacherInviteToken.update({ where: { token: inviteToken }, data: { used: true } });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
      },
    });

    // Create role-specific profile
    if (role === 'ADMIN') {
      await prisma.adminProfile.create({ data: { userId: user.id } });
    } else if (role === 'TEACHER') {
      await prisma.teacherProfile.create({
        data: { userId: user.id, departmentId: profileData.departmentId },
      });
    } else if (role === 'STUDENT') {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          rollNumber: profileData.rollNumber,
          departmentId: profileData.departmentId,
          sectionId: profileData.sectionId,
          year: profileData.year ? parseInt(profileData.year) : 1, // Default to year 1 if not provided
        },
      });
    }

    const token = generateToken(user.id, user.role);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const token = generateToken(user.id, user.role);

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const registerFace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
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

    // Create or update face embedding attached directly to User
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

    // Update role specific profiles
    if (userRole === 'STUDENT') {
      await prisma.studentProfile.update({
        where: { userId },
        data: { faceRegistered: true }
      });
    } else if (userRole === 'TEACHER') {
      await prisma.teacherProfile.update({
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

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePic: true,
        studentProfile: {
          select: {
            rollNumber: true,
            year: true,
            allowSectionChange: true,
            section: {
              select: {
                id: true,
                name: true,
                year: true,
              }
            },
            department: {
              select: {
                name: true,
                code: true
              }
            }
          }
        },
        teacherProfile: {
          select: {
            department: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { firstName, lastName, email, password } = req.body;

    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email is already in use by another user.' });
      }
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

