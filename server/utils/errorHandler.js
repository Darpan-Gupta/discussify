// Global error-handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[ERROR]', message, err?.stack || '');
    }

    res.status(status).json({ error: message });
};


