// In-memory tracking store — resets on server restart.
// In production: replace with Redis or a DB table (e.g. Prisma ReviewRequest model).
export interface TrackingEntry {
  requestId: string;
  platformUrl: string;
  customerId: string;
  sentAt: string;
  clickedAt?: string;
}

// Module-level singleton — shared across all API Route invocations in the same process.
export const trackingStore = new Map<string, TrackingEntry>();
