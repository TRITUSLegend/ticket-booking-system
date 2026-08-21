-- CreateIndex: Partial unique index for active seat holds
-- This ensures no seat can be simultaneously HELD or BOOKED by two different records.
-- Prisma cannot express partial unique indexes natively, so this is a raw SQL migration.

CREATE UNIQUE INDEX IF NOT EXISTS "ShowSeat_active_idx" 
ON "show_seats" ("showId", "seatId") 
WHERE status IN ('HELD', 'BOOKED');
