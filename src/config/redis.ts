import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST;
const redisPort = parseInt(process.env.REDIS_PORT!, 10);
const redisPassword = process.env.REDIS_PASSWORD!

if (!redisHost || !redisPort) {
  throw new Error('Redis configuration is not set');
}

// Redis connection configuration
export const redisConnection = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null, // Required for BullMQ
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create Redis client for general use
export const redisClient = new Redis(redisConnection);

// Connection event handlers
redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

export default redisClient;
