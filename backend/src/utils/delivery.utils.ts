import { DeliveryBatchStatus } from '@prisma/client';

/**
 * Approximate transit distance in km between Sarjapur/HSR farm belt and Bengaluru delivery hubs.
 */
const AREA_DISTANCES: Record<string, number> = {
  'HSR Layout': 6.8,
  'Koramangala': 9.2,
  'Sarjapur Road': 4.5,
  'Bellandur': 5.8,
  'Indiranagar': 12.4,
  'Whitefield': 14.8,
  'Electronic City': 8.9,
  'Jayanagar': 11.2,
  'Yelahanka': 24.5,
};

/**
 * Normalizes an area / hub name to match standard Bengaluru clusters.
 */
export function normalizeHubArea(areaOrHub: string | null | undefined): string {
  if (!areaOrHub) return 'HSR Layout';
  const lower = areaOrHub.toLowerCase().trim();
  if (lower.includes('hsr')) return 'HSR Layout';
  if (lower.includes('kora')) return 'Koramangala';
  if (lower.includes('sarjapur')) return 'Sarjapur Road';
  if (lower.includes('bellandur')) return 'Bellandur';
  if (lower.includes('indira')) return 'Indiranagar';
  if (lower.includes('whitefield')) return 'Whitefield';
  if (lower.includes('electronic')) return 'Electronic City';
  if (lower.includes('jaya')) return 'Jayanagar';
  if (lower.includes('yelahanka')) return 'Yelahanka';
  return areaOrHub.trim();
}

/**
 * Normalizes delivery slot descriptions to standard cluster slots.
 */
export function normalizeDeliverySlot(slot: string | null | undefined): string {
  if (!slot) return 'Morning';
  const lower = slot.toLowerCase().trim();
  if (lower.includes('morning') || lower.includes('7:00') || lower.includes('8:00') || lower.includes('10:30') || lower.includes('11:00')) {
    return 'Morning';
  }
  if (lower.includes('midday') || lower.includes('afternoon') || lower.includes('12:00') || lower.includes('3:30')) {
    return 'Midday';
  }
  if (lower.includes('sunset') || lower.includes('evening') || lower.includes('5:30') || lower.includes('8:30')) {
    return 'Evening';
  }
  return slot.trim();
}

/**
 * Calculates estimated route distance and transit time.
 */
export function calculateBatchLogistics(hub: string, orderCount: number) {
  const normHub = normalizeHubArea(hub);
  const baseDistance = AREA_DISTANCES[normHub] || 8.0;
  const additionalDistance = Math.max(0, (orderCount - 1) * 1.2);
  const estimatedDistanceKm = Number((baseDistance + additionalDistance).toFixed(1));

  const totalMins = 15 + Math.max(1, orderCount) * 8;
  const estimatedDeliveryTime = `${totalMins} mins`;

  return { estimatedDistanceKm, estimatedDeliveryTime };
}

/**
 * Maps string / casing to Prisma DeliveryBatchStatus enum.
 */
export function toPrismaDeliveryBatchStatus(status: string): DeliveryBatchStatus {
  const s = status.toUpperCase().replace(/\s+/g, '_').trim();
  switch (s) {
    case 'PENDING':
      return DeliveryBatchStatus.PENDING;
    case 'PREPARING':
      return DeliveryBatchStatus.PREPARING;
    case 'READY':
      return DeliveryBatchStatus.READY;
    case 'OUT_FOR_DELIVERY':
    case 'OUT_FOR_DELIVERED':
    case 'DISPATCHED':
      return DeliveryBatchStatus.OUT_FOR_DELIVERY;
    case 'DELIVERED':
    case 'COMPLETED':
      return DeliveryBatchStatus.DELIVERED;
    case 'CANCELLED':
    case 'CANCELED':
      return DeliveryBatchStatus.CANCELLED;
    default:
      if (Object.values(DeliveryBatchStatus).includes(s as DeliveryBatchStatus)) {
        return s as DeliveryBatchStatus;
      }
      throw new Error(`Invalid delivery batch status: "${status}"`);
  }
}

/**
 * Maps Prisma DeliveryBatchStatus to frontend string representation.
 */
export function toFrontendDeliveryBatchStatus(status: DeliveryBatchStatus): string {
  switch (status) {
    case DeliveryBatchStatus.PENDING:
      return 'Pending';
    case DeliveryBatchStatus.PREPARING:
      return 'Preparing';
    case DeliveryBatchStatus.READY:
      return 'Ready';
    case DeliveryBatchStatus.OUT_FOR_DELIVERY:
      return 'Out for Delivery';
    case DeliveryBatchStatus.DELIVERED:
      return 'Delivered';
    case DeliveryBatchStatus.CANCELLED:
      return 'Cancelled';
  }
}

export const DELIVERY_BATCH_TIMELINE_META: Record<DeliveryBatchStatus, { label: string }> = {
  PENDING: { label: 'Batch Formed' },
  PREPARING: { label: 'Crops Consolidated' },
  READY: { label: 'Ready for Rider Handover' },
  OUT_FOR_DELIVERY: { label: 'Dispatched to Route' },
  DELIVERED: { label: 'All Stops Delivered' },
  CANCELLED: { label: 'Batch Cancelled' },
};
