const { createClient } = require('@redis/client');
const { promisify } = require('util');
const logger = require('../config/logger');
const User = require('../models/user');

// Create and configure Redis client
const client = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

// Connect to Redis
(async () => {
    try {
        await client.connect();
        client.on('error', (err) => {
            logger.error('Redis error: ' + err);
        });
    } catch (err) {
        logger.error('Failed to connect to Redis: ' + err);
    }
})();

// Promisify Redis client methods
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

// Create User
exports.createUser = async (req, res) => {
    try {
        const { name, email, age } = req.body;
        const newUser = new User({ name, email, age });
        await newUser.save();
        await client.set(email, JSON.stringify(newUser));
        res.status(201).json(newUser);
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Read User
exports.getUser = async (req, res) => {
    try {
        const { email } = req.params;
        const data = await client.get(email);
        if (data) {
            return res.json(JSON.parse(data));
        } else {
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ msg: 'User not found' });
            await client.set(email, JSON.stringify(user));
            res.json(user);
        }
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Update User
exports.updateUser = async (req, res) => {
    try {
        const { email } = req.params;
        const { name, age } = req.body;
        const user = await User.findOneAndUpdate(
            { email },
            { name, age },
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ msg: 'User not found' });
        await client.set(email, JSON.stringify(user));
        res.json(user);
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOneAndDelete({ email });
        if (!user) return res.status(404).json({ msg: 'User not found' });
        await client.del(email);
        res.json({ msg: 'User removed' });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};
