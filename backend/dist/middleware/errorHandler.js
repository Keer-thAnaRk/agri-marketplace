"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    console.error('[API Error]:', err.message);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
}
//# sourceMappingURL=errorHandler.js.map