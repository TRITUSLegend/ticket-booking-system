import { prisma } from '../../config';
import { ApiError } from '../../middleware';
import { CreateVenueInput, UpdateVenueCategoriesInput } from './venues.validation';
import { EventType } from '@prisma/client';

export async function createVenue(data: CreateVenueInput, adminId: string) {
  // Validate category assignments cover all rows exactly once
  const { rows, shape } = data.layout;
  const effectiveRows = shape === 'CIRCULAR' ? Math.ceil(rows / 2) : rows;
  const rowCoverage = new Array(effectiveRows).fill(false);

  for (const assignment of data.categoryAssignments) {
    if (assignment.startRow > assignment.endRow) {
      throw ApiError.badRequest('startRow cannot be greater than endRow');
    }
    if (assignment.startRow < 1 || assignment.endRow > effectiveRows) {
      throw ApiError.badRequest(`Row assignments must be between 1 and ${effectiveRows} for ${shape} layout`);
    }

    for (let r = assignment.startRow; r <= assignment.endRow; r++) {
      if (rowCoverage[r - 1]) {
        throw ApiError.badRequest(`Overlapping category assignment at row ${r}`);
      }
      rowCoverage[r - 1] = true;
    }
  }

  if (rowCoverage.includes(false)) {
    throw ApiError.badRequest('Category assignments must cover all rows without gaps');
  }

  const shapeMapping: Record<string, EventType[]> = {
    'RECTANGULAR': ['MOVIE'],
    'STAGE': ['THEATER', 'LIVE_EVENT', 'COMEDY'],
    'CIRCULAR': ['SPORTS', 'CONCERT']
  };
  
  const allowedTypes: EventType[] = shapeMapping[data.layout.shape] || [];
  
  const finalEventTypes = data.supportedEventTypes.filter(t => allowedTypes.includes(t));
  
  if (finalEventTypes.length === 0) {
    throw ApiError.badRequest(`You must select at least one valid event type for the ${data.layout.shape} shape.`);
  }

  // Create everything in a transaction
  return prisma.$transaction(async (tx) => {
    const venue = await tx.venue.create({
      data: {
        name: data.name,
        address: data.address,
        createdBy: adminId,
        supportedEventTypes: finalEventTypes,
      },
    });

    const layout = await tx.seatLayout.create({
      data: {
        venueId: venue.id,
        rows: data.layout.rows,
        columns: data.layout.columns,
        shape: data.layout.shape,
      },
    });

    // Generate seats
    const seatsToCreate = [];
    const midPoint = Math.ceil(data.layout.rows / 2);
    
    for (let r = 1; r <= data.layout.rows; r++) {
      // Find the category for this row. For CIRCULAR, mirror the assignments based on distance from pitch
      let distanceRow = r;
      if (data.layout.shape === 'CIRCULAR') {
        distanceRow = r <= midPoint ? r : r - midPoint;
      }
      
      const category = data.categoryAssignments.find(
        (a) => distanceRow >= a.startRow && distanceRow <= a.endRow
      )!.category;

      const rowLetter = String.fromCharCode(64 + r); // 1->A, 2->B... (Assuming <= 26 rows for simplicity in this project)

      for (let c = 1; c <= data.layout.columns; c++) {
        seatsToCreate.push({
          layoutId: layout.id,
          row: r,
          column: c,
          category,
          label: `${rowLetter}-${c}`,
        });
      }
    }

    await tx.seat.createMany({
      data: seatsToCreate,
    });

    return {
      venue,
      layout,
      seatCount: seatsToCreate.length,
    };
  });
}

export async function getVenues(eventType?: string) {
  const whereClause = eventType ? {
    supportedEventTypes: {
      has: eventType as any,
    },
  } : {};

  return prisma.venue.findMany({
    where: whereClause,
    include: {
      layouts: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getVenueById(id: string) {
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      layouts: {
        include: {
          seats: true,
        },
      },
    },
  });

  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  return venue;
}

export async function updateVenueCategories(venueId: string, data: UpdateVenueCategoriesInput) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      layouts: true,
      shows: { select: { id: true } }
    }
  });

  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  if (venue.shows.length > 0) {
    throw ApiError.badRequest('Cannot edit seat categories because shows are already scheduled at this venue.');
  }

  const layout = venue.layouts[0];
  if (!layout) {
    throw ApiError.notFound('Venue layout not found');
  }

  const rows = layout.rows;
  const shape = layout.shape;
  const effectiveRows = shape === 'CIRCULAR' ? Math.ceil(rows / 2) : rows;
  const rowCoverage = new Array(effectiveRows).fill(false);

  for (const assignment of data.categoryAssignments) {
    if (assignment.startRow > assignment.endRow) {
      throw ApiError.badRequest('startRow cannot be greater than endRow');
    }
    if (assignment.startRow < 1 || assignment.endRow > effectiveRows) {
      throw ApiError.badRequest(`Row assignments must be between 1 and ${effectiveRows} for ${shape} layout`);
    }

    for (let r = assignment.startRow; r <= assignment.endRow; r++) {
      if (rowCoverage[r - 1]) {
        throw ApiError.badRequest(`Overlapping category assignment at row ${r}`);
      }
      rowCoverage[r - 1] = true;
    }
  }

  if (rowCoverage.includes(false)) {
    throw ApiError.badRequest('Category assignments must cover all rows without gaps');
  }

  const midPoint = Math.ceil(rows / 2);

  await prisma.$transaction(async (tx) => {
    for (let r = 1; r <= rows; r++) {
      let distanceRow = r;
      if (shape === 'CIRCULAR') {
        distanceRow = r <= midPoint ? r : r - midPoint;
      }
      
      const category = data.categoryAssignments.find(
        (a) => distanceRow >= a.startRow && distanceRow <= a.endRow
      )!.category;

      await tx.seat.updateMany({
        where: { layoutId: layout.id, row: r },
        data: { category }
      });
    }
  });

  return { success: true };
}
