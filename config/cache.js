const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (error) => {
    console.error('Redis Client Error', error);
});

client.connect();

const getAsync = async (key) => {
    return await client.get(key);
};

const delAsync = async (key) => {
    return await client.del(key);
};

const setExAsync = async (key, expirationInSeconds, value) => {
    return await client.setEx(key, expirationInSeconds, value);
};


module.exports = { getAsync, delAsync, setExAsync };
