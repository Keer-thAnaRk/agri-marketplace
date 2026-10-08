"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const server = app_1.app.listen(env_1.config.port, () => {
    console.log(`[Krishi Market Backend] Server listening on port ${env_1.config.port} in ${env_1.config.nodeEnv} mode`);
    console.log(`[Krishi Market Backend] Health check available at http://localhost:${env_1.config.port}/api/health`);
});
process.on('SIGTERM', () => {
    console.log('[Krishi Market Backend] SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('[Krishi Market Backend] Process terminated.');
    });
});
//# sourceMappingURL=index.js.map