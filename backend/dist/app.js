"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = require("./routes/auth.routes");
const farmer_routes_1 = require("./routes/farmer.routes");
const admin_routes_1 = require("./routes/admin.routes");
const trace_routes_1 = require("./routes/trace.routes");
const order_routes_1 = require("./routes/order.routes");
const consumer_routes_1 = require("./routes/consumer.routes");
const marketplace_routes_1 = require("./routes/marketplace.routes");
const public_surplus_routes_1 = require("./routes/public-surplus.routes");
const errorHandler_1 = require("./middleware/errorHandler");
function createApp() {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({
        origin: '*', // Allow frontend development ports (3000, etc.)
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Health check endpoint
    app.get('/api/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'Krishi Market Backend API',
            timestamp: new Date().toISOString(),
        });
    });
    // Mount API modules
    app.use('/api/auth', auth_routes_1.authRoutes);
    app.use('/api/farmer', farmer_routes_1.farmerRoutes);
    app.use('/api/admin', admin_routes_1.adminRoutes);
    app.use('/api/trace', trace_routes_1.traceRoutes);
    app.use('/api/orders', order_routes_1.orderRoutes);
    app.use('/api/consumer', consumer_routes_1.consumerRoutes);
    app.use('/api/products', marketplace_routes_1.publicProductRoutes);
    app.use('/api/farmers', marketplace_routes_1.publicFarmerRoutes);
    app.use('/api/surplus', public_surplus_routes_1.publicSurplusRoutes);
    // 404 handler for undefined routes
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: `Route ${req.method} ${req.originalUrl} not found.`,
        });
    });
    // Global error handler
    app.use(errorHandler_1.errorHandler);
    return app;
}
exports.app = createApp();
//# sourceMappingURL=app.js.map