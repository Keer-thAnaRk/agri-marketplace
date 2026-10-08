"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELIVERY_BATCH_TIMELINE_META = void 0;
exports.normalizeHubArea = normalizeHubArea;
exports.normalizeDeliverySlot = normalizeDeliverySlot;
exports.calculateBatchLogistics = calculateBatchLogistics;
exports.toPrismaDeliveryBatchStatus = toPrismaDeliveryBatchStatus;
exports.toFrontendDeliveryBatchStatus = toFrontendDeliveryBatchStatus;
const client_1 = require("@prisma/client");
/**
 * Approximate transit distance in km between Sarjapur/HSR farm belt and Bengaluru delivery hubs.
 */
const AREA_DISTANCES = {
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
function normalizeHubArea(areaOrHub) {
    if (!areaOrHub)
        return 'HSR Layout';
    const lower = areaOrHub.toLowerCase().trim();
    if (lower.includes('hsr'))
        return 'HSR Layout';
    if (lower.includes('kora'))
        return 'Koramangala';
    if (lower.includes('sarjapur'))
        return 'Sarjapur Road';
    if (lower.includes('bellandur'))
        return 'Bellandur';
    if (lower.includes('indira'))
        return 'Indiranagar';
    if (lower.includes('whitefield'))
        return 'Whitefield';
    if (lower.includes('electronic'))
        return 'Electronic City';
    if (lower.includes('jaya'))
        return 'Jayanagar';
    if (lower.includes('yelahanka'))
        return 'Yelahanka';
    return areaOrHub.trim();
}
/**
 * Normalizes delivery slot descriptions to standard cluster slots.
 */
function normalizeDeliverySlot(slot) {
    if (!slot)
        return 'Morning';
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
function calculateBatchLogistics(hub, orderCount) {
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
function toPrismaDeliveryBatchStatus(status) {
    const s = status.toUpperCase().replace(/\s+/g, '_').trim();
    switch (s) {
        case 'PENDING':
            return client_1.DeliveryBatchStatus.PENDING;
        case 'PREPARING':
            return client_1.DeliveryBatchStatus.PREPARING;
        case 'READY':
            return client_1.DeliveryBatchStatus.READY;
        case 'OUT_FOR_DELIVERY':
        case 'OUT_FOR_DELIVERED':
        case 'DISPATCHED':
            return client_1.DeliveryBatchStatus.OUT_FOR_DELIVERY;
        case 'DELIVERED':
        case 'COMPLETED':
            return client_1.DeliveryBatchStatus.DELIVERED;
        case 'CANCELLED':
        case 'CANCELED':
            return client_1.DeliveryBatchStatus.CANCELLED;
        default:
            if (Object.values(client_1.DeliveryBatchStatus).includes(s)) {
                return s;
            }
            throw new Error(`Invalid delivery batch status: "${status}"`);
    }
}
/**
 * Maps Prisma DeliveryBatchStatus to frontend string representation.
 */
function toFrontendDeliveryBatchStatus(status) {
    switch (status) {
        case client_1.DeliveryBatchStatus.PENDING:
            return 'Pending';
        case client_1.DeliveryBatchStatus.PREPARING:
            return 'Preparing';
        case client_1.DeliveryBatchStatus.READY:
            return 'Ready';
        case client_1.DeliveryBatchStatus.OUT_FOR_DELIVERY:
            return 'Out for Delivery';
        case client_1.DeliveryBatchStatus.DELIVERED:
            return 'Delivered';
        case client_1.DeliveryBatchStatus.CANCELLED:
            return 'Cancelled';
    }
}
exports.DELIVERY_BATCH_TIMELINE_META = {
    PENDING: { label: 'Batch Formed' },
    PREPARING: { label: 'Crops Consolidated' },
    READY: { label: 'Ready for Rider Handover' },
    OUT_FOR_DELIVERY: { label: 'Dispatched to Route' },
    DELIVERED: { label: 'All Stops Delivered' },
    CANCELLED: { label: 'Batch Cancelled' },
};
//# sourceMappingURL=delivery.utils.js.map