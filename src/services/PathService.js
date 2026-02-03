const DatabaseService = require('./DatabaseService');
const MapsService = require('./MapsService');

class PathService {
    constructor() {
        this.maxPaths = 10;
        this.mapsService = new MapsService();
    }

    async getUserRoutes(userId) {
        try {
            const collection = DatabaseService.getCollection('routes');
            const routes = await collection.find({ userId }).toArray();

            // Convert to object format for compatibility
            const routesObj = {};
            routes.forEach(route => {
                routesObj[route.alias] = {
                    origin: route.origin,
                    destination: route.destination,
                    createdAt: route.createdAt
                };
            });

            return routesObj;
        } catch (error) {
            throw new Error(`Error retrieving routes: ${error.message}`);
        }
    }

    async saveRoute(userId, alias, origin, destination) {
        try {
            const collection = DatabaseService.getCollection('routes');

            // Check if user has reached the limit
            const userRouteCount = await collection.countDocuments({ userId });
            const existingRoute = await collection.findOne({ userId, alias });

            if (userRouteCount >= this.maxPaths && !existingRoute) {
                throw new Error(`Maximum ${this.maxPaths} routes allowed. Please delete a route before adding a new one.`);
            }

            // Validate addresses with Maps API
            const originGeocode = await this.mapsService.geocode(origin);
            const destinationGeocode = await this.mapsService.geocode(destination);

            const routeData = {
                userId,
                alias,
                origin: originGeocode.formatted_address,
                destination: destinationGeocode.formatted_address,
                originPlaceId: originGeocode.place_id,
                destinationPlaceId: destinationGeocode.place_id,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Use upsert to update if exists or create new
            const result = await collection.replaceOne(
                { userId, alias },
                routeData,
                { upsert: true }
            );

            return routeData;
        } catch (error) {
            if (error.message.includes('duplicate key')) {
                throw new Error(`Route with alias "${alias}" already exists.`);
            }
            throw new Error(`Error saving route: ${error.message}`);
        }
    }

    async deleteRoute(userId, alias) {
        try {
            const collection = DatabaseService.getCollection('routes');
            const result = await collection.deleteOne({ userId, alias });

            if (result.deletedCount === 0) {
                throw new Error(`Route "${alias}" not found.`);
            }

            return true;
        } catch (error) {
            throw new Error(`Error deleting route: ${error.message}`);
        }
    }

    async getRoute(userId, alias) {
        try {
            const collection = DatabaseService.getCollection('routes');
            const route = await collection.findOne({ userId, alias });

            if (!route) {
                throw new Error(`Route "${alias}" not found.`);
            }

            return {
                origin: route.origin,
                destination: route.destination,
                createdAt: route.createdAt
            };
        } catch (error) {
            throw new Error(`Error retrieving route: ${error.message}`);
        }
    }

    async getAllUserRoutesWithTimes(userId) {
        try {
            const userRoutes = await this.getUserRoutes(userId);
            if (Object.keys(userRoutes).length === 0) {
                return {};
            }

            return await this.mapsService.getMultipleRoutesInfo(userRoutes);
        } catch (error) {
            throw new Error(`Error retrieving routes with times: ${error.message}`);
        }
    }
}

module.exports = PathService;