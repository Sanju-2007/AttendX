import nodemailer from 'nodemailer';

// Configure transporter with robust Gmail / SMTP support
const createTransporter = () => {
  const user = process.env.SMTP_USER || '';
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, ''); // strip any spaces in Google App Password

  if (user.includes('@gmail.com') || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'))) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465' || !process.env.SMTP_PORT,
    auth: {
      user,
      pass,
    },
  });
};

const transporter = createTransporter();


export const sendOtpEmail = async (email: string, otp: string, purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN_2FA' = 'REGISTRATION') => {
  const titles = {
    REGISTRATION: 'Verify Your Email',
    PASSWORD_RESET: 'Reset Your Password',
    LOGIN_2FA: 'Login Verification Code',
  };

  const actionDescriptions = {
    REGISTRATION: 'Thank you for registering with Attendify. Use the verification code below to complete your account setup.',
    PASSWORD_RESET: 'We received a request to reset your password. Use the verification code below to proceed.',
    LOGIN_2FA: 'Use the verification code below to confirm your login attempt.',
  };

  const title = titles[purpose] || 'Your Verification Code';
  const description = actionDescriptions[purpose] || 'Here is your one-time verification code:';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 20px; color: #000000; }
          .container { max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; border: 1px solid #E5E5EA; padding: 36px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; color: #000000; letter-spacing: -0.5px; }
          .dot { display: inline-block; width: 6px; height: 6px; background: #0071E3; border-radius: 50%; margin-left: 2px; }
          .title { font-size: 20px; font-weight: 700; margin-top: 14px; margin-bottom: 8px; color: #000000; }
          .desc { font-size: 14px; color: #6E6E73; line-height: 1.5; margin-bottom: 28px; text-align: center; }
          .otp-card { background: #F5F5F7; border: 1px solid #E5E5EA; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #000000; font-family: monospace; }
          .expiry { font-size: 12px; color: #8E8E93; margin-top: 8px; }
          .footer { font-size: 12px; color: #A1A1A6; text-align: center; margin-top: 24px; border-top: 1px solid #F2F2F7; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Attendify<span class="dot"></span></div>
            <div class="title">${title}</div>
          </div>
          <p class="desc">${description}</p>
          <div class="otp-card">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 10 minutes</div>
          </div>
          <div class="footer">
            If you did not request this code, you can safely ignore this email.<br/>
            &copy; ${new Date().getFullYear()} Attendify Smart Attendance
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"Attendify Security" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: `[${otp}] ${title} - Attendify`,
        html,
      });
      console.log(`[OTP] Email sent to ${email}`);
    } else {
      console.log(`\n=================================================`);
      console.log(`[DEV OTP NOTIFICATION]`);
      console.log(`To: ${email}`);
      console.log(`Type: ${purpose}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`(Set SMTP_USER and SMTP_PASS to send real emails)`);
      console.log(`=================================================\n`);
    }
  } catch (error) {
    console.error('[OTP Mailer Error]:', error);
    // Still output to console so developer can test even if SMTP fails
    console.log(`[FALLBACK OTP CODE]: ${otp} for ${email}`);
  }
};

export const sendLowAttendanceAlert = async (email: string, studentName: string, subjectName: string, percentage: number) => {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const info = await transporter.sendMail({
        from: `"Admin Portal" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

