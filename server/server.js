const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const communityRoutes = require('./routes/communityRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const discussionsRouter = require('./routes/discussions');
const usersRouter = require('./routes/users');
const resourceRoutes = require('./routes/resourceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./utils/errorHandler');

const app = express();

// Security middleware
// app.use(helmet());

// // Rate limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// CORS configuration
app.use(cors(
    {
        origin: "*",
    }
));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists and serve static files
const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/discussify', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes - versioned prefix
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', communityRoutes);
app.use('/api/v1', discussionRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/discussions', discussionsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1', notificationRoutes);

// Ping route
app.get('/api/v1/ping', (req, res) => {
    res.json({ message: 'API running' });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Discussify API is running',
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
