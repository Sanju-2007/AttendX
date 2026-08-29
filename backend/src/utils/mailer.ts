import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || 'test_user',
    pass: process.env.SMTP_PASS || 'test_pass',
  },
});

export const sendLowAttendanceAlert = async (email: string, studentName: string, subjectName: string, percentage: number) => {
  try {
    const info = await transporter.sendMail({
      from: '"Admin Portal" <admin@university.edu>',
      to: email,
      subject: `Low Attendance Alert - ${subjectName}`,
      html: `
        <h2>Attendance Warning</h2>
        <p>Dear ${studentName},</p>
        <p>Your attendance for <strong>${subjectName}</strong> has dropped to <strong>${percentage}%</strong>, which is below the mandatory 75% threshold.</p>
        <p>Please ensure you attend upcoming classes to avoid academic penalties.</p>
        <br/>
        <p>Regards,<br/>University Administration</p>
      `,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
