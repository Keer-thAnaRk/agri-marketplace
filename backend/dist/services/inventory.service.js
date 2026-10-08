"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
exports.mapInventoryStatusToPrisma = mapInventoryStatusToPrisma;
exports.mapInventoryStatusToFrontend = mapInventoryStatusToFrontend;
exports.mapLogTypeToPrisma = mapLogTypeToPrisma;
exports.formatLastUpdated = formatLastUpdated;
exports.formatInventoryResponse = formatInventoryResponse;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
const product_service_1 = require("./product.service");
function mapInventoryStatusToPrisma(status) {
    if (!status)
        return client_1.InventoryStatus.IN_STOCK;
    const s = status.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (s === 'IN_STOCK')
        return client_1.InventoryStatus.IN_STOCK;
    if (s === 'LOW_STOCK')
        return client_1.InventoryStatus.LOW_STOCK;
    if (s === 'OUT_OF_STOCK')
        return client_1.InventoryStatus.OUT_OF_STOCK;
    if (s === 'EXPIRED')
        return client_1.InventoryStatus.EXPIRED;
    return client_1.InventoryStatus.IN_STOCK;
}
function mapInventoryStatusToFrontend(status) {
    switch (status) {
        case client_1.InventoryStatus.IN_STOCK:
            return 'In Stock';
        case client_1.InventoryStatus.LOW_STOCK:
            return 'Low Stock';
        case client_1.InventoryStatus.OUT_OF_STOCK:
            return 'Out of Stock';
        case client_1.InventoryStatus.EXPIRED:
            return 'Expired';
        default:
            return 'In Stock';
    }
}
function mapLogTypeToPrisma(type, reason, delta) {
    if (type) {
        const t = type.trim().toUpperCase().replace(/[\s-]+/g, '_');
        if (t === 'ADD')
            return client_1.InventoryLogType.ADD;
        if (t === 'REMOVE')
            return client_1.InventoryLogType.REMOVE;
        if (t === 'ADJUSTMENT')
            return client_1.InventoryLogType.ADJUSTMENT;
        if (t === 'HARVEST_INCOMING')
            return client_1.InventoryLogType.HARVEST_INCOMING;
        if (t === 'SPOILAGE_DISCARD')
            return client_1.InventoryLogType.SPOILAGE_DISCARD;
        if (t === 'ORDER_RESERVED')
            return client_1.InventoryLogType.ORDER_RESERVED;
        if (t === 'ORDER_FULFILLED')
            return client_1.InventoryLogType.ORDER_FULFILLED;
    }
    const r = (reason || '').toLowerCase();
    if (r.includes('discard') ||
        r.includes('blemish') ||
        r.includes('spoil') ||
        r.includes('damage') ||
        r.includes('soft')) {
        return client_1.InventoryLogType.SPOILAGE_DISCARD;
    }
    if (r.includes('harvest') || r.includes('picking') || r.includes('greenhouse')) {
        return client_1.InventoryLogType.HARVEST_INCOMING;
    }
    if (delta !== undefined) {
        if (delta > 0)
            return client_1.InventoryLogType.ADD;
        if (delta < 0)
            return client_1.InventoryLogType.REMOVE;
    }
    return client_1.InventoryLogType.ADJUSTMENT;
}
function formatLastUpdated(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffMinutes < 1)
        return 'Just now';
    if (diffMinutes < 60)
        return `${diffMinutes}m ago`;
    if (diffHours < 24) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatInventoryResponse(item) {
    const product = item.product;
    const currentStock = Number(item.currentStock);
    const availableQuantity = Number(item.availableQuantity);
    const reservedQuantity = Number(item.reservedQuantity || 0);
    const soldQuantity = Number(item.soldQuantity || 0);
    const threshold = Number(item.threshold || product?.lowStockThreshold || 10);
    const price = product ? Number(product.price) : 0;
    const lastUpdatedDate = item.lastUpdated || item.updatedAt || new Date();
    return {
        id: item.id,
        productId: item.productId,
        productName: product?.name || 'Produce Item',
        productImage: product?.images?.[0] ||
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        category: product ? (0, product_service_1.mapCategoryToFrontend)(product.category) : 'Vegetables',
        unit: product?.unit || '1 kg',
        unitShort: product?.unitShort || 'kg',
        price,
        currentStock,
        availableQuantity,
        reservedQuantity,
        soldQuantity,
        threshold,
        status: mapInventoryStatusToFrontend(item.status),
        rawStatus: item.status,
        lastUpdated: formatLastUpdated(lastUpdatedDate),
        lastUpdatedIso: lastUpdatedDate.toISOString(),
        harvestBatch: product?.harvestBatch || undefined,
        harvestDate: product?.harvestDate ? new Date(product.harvestDate).toISOString() : undefined,
        shelfLifeDays: product?.shelfLifeDays || 6,
        logs: item.logs?.map((l) => ({
            id: l.id,
            type: l.type,
            amount: Number(l.amount),
            newQuantity: Number(l.newQuantity),
            reason: l.reason,
            createdAt: l.createdAt.toISOString(),
        })),
    };
}
class InventoryService {
    /**
     * Retrieves inventory belonging ONLY to the authenticated farmer.
     * Ensures that any products lacking an InventoryItem have one initialized.
     */
    async getFarmerInventory(farmerId) {
        // 1. Find all products for this farmer that might be missing an inventory item
        const uninitializedProducts = await prisma_1.prisma.product.findMany({
            where: {
                farmerId,
                inventory: null,
            },
            select: {
                id: true,
                availableQuantity: true,
                lowStockThreshold: true,
            },
        });
        if (uninitializedProducts.length > 0) {
            await prisma_1.prisma.$transaction(uninitializedProducts.map((p) => {
                const qty = Number(p.availableQuantity);
                const thresh = Number(p.lowStockThreshold || 10);
                const status = qty <= 0
                    ? client_1.InventoryStatus.OUT_OF_STOCK
                    : qty <= thresh
                        ? client_1.InventoryStatus.LOW_STOCK
                        : client_1.InventoryStatus.IN_STOCK;
                return prisma_1.prisma.inventoryItem.upsert({
                    where: { productId: p.id },
                    update: {},
                    create: {
                        productId: p.id,
                        farmerId,
                        currentStock: p.availableQuantity,
                        availableQuantity: p.availableQuantity,
                        reservedQuantity: new client_1.Prisma.Decimal(0),
                        soldQuantity: new client_1.Prisma.Decimal(0),
                        threshold: new client_1.Prisma.Decimal(thresh),
                        status,
                    },
                });
            }));
        }
        // 2. Fetch full inventory items with products and recent audit logs
        const items = await prisma_1.prisma.inventoryItem.findMany({
            where: { farmerId },
            include: {
                product: true,
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { lastUpdated: 'desc' },
        });
        return items.map(formatInventoryResponse);
    }
    /**
     * Retrieves single inventory record for a product owned by the authenticated farmer.
     */
    async getInventoryByProductId(farmerId, productId) {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw { status: 404, message: `Product with ID ${productId} not found.` };
        }
        if (product.farmerId !== farmerId) {
            throw {
                status: 404,
                message: `Inventory item for product ${productId} not found.`,
            };
        }
        // Upsert to guarantee InventoryItem exists without duplicate error
        const item = await prisma_1.prisma.inventoryItem.upsert({
            where: { productId },
            update: {},
            create: {
                productId,
                farmerId,
                currentStock: product.availableQuantity,
                availableQuantity: product.availableQuantity,
                reservedQuantity: new client_1.Prisma.Decimal(0),
                soldQuantity: new client_1.Prisma.Decimal(0),
                threshold: product.lowStockThreshold || new client_1.Prisma.Decimal(10),
                status: Number(product.availableQuantity) <= 0
                    ? client_1.InventoryStatus.OUT_OF_STOCK
                    : Number(product.availableQuantity) <= Number(product.lowStockThreshold || 10)
                        ? client_1.InventoryStatus.LOW_STOCK
                        : client_1.InventoryStatus.IN_STOCK,
            },
            include: {
                product: true,
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
        return formatInventoryResponse(item);
    }
    /**
     * Updates inventory stock level for an authenticated, approved farmer.
     * Recalculates currentStock, availableQuantity, and status.
     * Records an audit log in InventoryLog.
     * Keeps Product.availableQuantity and Product.inStock synchronized.
     */
    async updateStock(farmerId, productId, input) {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId },
            include: { inventory: true },
        });
        if (!product) {
            throw { status: 404, message: `Product with ID ${productId} not found.` };
        }
        if (product.farmerId !== farmerId) {
            throw {
                status: 403,
                message: 'Access denied: You are not authorized to modify inventory for another farmer.',
            };
        }
        // Ensure inventory item exists
        let inventory = product.inventory;
        if (!inventory) {
            inventory = await prisma_1.prisma.inventoryItem.create({
                data: {
                    productId,
                    farmerId,
                    currentStock: product.availableQuantity,
                    availableQuantity: product.availableQuantity,
                    reservedQuantity: new client_1.Prisma.Decimal(0),
                    soldQuantity: new client_1.Prisma.Decimal(0),
                    threshold: product.lowStockThreshold || new client_1.Prisma.Decimal(10),
                    status: Number(product.availableQuantity) <= 0
                        ? client_1.InventoryStatus.OUT_OF_STOCK
                        : Number(product.availableQuantity) <= Number(product.lowStockThreshold || 10)
                            ? client_1.InventoryStatus.LOW_STOCK
                            : client_1.InventoryStatus.IN_STOCK,
                },
            });
        }
        const currentAvailable = Number(inventory.availableQuantity);
        const reservedQuantity = Number(inventory.reservedQuantity || 0);
        const threshold = input.threshold !== undefined && !isNaN(Number(input.threshold))
            ? Math.max(0, Number(input.threshold))
            : Number(inventory.threshold);
        let newAvailable;
        let deltaAmount;
        const targetQty = input.quantity !== undefined
            ? input.quantity
            : input.availableQuantity !== undefined
                ? input.availableQuantity
                : undefined;
        if (targetQty !== undefined) {
            const q = Number(targetQty);
            if (isNaN(q) || q < 0) {
                throw { status: 400, message: 'Stock quantity cannot be negative or invalid.' };
            }
            newAvailable = q;
            deltaAmount = newAvailable - currentAvailable;
        }
        else if (input.delta !== undefined) {
            const d = Number(input.delta);
            if (isNaN(d)) {
                throw { status: 400, message: 'Delta amount must be a valid number.' };
            }
            if (currentAvailable + d < 0) {
                throw {
                    status: 400,
                    message: `Cannot reduce stock below zero. Current available: ${currentAvailable}, requested change: ${d}`,
                };
            }
            newAvailable = currentAvailable + d;
            deltaAmount = d;
        }
        else {
            throw {
                status: 400,
                message: 'Either quantity or delta must be provided to update stock.',
            };
        }
        const newCurrentStock = newAvailable + reservedQuantity;
        // Determine status based on thresholds
        let newStatus;
        if (newAvailable <= 0) {
            newStatus = client_1.InventoryStatus.OUT_OF_STOCK;
        }
        else if (newAvailable <= threshold) {
            newStatus = client_1.InventoryStatus.LOW_STOCK;
        }
        else {
            newStatus = client_1.InventoryStatus.IN_STOCK;
        }
        // Determine audit log type
        const logType = mapLogTypeToPrisma(input.type, input.reason, deltaAmount);
        const reasonText = input.reason?.trim() || (deltaAmount >= 0 ? 'Stock addition' : 'Stock reduction');
        // Atomic transaction for InventoryItem, InventoryLog, and Product synchronization
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Update InventoryItem
            const updatedItem = await tx.inventoryItem.update({
                where: { id: inventory.id },
                data: {
                    currentStock: new client_1.Prisma.Decimal(newCurrentStock),
                    availableQuantity: new client_1.Prisma.Decimal(newAvailable),
                    threshold: new client_1.Prisma.Decimal(threshold),
                    status: newStatus,
                    lastUpdated: new Date(),
                },
            });
            // 2. Create InventoryLog record
            const log = await tx.inventoryLog.create({
                data: {
                    inventoryItemId: inventory.id,
                    type: logType,
                    amount: new client_1.Prisma.Decimal(Math.abs(deltaAmount)),
                    newQuantity: new client_1.Prisma.Decimal(newAvailable),
                    reason: reasonText,
                    createdAt: new Date(),
                },
            });
            // 3. Synchronize Product availableQuantity and inStock
            const inStock = newAvailable > 0 && product.status === client_1.ProductStatus.ACTIVE;
            await tx.product.update({
                where: { id: productId },
                data: {
                    availableQuantity: new client_1.Prisma.Decimal(newAvailable),
                    inStock,
                    lowStockThreshold: new client_1.Prisma.Decimal(threshold),
                },
            });
            return {
                ...updatedItem,
                product,
                logs: [log],
            };
        });
        return formatInventoryResponse(result);
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map