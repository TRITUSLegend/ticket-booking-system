import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Generate a non-guessable HMAC-SHA256 reference from a booking ID.
 * The result is a URL-safe base64 string, truncated to 16 characters
 * for compactness while retaining collision resistance for this use case.
 */
export function generateQrReference(bookingId: string): string {
  const hmac = crypto.createHmac('sha256', env.HMAC_SECRET);
  hmac.update(bookingId);
  return hmac.digest('base64url').substring(0, 16);
}

/**
 * Verify that a QR reference matches the given booking ID.
 */
export function verifyQrReference(bookingId: string, reference: string): boolean {
  const expected = generateQrReference(bookingId);
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(reference)
  );
}

/**
 * Generate a signed token for waitlist offer links.
 * Encodes waitlistId and expiresAt into a tamper-proof URL parameter.
 */
export function signWaitlistOffer(waitlistId: string, expiresAt: Date): string {
  const payload = `${waitlistId}:${expiresAt.getTime()}`;
  const hmac = crypto.createHmac('sha256', env.HMAC_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('base64url');
  const data = Buffer.from(payload).toString('base64url');
  return `${data}.${signature}`;
}

/**
 * Verify and decode a signed waitlist offer token.
 * Returns the waitlistId if valid and not expired, null otherwise.
 */
export function verifyWaitlistOffer(token: string): { waitlistId: string; expiresAt: Date } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  const payload = Buffer.from(data, 'base64url').toString();
  const [waitlistId, expiresAtMs] = payload.split(':');

  if (!waitlistId || !expiresAtMs) return null;

  const hmac = crypto.createHmac('sha256', env.HMAC_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64url');

  const signaturesMatch = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!signaturesMatch) return null;

  const expiresAt = new Date(parseInt(expiresAtMs, 10));
  if (expiresAt <= new Date()) return null;

  return { waitlistId, expiresAt };
}
