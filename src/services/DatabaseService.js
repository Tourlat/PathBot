const { MongoClient } = require('mongodb');
const config = require('../../config.json');

class DatabaseService {
    constructor() {
        this.client = null;
        this.db = null;
        // Use config.json instead of environment variables
        this.mongoUrl = config.mongoUrl || 'mongodb://localhost:27017/pathbot';
    }

    async connect() {
        try {
            this.client = new MongoClient(this.mongoUrl);
            await this.client.connect();
            this.db = this.client.db('pathbot');
            console.log('Connected to MongoDB');
            
            // Create index on userId for better performance
            await this.db.collection('routes').createIndex({ userId: 1 });
            await this.db.collection('routes').createIndex({ userId: 1, alias: 1 }, { unique: true });
            
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
        }
    }

    getCollection(name) {
        return this.db.collection(name);
    }
}

// Singleton instance
const databaseService = new DatabaseService();
module.exports = databaseService;