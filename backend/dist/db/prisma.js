"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.__prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    global.__prisma = exports.prisma;
}
// Graceful shutdown to ensure connections are closed
if (process.env.NODE_ENV === 'production') {
    const shutdown = async () => {
        await exports.prisma.$disconnect();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
//# sourceMappingURL=prisma.js.map