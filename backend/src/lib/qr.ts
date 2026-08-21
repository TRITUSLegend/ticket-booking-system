import QRCode from 'qrcode';

/**
 * Generate a QR code as a PNG Buffer from a reference string.
 * Used for embedding in confirmation emails and booking display.
 */
export async function generateQrCode(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: 'M',
    type: 'png',
    margin: 2,
    width: 300,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate a QR code as a data URI string for inline display.
 */
export async function generateQrDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
  });
}
