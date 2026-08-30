import { prisma } from '../index';
import { OtpType } from '@prisma/client';

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveOtp = async (email: string, type: OtpType, validityMinutes: number = 10): Promise<string> => {
  const normalizedEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

  // Delete previous pending OTPs for this email and type
  await prisma.otpVerification.deleteMany({
    where: {
      email: normalizedEmail,
      type,
    },
  });

  // Save new OTP
  await prisma.otpVerification.create({
    data: {
      email: normalizedEmail,
      otp,
      type,
      expiresAt,
    },
  });

  return otp;
};

export const verifyOtp = async (email: string, otp: string, type: OtpType): Promise<boolean> => {
  const normalizedEmail = email.toLowerCase().trim();

  const record = await prisma.otpVerification.findFirst({
    where: {
      email: normalizedEmail,
      otp: otp.trim(),
      type,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!record) {
    return false;
  }

  // Delete verified OTP record so it cannot be reused
  await prisma.otpVerification.delete({
    where: {
      id: record.id,
    },
  });

  return true;
};
