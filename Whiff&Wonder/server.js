const express = require('express');
const Redis = require('ioredis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

// Single Redis connection for everything
const redis = new Redis({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD || 'whiffwonder2024',
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    showFriendlyErrorStack: true,
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    }
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis connected successfully');
});

// Session store configuration
const redisStore = new RedisStore({
    client: redis,
    prefix: "session:"
});

// Session middleware
app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'whiffwonder2024secret',
    resave: false,
    saveUninitialized: false,
    name: 'whiff_session',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

app.use(express.json());

// Serve static files from public directory with proper caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            // Don't cache HTML files
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Serve data files with specific cache control
app.use('/data', express.static(path.join(__dirname, 'data'), {
    maxAge: '5m' // Cache data files for 5 minutes
}));

// Route all page requests to the pages directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/landing.html'));
});

app.get('/landing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/landing.html'));
});

app.get('/collection', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/collection.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/contact.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/register.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/profile.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/product.html'));
});

// ... rest of your API routes ...

// Handle 404 errors
app.use((req, res) => {
    if (req.accepts('json')) {
        res.status(404).json({
            success: false,
            message: 'Not found'
        });
    } else {
        // Serve the landing page for HTML requests to unknown routes
        res.sendFile(path.join(__dirname, 'public/pages/landing.html'));
    }
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});