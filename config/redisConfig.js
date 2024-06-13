const redis  = require('redis');
const { createClient } = require('redis');

const redisClientSearch = async () => {
    const client = createClient({
        url: process.env.REDIS_CLIENT_SEARCH || "your_default_url"
    });
    await client.connect();
    return client;
};

const redisClientDatabase = async () => {
    const client = createClient({
        url: process.env.REDIS_CLIENT_DATABASE|| "your_default_url"
    });
    await client.connect();
    return client;
};

module.exports = { redisClientSearch, redisClientDatabase };