"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerService = exports.FarmerService = void 0;
exports.mapFarmingMethod = mapFarmingMethod;
exports.formatFarmingMethod = formatFarmingMethod;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
const sale_service_1 = require("./sale.service");
const order_service_1 = require("./order.service");
const inventory_service_1 = require("./inventory.service");
const delivery_service_1 = require("./delivery.service");
function mapFarmingMethod(method) {
    if (!method)
        return client_1.FarmingMethod.ORGANIC;
    const clean = method.trim().toUpperCase().replace(/[\s()-]+/g, '_');
    if (clean.includes('ZBNF') || clean.includes('NATURAL'))
        return client_1.FarmingMethod.NATURAL_ZBNF;
    if (clean.includes('HYDRO'))
        return client_1.FarmingMethod.HYDROPONIC;
    if (clean.includes('REGEN'))
        return client_1.FarmingMethod.REGENERATIVE;
    if (clean.includes('PESTICIDE'))
        return client_1.FarmingMethod.PESTICIDE_FREE;
    if (clean.includes('TRAD'))
        return client_1.FarmingMethod.TRADITIONAL;
    if (clean.includes('CONVENTIONAL'))
        return client_1.FarmingMethod.CONVENTIONAL;
    if (clean.includes('MIXED'))
        return client_1.FarmingMethod.MIXED;
    if (clean.includes('ORGANIC'))
        return client_1.FarmingMethod.ORGANIC;
    return client_1.FarmingMethod.ORGANIC;
}
function formatFarmingMethod(method) {
    switch (method) {
        case client_1.FarmingMethod.NATURAL_ZBNF:
            return 'Natural (ZBNF)';
        case client_1.FarmingMethod.HYDROPONIC:
            return 'Hydroponic';
        case client_1.FarmingMethod.REGENERATIVE:
            return 'Regenerative';
        case client_1.FarmingMethod.PESTICIDE_FREE:
            return 'Pesticide-Free';
        case client_1.FarmingMethod.TRADITIONAL:
            return 'Traditional';
        case client_1.FarmingMethod.CONVENTIONAL:
            return 'Conventional';
        case client_1.FarmingMethod.MIXED:
            return 'Mixed';
        case client_1.FarmingMethod.ORGANIC:
        default:
            return 'Organic';
    }
}
class FarmerService {
    /**
     * Helper to format a Farmer Prisma record into a standardized profile object.
     */
    formatFarmerProfile(farmer) {
        const docs = (farmer.verificationDocuments || []).reduce((acc, doc) => {
            if (doc.type === 'GOVERNMENT_ID')
                acc.governmentId = doc.fileUrl;
            if (doc.type === 'LAND_OWNERSHIP_RTC')
                acc.farmOwnership = doc.fileUrl;
            if (doc.type === 'FARM_PHOTO')
                acc.farmPhoto = doc.fileUrl;
            return acc;
        }, {});
        return {
            id: farmer.id,
            farmerId: farmer.id,
            userId: farmer.userId,
            name: farmer.user?.name || '',
            fullName: farmer.user?.name || '',
            email: farmer.user?.email || '',
            phone: farmer.user?.phone || '',
            avatar: farmer.user?.avatar || '',
            profilePhoto: farmer.user?.avatar || '',
            farmName: farmer.farmName,
            farmLocation: farmer.farmLocation,
            location: farmer.location,
            city: farmer.city,
            state: farmer.state,
            pincode: farmer.pincode,
            hub: farmer.hub,
            distanceKm: farmer.distanceKm ? Number(farmer.distanceKm) : 2.5,
            farmingMethod: farmer.farmingMethod,
            farmingMethodDisplay: formatFarmingMethod(farmer.farmingMethod),
            yearsFarming: farmer.yearsFarming,
            yearsOfFarming: farmer.yearsFarming,
            acreage: Number(farmer.acreage),
            mainCrops: farmer.mainCrops || [],
            description: farmer.farmDescription || '',
            farmDescription: farmer.farmDescription || '',
            story: farmer.story || '',
            soilPractices: farmer.soilPractices || [],
            waterSource: farmer.waterSource || '',
            certifications: farmer.certifications || [],
            coverImage: farmer.coverImage || '',
            gallery: farmer.gallery || [],
            rating: farmer.rating ? Number(farmer.rating) : 5.0,
            reviewCount: farmer.reviewCount || 0,
            totalProductsCount: farmer.totalProductsCount || 0,
            farmSinceYear: farmer.farmSinceYear || (farmer.registeredAt ? new Date(farmer.registeredAt).getFullYear() : 2024),
            isVerified: farmer.isVerified,
            verificationStatus: farmer.verificationStatus,
            isApproved: farmer.verificationStatus === client_1.VerificationStatus.APPROVED,
            isPending: farmer.verificationStatus === client_1.VerificationStatus.PENDING,
            isRejected: farmer.verificationStatus === client_1.VerificationStatus.REJECTED,
            rejectionReason: farmer.rejectionReason,
            registeredAt: farmer.registeredAt,
            approvedAt: farmer.approvedAt,
            approvedBy: farmer.approvedBy,
            verifiedDate: farmer.verifiedDate,
            documents: docs,
            verificationDocuments: farmer.verificationDocuments || [],
            user: farmer.user,
        };
    }
    /**
     * Returns verification status and profile summary for the authenticated farmer.
     */
    async getFarmerStatus(userId) {
        const farmer = await prisma_1.prisma.farmer.findUnique({
            where: { userId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                verificationDocuments: true,
            },
        });
        if (!farmer) {
            throw new Error('No farmer profile found for this user account.');
        }
        const isApproved = farmer.verificationStatus === client_1.VerificationStatus.APPROVED;
        const isPending = farmer.verificationStatus === client_1.VerificationStatus.PENDING;
        const isRejected = farmer.verificationStatus === client_1.VerificationStatus.REJECTED;
        return {
            farmerId: farmer.id,
            userId: farmer.userId,
            name: farmer.user.name,
            email: farmer.user.email,
            phone: farmer.user.phone,
            avatar: farmer.user.avatar,
            farmName: farmer.farmName,
            location: farmer.location,
            city: farmer.city,
            state: farmer.state,
            pincode: farmer.pincode,
            hub: farmer.hub,
            farmingMethod: farmer.farmingMethod,
            yearsFarming: farmer.yearsFarming,
            mainCrops: farmer.mainCrops,
            verificationStatus: farmer.verificationStatus,
            isVerified: farmer.isVerified,
            rejectionReason: farmer.rejectionReason,
            registeredAt: farmer.registeredAt,
            approvedAt: farmer.approvedAt,
            approvedBy: farmer.approvedBy,
            documentsCount: farmer.verificationDocuments.length,
            isApproved,
            isPending,
            isRejected,
        };
    }
    /**
     * Returns full profile details for the authenticated farmer, enforcing data isolation.
     */
    async getFarmerProfile(farmerId, requestingUserId, isAdmin = false) {
        const farmer = await prisma_1.prisma.farmer.findUnique({
            where: { id: farmerId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                verificationDocuments: true,
            },
        });
        if (!farmer) {
            throw new Error(`Farmer profile with ID ${farmerId} not found.`);
        }
        // Data isolation enforcement
        if (!isAdmin && farmer.userId !== requestingUserId) {
            throw new Error('Access denied: You are not authorized to view another farmer’s profile.');
        }
        return this.formatFarmerProfile(farmer);
    }
    /**
     * Returns profile details for the authenticated farmer by userId.
     */
    async getFarmerProfileByUserId(userId) {
        const farmer = await prisma_1.prisma.farmer.findUnique({
            where: { userId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                verificationDocuments: true,
            },
        });
        if (!farmer) {
            throw new Error('No farmer profile found for this user account.');
        }
        return this.formatFarmerProfile(farmer);
    }
    /**
     * Updates the authenticated farmer's profile and user details atomically in PostgreSQL.
     * Strips all verification / admin-controlled fields to prevent unauthorized elevation.
     */
    async updateFarmerProfile(userId, input) {
        // 1. Validation checks
        if (input.farmName !== undefined) {
            if (typeof input.farmName !== 'string' || input.farmName.trim().length === 0) {
                throw new Error('Farm name cannot be empty.');
            }
        }
        if (input.name !== undefined) {
            if (typeof input.name !== 'string' || input.name.trim().length === 0) {
                throw new Error('Name cannot be empty.');
            }
        }
        if (input.pincode !== undefined) {
            const pinStr = String(input.pincode).trim();
            if (!/^\d{6}$/.test(pinStr)) {
                throw new Error('Invalid pincode. Must be a 6-digit numeric code.');
            }
        }
        if (input.acreage !== undefined) {
            const acres = Number(input.acreage);
            if (isNaN(acres) || acres < 0) {
                throw new Error('Acreage must be a non-negative number.');
            }
        }
        const yearsVal = input.yearsFarming !== undefined ? input.yearsFarming : input.yearsOfFarming;
        if (yearsVal !== undefined) {
            const years = Number(yearsVal);
            if (isNaN(years) || years < 0 || !Number.isInteger(years)) {
                throw new Error('Years of farming must be a non-negative integer.');
            }
        }
        // 2. Locate existing farmer
        const existingFarmer = await prisma_1.prisma.farmer.findUnique({
            where: { userId },
        });
        if (!existingFarmer) {
            throw new Error('No farmer profile found for this user account.');
        }
        // 3. Prepare User fields
        const userUpdateData = {};
        if (input.name !== undefined)
            userUpdateData.name = input.name.trim();
        if (input.phone !== undefined)
            userUpdateData.phone = input.phone.trim();
        if (input.avatar !== undefined)
            userUpdateData.avatar = input.avatar.trim();
        else if (input.profilePhoto !== undefined)
            userUpdateData.avatar = input.profilePhoto.trim();
        // 4. Parse mainCrops
        let mainCrops = undefined;
        if (input.mainCrops !== undefined) {
            if (Array.isArray(input.mainCrops)) {
                mainCrops = input.mainCrops.map((c) => String(c).trim()).filter(Boolean);
            }
            else if (typeof input.mainCrops === 'string') {
                mainCrops = input.mainCrops.split(',').map((c) => c.trim()).filter(Boolean);
            }
        }
        // 5. Prepare Farmer fields (Strictly ignoring verification/admin fields)
        const farmerUpdateData = {};
        if (input.farmName !== undefined)
            farmerUpdateData.farmName = input.farmName.trim();
        if (input.location !== undefined)
            farmerUpdateData.location = input.location.trim();
        if (input.farmLocation !== undefined) {
            farmerUpdateData.farmLocation = input.farmLocation.trim();
        }
        else if (input.location !== undefined && !existingFarmer.farmLocation) {
            farmerUpdateData.farmLocation = input.location.trim();
        }
        if (input.city !== undefined)
            farmerUpdateData.city = input.city.trim();
        if (input.state !== undefined)
            farmerUpdateData.state = input.state.trim();
        if (input.pincode !== undefined)
            farmerUpdateData.pincode = String(input.pincode).trim();
        if (input.hub !== undefined)
            farmerUpdateData.hub = input.hub.trim();
        if (input.farmingMethod !== undefined) {
            farmerUpdateData.farmingMethod = mapFarmingMethod(input.farmingMethod);
        }
        if (yearsVal !== undefined) {
            farmerUpdateData.yearsFarming = Number(yearsVal);
        }
        if (input.acreage !== undefined) {
            farmerUpdateData.acreage = Number(input.acreage);
        }
        if (mainCrops !== undefined) {
            farmerUpdateData.mainCrops = mainCrops;
        }
        if (input.farmDescription !== undefined) {
            farmerUpdateData.farmDescription = input.farmDescription;
        }
        else if (input.description !== undefined) {
            farmerUpdateData.farmDescription = input.description;
        }
        if (input.story !== undefined) {
            farmerUpdateData.story = input.story;
        }
        if (input.soilPractices !== undefined) {
            farmerUpdateData.soilPractices = Array.isArray(input.soilPractices)
                ? input.soilPractices
                : [String(input.soilPractices)];
        }
        if (input.waterSource !== undefined) {
            farmerUpdateData.waterSource = input.waterSource;
        }
        if (input.certifications !== undefined) {
            farmerUpdateData.certifications = Array.isArray(input.certifications)
                ? input.certifications
                : [String(input.certifications)];
        }
        if (input.coverImage !== undefined) {
            farmerUpdateData.coverImage = input.coverImage;
        }
        if (input.gallery !== undefined) {
            farmerUpdateData.gallery = Array.isArray(input.gallery)
                ? input.gallery
                : [String(input.gallery)];
        }
        // 6. Execute atomic transaction
        const updatedFarmer = await prisma_1.prisma.$transaction(async (tx) => {
            if (Object.keys(userUpdateData).length > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: userUpdateData,
                });
            }
            return tx.farmer.update({
                where: { id: existingFarmer.id },
                data: farmerUpdateData,
                include: {
                    user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
                    approvedBy: { select: { id: true, name: true, email: true } },
                    verificationDocuments: true,
                },
            });
        });
        return this.formatFarmerProfile(updatedFarmer);
    }
    /**
     * Aggregates live operational dashboard data for the authenticated approved farmer.
     * Strictly scopes all metrics to farmerId using PostgreSQL / Prisma aggregations.
     */
    async getFarmerDashboard(farmerId) {
        // 1. Verify farmer profile exists
        const farmer = await prisma_1.prisma.farmer.findUnique({
            where: { id: farmerId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
            },
        });
        if (!farmer) {
            const err = new Error(`Farmer profile not found for ID "${farmerId}".`);
            err.status = 404;
            throw err;
        }
        // 2. Product counters
        const totalProducts = await prisma_1.prisma.product.count({
            where: { farmerId },
        });
        const activeProducts = await prisma_1.prisma.product.count({
            where: {
                farmerId,
                status: client_1.ProductStatus.ACTIVE,
                inStock: true,
            },
        });
        // 3. Pending orders scoped strictly through OrderItem.farmerId
        const pendingOrders = await prisma_1.prisma.order.count({
            where: {
                status: client_1.OrderStatus.PLACED,
                items: {
                    some: { farmerId },
                },
            },
        });
        // 4. Sales summary with chart data & monthly revenue
        const salesSummaryRes = await sale_service_1.saleService.getFarmerSalesSummary(farmerId);
        const salesSummary = salesSummaryRes.summary;
        const monthlyRevenue = salesSummary.thisMonthSales || 0;
        const monthlyTrend = salesSummary.monthlyTrend || '+0% from last month';
        // 5. Recent Orders (top 5)
        const allOrders = await order_service_1.orderService.getFarmerOrders(farmerId);
        const recentOrders = (allOrders || []).slice(0, 5);
        // 6. Inventory Items (top 5 for table + all for freshness alerts)
        const allInventory = await inventory_service_1.inventoryService.getFarmerInventory(farmerId);
        const inventory = (allInventory || []).slice(0, 5);
        // 7. Delivery Batches (top 3)
        const allBatches = await delivery_service_1.deliveryService.getFarmerDeliveryBatches(farmerId);
        const deliveryBatches = (allBatches.data || []).slice(0, 3);
        // 8. Profile summary
        const formattedProfile = this.formatFarmerProfile(farmer);
        return {
            totalProducts,
            activeProducts,
            pendingOrders,
            monthlyRevenue,
            monthlyTrend,
            salesSummary,
            recentOrders,
            inventory,
            allInventory,
            deliveryBatches,
            recentSales: salesSummary.recentTransactions || [],
            profile: formattedProfile,
            farmerProfile: formattedProfile,
        };
    }
}
exports.FarmerService = FarmerService;
exports.farmerService = new FarmerService();
//# sourceMappingURL=farmer.service.js.map