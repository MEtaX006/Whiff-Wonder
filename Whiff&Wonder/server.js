const express = require('express');
const Redis = require('ioredis');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

// Log to verify module loading
console.log('Modules loaded successfully');

// Redis Connection
const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis', // Ensure this matches the service name in docker-compose.yml
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'your_redis_password', // Ensure this matches the Redis password
});

redis.on('connect', () => console.log('Connected to Redis'));
redis.on('error', (err) => console.error('Redis connection error:', err));

redis.ping((err, result) => {
    if (err) {
        console.error('Redis connection failed:', err);
        process.exit(1); // Exit if Redis is not accessible
    } else {
        console.log('Redis connection successful:', result);
    }
});

// Add static file serving
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from the root directory
// Log to verify static file path
console.log('Static files served from:', path.join(__dirname, '.'));

app.use(express.json());

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
        
        if (await redis.hget('users', username)) {
            console.log(`Registration attempt failed: Username "${username}" already exists`);
            return res.json({ success: false, message: 'Username already exists' });
        }

        await redis.hset('users', username, JSON.stringify({
            password: await bcrypt.hash(password, 10)
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
        const userData = await redis.hget('users', username);
        
        if (!userData) {
            console.log(`Login attempt failed: Invalid credentials for username "${username}"`);
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const user = JSON.parse(userData);
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (validPassword) {
            console.log(`User "${username}" logged in successfully`);
        } else {
            console.log(`Login attempt failed: Invalid password for username "${username}"`);
        }

        res.json({ 
            success: validPassword, 
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

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => { // Bind to all network interfaces
    console.log(`Welcome to Whiff & Wonder! Server running on port ${PORT}`);
});
