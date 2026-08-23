import { env } from '../config/env';
import { generateQrCode } from './qr';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendBrevoEmail(subject: string, to: string, htmlContent: string, attachment?: { content: string, name: string }): Promise<boolean> {
  if (!env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY is not set. Skipping email send.');
    return false;
  }

  try {
    const payload: any = {
      sender: { name: 'TicketPro', email: env.SMTP_USER },
      to: [{ email: to }],
      subject,
      htmlContent,
    };

    if (attachment) {
      payload.attachment = [attachment];
    }

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[email] Brevo API Error (${response.status}):`, errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[email] Failed to send email via Brevo:', error);
    return false;
  }
}

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

export async function sendBookingConfirmation(params: BookingEmailParams): Promise<boolean> {
  const qrBuffer = await generateQrCode(params.qrReference);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">Booking Confirmed! &#127881;</h1>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin: 16px 0;">
        <h2 style="margin-top: 0; color: #16213e;">${params.eventTitle}</h2>
        <p><strong>Date:</strong> ${params.showDate}</p>
        <p><strong>Time:</strong> ${params.showTime}</p>
        <p><strong>Venue:</strong> ${params.venueName}</p>
        <p><strong>Seats:</strong> ${params.seats.join(', ')}</p>
        <p><strong>Total:</strong> &#8377;${params.totalAmount}</p>
        <p><strong>Booking ID:</strong> ${params.bookingId}</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <p style="color: #666;">Your QR code is attached to this email. Show it at the venue entrance.</p>
      </div>
      <p style="color: #999; font-size: 12px;">Reference: ${params.qrReference}</p>
    </div>
  `;

  return sendBrevoEmail(
    `Booking Confirmed - ${params.eventTitle}`,
    params.to,
    html,
    { content: qrBuffer.toString('base64'), name: 'qrcode.png' }
  );
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

export async function sendWaitlistOfferEmail(params: WaitlistOfferEmailParams): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">Good News! &#127881;</h1>
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
  `;

  return sendBrevoEmail(
    `A seat is available! - ${params.eventTitle}`,
    params.to,
    html
  );
}

interface CancellationEmailParams {
  to: string;
  customerName: string;
  eventTitle: string;
}

export async function sendCancellationEmail(params: CancellationEmailParams): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #e94560;">Event Cancelled</h1>
      <p>Hi ${params.customerName},</p>
      <p>We are writing to inform you that <strong>${params.eventTitle}</strong> has been cancelled by the organiser.</p>
      <p>Any bookings you had for this event are now void. If you made any payments, they will be automatically refunded to your original payment method within 5-7 business days.</p>
      <p>We apologize for the inconvenience.</p>
    </div>
  `;

  return sendBrevoEmail(
    `Event Cancelled - ${params.eventTitle}`,
    params.to,
    html
  );
}
