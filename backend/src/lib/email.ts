import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { generateQrCode } from './qr';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Use standard host in production
  port: 465,
  secure: true,
  family: 4, // Force IPv4 to bypass Render's broken IPv6 network routes
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  tls: {
    servername: 'smtp.gmail.com', // Required for TLS certificate validation
  }
});

interface BookingEmailParams {
  to: string;
  customerName: string;
  eventTitle: string;
  showDate: string;
  showTime: string;
  venueName: string;
  seats: string[];
  totalAmount: string;
  qrReference: string;
  bookingId: string;
}

/**
 * Send a booking confirmation email with an embedded QR code.
 * Returns true on success, false on failure (never throws — booking
 * should not be rolled back due to email provider issues).
 */
export async function sendBookingConfirmation(params: BookingEmailParams): Promise<boolean> {
  try {
    const qrBuffer = await generateQrCode(params.qrReference);

    await transporter.sendMail({
      from: `"TicketPro" <${env.SMTP_USER}>`,
      to: params.to,
      subject: `Booking Confirmed — ${params.eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Booking Confirmed! 🎉</h1>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin: 16px 0;">
            <h2 style="margin-top: 0; color: #16213e;">${params.eventTitle}</h2>
            <p><strong>Date:</strong> ${params.showDate}</p>
            <p><strong>Time:</strong> ${params.showTime}</p>
            <p><strong>Venue:</strong> ${params.venueName}</p>
            <p><strong>Seats:</strong> ${params.seats.join(', ')}</p>
            <p><strong>Total:</strong> ₹${params.totalAmount}</p>
            <p><strong>Booking ID:</strong> ${params.bookingId}</p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <p style="color: #666;">Show this QR code at the venue:</p>
            <img src="cid:qrcode" alt="Booking QR Code" style="width: 200px; height: 200px;" />
          </div>
          <p style="color: #999; font-size: 12px;">
            Reference: ${params.qrReference}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrBuffer,
          contentType: 'image/png',
          cid: 'qrcode', // same cid value as in the html img src
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    return false;
  }
}

interface WaitlistOfferEmailParams {
  to: string;
  customerName: string;
  eventTitle: string;
  showDate: string;
  showTime: string;
  venueName: string;
  category: string;
  offerExpiresAt: string;
  offerLink: string;
}

/**
 * Send a waitlist offer email with a signed time-limited checkout link.
 */
export async function sendWaitlistOfferEmail(params: WaitlistOfferEmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"TicketPro Waitlist" <${env.SMTP_USER}>`,
      to: params.to,
      subject: `A seat is available! — ${params.eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Good News! 🎶</h1>
          <p>A <strong>${params.category}</strong> seat has become available for:</p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin: 16px 0;">
            <h2 style="margin-top: 0; color: #16213e;">${params.eventTitle}</h2>
            <p><strong>Date:</strong> ${params.showDate}</p>
            <p><strong>Time:</strong> ${params.showTime}</p>
            <p><strong>Venue:</strong> ${params.venueName}</p>
          </div>
          <p>This offer expires at <strong>${params.offerExpiresAt}</strong>.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${params.offerLink}" 
               style="background: #e94560; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Complete Your Booking
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            If you no longer need this seat, you can ignore this email and the offer will expire automatically.
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Failed to send waitlist offer email:', error);
    return false;
  }
}

interface CancellationEmailParams {
  to: string;
  customerName: string;
  eventTitle: string;
}

/**
 * Send an event cancellation email.
 */
export async function sendCancellationEmail(params: CancellationEmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"TicketPro Updates" <${env.SMTP_USER}>`,
      to: params.to,
      subject: `Event Cancelled — ${params.eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e94560;">Event Cancelled</h1>
          <p>Hi ${params.customerName},</p>
          <p>We are writing to inform you that <strong>${params.eventTitle}</strong> has been cancelled by the organiser.</p>
          <p>Any bookings you had for this event are now void. If you made any payments, they will be automatically refunded to your original payment method within 5-7 business days.</p>
          <p>We apologize for the inconvenience.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
    return false;
  }
}
