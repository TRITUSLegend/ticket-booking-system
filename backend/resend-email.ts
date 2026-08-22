import { prisma } from './src/config';
import { sendBookingConfirmation } from './src/lib/email';

async function resendLastBookingEmail() {
  try {
    const booking = await prisma.booking.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        show: {
          include: {
            event: true,
            venue: true,
          }
        },
        bookingSeats: {
          include: {
            showSeat: {
              include: {
                seat: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      console.log('No booking found');
      process.exit(0);
    }

    const seatLabels = booking.bookingSeats.map(bs => bs.showSeat.seat.label);

    console.log(`Resending email to ${booking.customer.email} for booking ${booking.id}...`);

    const success = await sendBookingConfirmation({
      to: booking.customer.email,
      customerName: booking.customer.name,
      eventTitle: booking.show.event.title,
      showDate: booking.show.date.toISOString().split('T')[0],
      showTime: booking.show.time,
      venueName: booking.show.venue.name,
      seats: seatLabels,
      totalAmount: booking.totalAmount.toString(),
      qrReference: booking.qrReference,
      bookingId: booking.id,
    });

    if (success) {
      console.log('Email sent successfully!');
    } else {
      console.log('Failed to send email.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

resendLastBookingEmail();
