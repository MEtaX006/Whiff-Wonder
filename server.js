const express = require('express');
const Redis = require('ioredis');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const app = express();

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Log to verify module loading
console.log('Modules loaded successfully');

// Redis Connection
const redisIoRedis = new Redis({
    host: process.env.REDIS_HOST || 'redis', // Ensure this matches the service name in docker-compose.yml
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'your_redis_password', // Ensure this matches the Redis password
});

redisIoRedis.on('connect', () => console.log('Connected to Redis'));
redisIoRedis.on('error', (err) => console.error('Redis connection error:', err));

redisIoRedis.ping((err, result) => {
    if (err) {
        console.error('Redis connection failed:', err);
        process.exit(1); // Exit if Redis is not accessible
    } else {
        console.log('Redis connection successful:', result);
    }
});

// Add review schema to Redis
const reviewKey = (productId) => `reviews:${productId}`;

// Add static file serving
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from the root directory
app.use('/References', express.static(path.join(__dirname, 'References'))); // Explicitly serve the References directory

// Log to verify static file path
console.log('Static files served from:', path.join(__dirname, '.'));
console.log('References served from:', path.join(__dirname, 'References'));

app.use(express.json());

// Configure Redis session store
const redisStore = new RedisStore({
    client: redisIoRedis,
    prefix: 'session:'
});

// Session middleware with Redis store
app.use(session({
    store: redisStore,
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Optimize error handling
const handleError = (res, error, operation) => {
    console.error(`${operation} error:`, error);
    res.json({ success: false, message: `${operation} failed` });
};

// Serve landing.html as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html')); // Ensure the correct file path
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body; // Removed email field
        
        if (await redisIoRedis.hget('users', username)) {
            console.log(`Registration attempt failed: Username "${username}" already exists`);
            return res.json({ success: false, message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await redisIoRedis.hset('users', username, JSON.stringify({
            password: hashedPassword
        }));

        console.log(`User "${username}" registered successfully`);
        res.json({ success: true });
    } catch (error) {
        console.error(`Error during registration for user "${req.body.username}":`, error);
        handleError(res, error, 'Registration');
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userData = await redisIoRedis.hget('users', username);
        
        if (!userData) {
            console.log(`Login attempt failed: Invalid credentials for username "${username}"`);
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const user = JSON.parse(userData);
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (validPassword) {
            req.session.username = username;
            await req.session.save(); // Ensure session is saved
            console.log(`User "${username}" logged in successfully`);
        } else {
            console.log(`Login attempt failed: Invalid password for username "${username}"`);
        }

        res.json({ 
            success: validPassword,
            username: validPassword ? username : null,
            message: validPassword ? undefined : 'Invalid credentials' 
        });
    } catch (error) {
        console.error(`Error during login for user "${req.body.username}":`, error);
        handleError(res, error, 'Login');
    }
});

// Test if express is working
app.get('/test', (req, res) => {
    res.send('Express is working!');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Username endpoint
app.get('/api/username', async (req, res) => {
    try {
        const username = req.session.username;
        res.json({ username: username || null });
    } catch (error) {
        console.error('Error fetching username:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Profile endpoint
app.get('/api/profile', async (req, res) => {
    try {
        const username = req.session.username;
        if (!username) {
            return res.status(401).json({ error: 'Not logged in' });
        }
        const userData = await redisIoRedis.hget('users', username);
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ username });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Product details endpoint
app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const items = require('./items.json');
    // Fix image paths to be absolute
    const product = JSON.parse(JSON.stringify(items[id - 1])); // Create a copy
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    product.image = `/${product.image}`;
    res.json(product);
});

// Get all products endpoint
app.get('/api/products', (req, res) => {
    const items = require('./items.json');
    // Fix image paths to be absolute
    const products = items.map(item => {
        const product = { ...item };
        product.image = `/${product.image}`;
        return product;
    });
    res.json(products);
});

// Review endpoints
app.post('/api/reviews/:productId', async (req, res) => {
    try {
        if (!req.session.username) {
            return res.status(401).json({ error: 'Must be logged in to post reviews' });
        }

        const { rating, comment } = req.body;
        const productId = req.params.productId;
        const username = req.session.username;
        const review = {
            username,
            rating,
            comment,
            date: new Date().toISOString()
        };

        await redisIoRedis.lpush(reviewKey(productId), JSON.stringify(review));
        res.json({ success: true });
    } catch (error) {
        console.error('Error posting review:', error);
        res.status(500).json({ error: 'Failed to post review' });
    }
});

app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const reviews = await redisIoRedis.lrange(reviewKey(productId), 0, -1);
        res.json(reviews.map(review => JSON.parse(review)));
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => { // Bind to all network interfaces
    console.log(`Welcome to Whiff & Wonder! Server running on port ${PORT}`);
});
