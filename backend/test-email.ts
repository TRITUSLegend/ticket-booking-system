import nodemailer from 'nodemailer';
import { env } from './src/config/env';

async function testEmail() {
  console.log('Testing SMTP connection with IPv4 bypass:', env.SMTP_USER);
  const transporter = nodemailer.createTransport({
    host: '142.251.10.108',
    port: 465,
    secure: true,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    logger: true,
    debug: true,
    connectionTimeout: 5000,
    tls: {
      servername: 'smtp.gmail.com',
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"TicketPro Test" <${env.SMTP_USER}>`,
      to: env.SMTP_USER,
      subject: 'Test Email from TicketPro',
      text: 'This is a test email to verify SMTP configuration via IPv4.',
    });
    console.log('Message sent successfully! Message ID:', info.messageId);
  } catch (error: any) {
    console.error('Failed to send email:', error.message);
  } finally {
    process.exit(0);
  }
}

testEmail();
