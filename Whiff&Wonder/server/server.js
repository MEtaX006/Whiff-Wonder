const express = require('express');
const Redis = require('ioredis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const bcrypt = require('bcrypt');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'"]
        }
    }
}));

// Enable CORS with specific options
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://whiffandwonder.com' 
        : 'http://localhost:3333',
    credentials: true
}));

// Enable gzip compression
app.use(compression());

// Redis configuration
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
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
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
    console.log('Successfully connected to Redis');
});

// Redis key patterns:
// auth:user:{username} - Hash storing user details
// auth:user:{username}:likes - Set of liked products
// auth:user:{username}:recent - List of recent views
// session:{sessionId} - Session data

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
    name: 'whiff_session', // Custom cookie name
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
const rateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
};

app.use('/api/', (req, res, next) => {
    const ip = req.ip;
    const key = `rate_limit:${ip}`;
    
    redis.multi()
        .incr(key)
        .expire(key, Math.floor(rateLimit.windowMs / 1000))
        .exec((err, replies) => {
            if (err) {
                console.error('Rate limiting error:', err);
                return next();
            }
            
            const requests = replies[0][1];
            
            if (requests > rateLimit.max) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests, please try again later.'
                });
            }
            
            next();
        });
});

// Serve static files from public directory with proper caching
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1h',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            // Don't cache HTML files
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Serve data files with specific cache control
app.use('/data', express.static(path.join(__dirname, '../data'), {
    maxAge: '5m' // Cache data files for 5 minutes
}));

// Route all page requests to the pages directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/landing.html'));
});

app.get('/landing', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/landing.html'));
});

app.get('/collection', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/collection.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/contact.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/register.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/profile.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/product.html'));
});

// Health check endpoint for Docker
app.get('/health', async (req, res) => {
    try {
        // Check Redis connection
        await redis.ping();

        // Check disk space (basic check for data directory)
        const dataPath = path.join(__dirname, '../data');
        await new Promise((resolve, reject) => {
            require('fs').access(dataPath, require('fs').constants.R_OK | require('fs').constants.W_OK, (err) => {
                if (err) reject(new Error(`Data directory not accessible: ${err.message}`));
                resolve();
            });
        });

        // Check session store
        await new Promise((resolve, reject) => {
            redisStore.all((err, sessions) => {
                if (err) reject(new Error(`Session store error: ${err.message}`));
                resolve();
            });
        });

        res.status(200).json({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {
                redis: 'ok',
                dataDirectory: 'ok',
                sessionStore: 'ok'
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ 
            status: 'unhealthy', 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Auth endpoints
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if user exists
        const exists = await redis.exists(`auth:user:${username}`);
        if (exists) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Hash password and store user
        const hashedPassword = await bcrypt.hash(password, 10);
        await redis.hset(`auth:user:${username}`, {
            username,
            password: hashedPassword,
            created: Date.now()
        });

        // Log user in after registration
        req.session.userId = username;
        req.session.authenticated = true;
        
        res.json({ success: true });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userData = await redis.hgetall(`auth:user:${username}`);
        if (!userData.password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, userData.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Set session data
        req.session.userId = username;
        req.session.authenticated = true;
        
        // Explicitly save session and wait for it to complete
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    reject(err);
                }
                console.log('Session saved successfully:', req.session.id);
                resolve();
            });
        });

        // Set proper headers
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.json({ 
            success: true,
            sessionId: req.session.id // Include session ID in response for debugging
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('whiff_session');
        res.json({ success: true });
    });
});

app.get('/api/verify-session', (req, res) => {
    console.log('Session verification request:', {
        sessionId: req.session?.id,
        hasSession: !!req.session,
        authenticated: !!req.session?.authenticated,
        userId: req.session?.userId
    });

    const isAuthenticated = !!(req.session && req.session.authenticated && req.session.userId);
    
    // Set proper headers to prevent caching
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });

    res.json({ 
        authenticated: isAuthenticated,
        username: isAuthenticated ? req.session.userId : null,
        sessionId: req.session?.id // Include for debugging
    });
});

// User data endpoints
app.post('/api/user/recent-views', async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.userId || 'anonymous';
    
    try {
        const key = `auth:user:${userId}:recent`;
        await redis.lrem(key, 0, productId);
        await redis.lpush(key, productId);
        await redis.ltrim(key, 0, 4);
        res.json({ success: true });
    } catch (error) {
        console.error('Recent views error:', error);
        res.status(500).json({ success: false });
    }
});

app.get('/api/user/recent-views', async (req, res) => {
    const userId = req.session.userId || 'anonymous';
    try {
        const recentViews = await redis.lrange(`auth:user:${userId}:recent`, 0, -1);
        res.json({ success: true, recentViews });
    } catch (error) {
        console.error('Get recent views error:', error);
        res.status(500).json({ success: false });
    }
});

app.get('/api/user/likes', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    try {
        const likes = await redis.smembers(`auth:user:${req.session.userId}:likes`);
        res.json({ success: true, likes });
    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch likes' });
    }
});

app.post('/api/user/likes', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { productId, action } = req.body;
    if (!productId || !action || !['add', 'remove'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }

    const key = `auth:user:${req.session.userId}:likes`;
    
    try {
        if (action === 'add') {
            await redis.sadd(key, productId);
        } else {
            await redis.srem(key, productId);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Likes update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update likes' });
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please fill in all fields' 
        });
    }

    try {
        // Store contact form submission in Redis
        const contactKey = `contact:${Date.now()}`;
        await redis.hmset(contactKey, {
            name,
            email,
            message,
            timestamp: Date.now(),
            status: 'new'
        });

        // Add to contact list for processing
        await redis.lpush('contacts:queue', contactKey);

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send message. Please try again later.' 
        });
    }
});

// Debug endpoint
app.get('/api/debug-session', (req, res) => {
    res.json({
        sessionId: req.session.id,
        session: req.session,
        sessionCookie: req.headers.cookie,
        authenticated: !!(req.session && req.session.authenticated && req.session.userId)
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    // Handle Redis connection errors
    if (err.name === 'RedisError') {
        return res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable'
        });
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format'
        });
    }

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Handle 404 errors
app.use((req, res) => {
    // Check if request expects JSON
    if (req.accepts('json')) {
        res.status(404).json({
            success: false,
            message: 'Not found'
        });
    } else {
        // Serve the landing page for HTML requests to unknown routes
        res.sendFile(path.join(__dirname, '../public/pages/landing.html'));
    }
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
