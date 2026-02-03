const { createClient } = require('redis');
const { redisUrl } = require('../../config.json');

class RedisCacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.defaultTTL = 1800; // 30 min
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        if (this.isConnected) {
            return;
        }

        try {
            this.client = createClient({
                url: redisUrl
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
            });

            this.client.on('connect', () => {
                console.log('✅ Redis connected successfully');
            });

            await this.client.connect();
            this.isConnected = true;
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error.message);
            throw error;
        }
    }

    /**
     * Get a value from cache
     * @param {String} key 
     * @returns {Object|null} Parsed JSON object or null if not found
     */
    async get(key) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Error getting cache key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Set a value in cache with TTL
     * @param {String} key 
     * @param {Object} value 
     * @param {Number} ttl Time to live in seconds (default: 1800 = 30 minutes)
     */
    async set(key, value, ttl = this.defaultTTL) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            await this.client.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting cache key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Delete a key from cache
     * @param {String} key 
     */
    async delete(key) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error(`Error deleting cache key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Delete all keys matching a pattern
     * @param {String} pattern 
     */
    async deletePattern(pattern) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return keys.length;
        } catch (error) {
            console.error(`Error deleting cache pattern ${pattern}:`, error.message);
            return 0;
        }
    }

    /**
     * Check if a key exists
     * @param {String} key 
     * @returns {Boolean}
     */
    async exists(key) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Error checking if key exists ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Get TTL of a key
     * @param {String} key 
     * @returns {Number} TTL in seconds, -1 if no expiry, -2 if key doesn't exist
     */
    async getTTL(key) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            return await this.client.ttl(key);
        } catch (error) {
            console.error(`Error getting TTL for key ${key}:`, error.message);
            return -2;
        }
    }

    /**
     * Clear all cache
     */
    async flush() {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            await this.client.flushAll();
            return true;
        } catch (error) {
            console.error('Error flushing cache:', error.message);
            return false;
        }
    }

    /**
     * Close Redis connection
     */
    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
            console.log('Redis disconnected');
        }
    }

    /**
     * Generate a cache key for route information
     * @param {String} origin 
     * @param {String} destination 
     * @returns {String}
     */
    generateRouteKey(origin, destination) {
        // Normalize addresses for consistent keys
        const normalizedOrigin = origin.toLowerCase().trim().replace(/\s+/g, '_');
        const normalizedDest = destination.toLowerCase().trim().replace(/\s+/g, '_');
        return `route:${normalizedOrigin}:${normalizedDest}`;
    }
}

// Export a singleton instance
module.exports = new RedisCacheService();
