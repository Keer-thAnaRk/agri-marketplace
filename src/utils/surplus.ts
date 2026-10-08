import { FarmerProduct, Harvest, InventoryItem } from '@/types';
import { calculateFreshness } from './freshness';

export interface SurplusCandidate {
  productId: string;
  productName: string;
  category: string;
  image: string;
  batchNumber: string;
  availableQuantity: number;
  unit: string;
  unitShort: string;
  originalPrice: number;
  suggestedPrice: number;
  discountPercent: number;
  harvestDate: string;
  freshnessPercentage: number;
  daysRemaining: number;
  status: 'Fresh' | 'Good' | 'Use Soon' | 'Expired';
  surplusReason: string;
  potentialWasteKg: number;
  estimatedRecoverableValue: number;
}

/**
 * Detects products that are surplus candidates based on deterministic business rules:
 * 1. Available quantity > threshold
 * 2. Freshness percentage <= 50% OR days remaining <= 2
 * 3. Not already marked expired
 */
export function detectSurplus(
  products: FarmerProduct[],
  harvests: Harvest[],
  inventory: InventoryItem[]
): SurplusCandidate[] {
  const candidates: SurplusCandidate[] = [];

  for (const product of products) {
    // Find matching inventory
    const inv = inventory.find((i) => i.productId === product.id);
    const availableQty = inv ? inv.availableQuantity : product.availableQuantity;

    if (availableQty <= 0) continue;

    // Shelf life & harvest date
    const shelfLife = product.shelfLifeDays || 6;
    const harvestDate = product.harvestDate || 'Sept 23, 2026';
    const freshness = calculateFreshness(harvestDate, shelfLife);

    if (freshness.isExpired) continue;

    // Rule: Approaching expiry (<= 2 days) OR freshness < 50%
    // OR relatively high available quantity (> 25) with moderate freshness (< 65%)
    const isUrgentExpiry = freshness.daysRemaining <= 2 || freshness.percentage <= 45;
    const isHighStockAging = availableQty >= 25 && freshness.percentage <= 65;

    if (isUrgentExpiry || isHighStockAging) {
      // Calculate suggested discount: 15% to 30% off based on urgency
      let discountPercent = 15;
      if (freshness.daysRemaining <= 1 || freshness.percentage <= 30) {
        discountPercent = 25;
      } else if (freshness.daysRemaining <= 2) {
        discountPercent = 20;
      }

      const suggestedPrice = Math.max(10, Math.round(product.price * (1 - discountPercent / 100)));
      const potentialWasteKg = availableQty;
      const estimatedRecoverableValue = suggestedPrice * availableQty;

      let surplusReason = `${freshness.daysRemaining} days of optimal freshness remaining with ${availableQty} ${product.unitShort} in packhouse.`;
      if (isHighStockAging && !isUrgentExpiry) {
        surplusReason = `Elevated stock volume (${availableQty} ${product.unitShort}) relative to remaining shelf life.`;
      }

      candidates.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        image: product.images[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        batchNumber: product.harvestBatch || `BAT-${product.id.slice(-4)}`,
        availableQuantity: availableQty,
        unit: product.unit,
        unitShort: product.unitShort,
        originalPrice: product.price,
        suggestedPrice,
        discountPercent,
        harvestDate,
        freshnessPercentage: freshness.percentage,
        daysRemaining: freshness.daysRemaining,
        status: freshness.status,
        surplusReason,
        potentialWasteKg,
        estimatedRecoverableValue,
      });
    }
  }

  return candidates;
}
