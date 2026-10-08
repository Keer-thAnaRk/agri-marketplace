"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicFarmerRoutes = exports.publicProductRoutes = void 0;
const express_1 = require("express");
const marketplace_controller_1 = require("../controllers/marketplace.controller");
// Router for public product discovery: /api/products
exports.publicProductRoutes = (0, express_1.Router)();
exports.publicProductRoutes.get('/', (req, res, next) => {
    marketplace_controller_1.marketplaceController.getProducts(req, res, next);
});
exports.publicProductRoutes.get('/:id', (req, res, next) => {
    marketplace_controller_1.marketplaceController.getProductById(req, res, next);
});
// Router for public farmer discovery: /api/farmers
exports.publicFarmerRoutes = (0, express_1.Router)();
exports.publicFarmerRoutes.get('/', (req, res, next) => {
    marketplace_controller_1.marketplaceController.getFarmers(req, res, next);
});
exports.publicFarmerRoutes.get('/:id', (req, res, next) => {
    marketplace_controller_1.marketplaceController.getFarmerById(req, res, next);
});
//# sourceMappingURL=marketplace.routes.js.map