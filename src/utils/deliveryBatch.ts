import { FarmerOrder } from '@/data/orders';
import { DeliveryBatch } from '@/types';

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
 * Normalizes an area name to match standard Bengaluru delivery clusters.
 */
export function normalizeArea(addressHubOrCity: string): string {
  const lower = addressHubOrCity.toLowerCase();
  if (lower.includes('hsr')) return 'HSR Layout';
  if (lower.includes('kora')) return 'Koramangala';
  if (lower.includes('sarjapur')) return 'Sarjapur Road';
  if (lower.includes('bellandur')) return 'Bellandur';
  if (lower.includes('indira')) return 'Indiranagar';
  if (lower.includes('whitefield')) return 'Whitefield';
  if (lower.includes('electronic')) return 'Electronic City';
  if (lower.includes('jaya')) return 'Jayanagar';
  if (lower.includes('yelahanka')) return 'Yelahanka';
  return 'HSR Layout';
}

/**
 * Generates an estimated batch distance and duration based on area and number of delivery stops.
 */
export function calculateBatchLogistics(area: string, orderCount: number) {
  const baseDistance = AREA_DISTANCES[area] || 8.0;
  // Each additional delivery stop adds approx 1.2 km within the neighborhood
  const additionalDistance = Math.max(0, (orderCount - 1) * 1.2);
  const estimatedDistanceKm = Number((baseDistance + additionalDistance).toFixed(1));

  // Approx 15 min base travel + 8 min per doorstep handover
  const totalMins = 15 + orderCount * 8;
  const estimatedDeliveryTime = `${totalMins} mins`;

  return { estimatedDistanceKm, estimatedDeliveryTime };
}

/**
 * Suggests delivery batches by grouping orders with matching area and delivery slot.
 */
export function groupOrdersByAreaAndSlot(orders: FarmerOrder[]): Map<string, FarmerOrder[]> {
  const groups = new Map<string, FarmerOrder[]>();

  for (const order of orders) {
    if (order.status === 'Cancelled' || order.status === 'Completed') continue;

    const area = normalizeArea(order.deliveryAddress.hub || order.deliveryAddress.addressLine);
    const slot = order.deliverySlot.name || 'Morning';
    const key = `${area}__${slot}`;

    const existing = groups.get(key) || [];
    existing.push(order);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Creates a new DeliveryBatch from a list of selected orders.
 */
export function buildDeliveryBatch(
  batchNumber: number,
  area: string,
  deliverySlot: string,
  orders: FarmerOrder[],
  customRider?: string
): DeliveryBatch {
  const batchId = `DB-${batchNumber}`;
  const { estimatedDistanceKm, estimatedDeliveryTime } = calculateBatchLogistics(area, orders.length);

  const customerNames = Array.from(new Set(orders.map((o) => o.customerName)));
  const productNames = Array.from(
    new Set(orders.flatMap((o) => o.items.map((i) => i.productName.split(' ')[0])))
  );

  const totalKg = orders.reduce((sum, o) => {
    const qty = parseInt(o.totalQuantity, 10) || 5;
    return sum + qty;
  }, 0);

  return {
    batchId,
    area,
    deliverySlot,
    orderIds: orders.map((o) => o.id),
    customerCount: customerNames.length,
    customerNames,
    farmerNames: ['Green Valley Farm (Ravi Kumar)'],
    productsSummary: productNames.slice(0, 3).join(', ') + (productNames.length > 3 ? '...' : ''),
    totalQuantity: `${totalKg} kg`,
    estimatedDistanceKm,
    estimatedDeliveryTime,
    status: 'Ready',
    riderName: customRider || 'Manjunath (EV Eco-Rider #14)',
    riderVehicle: 'Ather 450X Cargo Chilled Pod',
    createdAt: new Date().toISOString(),
    timeline: [
      { status: 'Pending', label: 'Batch Formed', timestamp: '06:30 AM', completed: true, current: false },
      { status: 'Preparing', label: 'Crops Consolidated', timestamp: '07:15 AM', completed: true, current: false },
      { status: 'Ready', label: 'Ready for Rider Handover', timestamp: '07:45 AM', completed: true, current: true },
      { status: 'Out for Delivery', label: 'Out for Local Route', timestamp: 'Pending', completed: false, current: false },
      { status: 'Delivered', label: 'All Batch Stops Delivered', timestamp: 'Pending', completed: false, current: false },
    ],
  };
}
