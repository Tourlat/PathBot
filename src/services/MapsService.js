const { Client } = require('@googlemaps/google-maps-services-js');
const { mapsAPIKEY } = require('../../config.json');
const cacheService = require('../rediscache/RedisCacheService');

class MapsService {
    constructor() {
        this.apiKey = mapsAPIKEY;
        this.client = new Client({});
    }

    /**
     * Get route information between origin and destination
     * @param {String} origin 
     * @param {String} destination 
     * @param {String|null} departureTime 
     * @returns an object containing distance, duration, durationInTraffic, startAddress, endAddress, hasTrafficDelay, trafficDelay, polyline
     */
    async getRouteInfo(origin, destination, departureTime = null) {
        try {
            // Generate cache key
            const cacheKey = cacheService.generateRouteKey(origin, destination);
            
            // Try to get from cache first
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        
            
            const params = {
                origin: origin,
                destination: destination,
                key: this.apiKey,
                language: 'en',
                units: 'metric'
            };

            // Add departure time for real-time traffic
            if (departureTime) {
                params.departure_time = departureTime;
            } else {
                params.departure_time = 'now';
            }

            const response = await this.client.directions({
                params: params,
                timeout: 5000 // 5 seconds timeout
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Maps API Error: ${response.data.status}`);
            }

            const route = response.data.routes[0];
            const leg = route.legs[0];

            const result = {
                distance: leg.distance.text,
                duration: leg.duration.text,
                durationInTraffic: leg.duration_in_traffic ? leg.duration_in_traffic.text : null,
                startAddress: leg.start_address,
                endAddress: leg.end_address,
                hasTrafficDelay: leg.duration_in_traffic ?
                    leg.duration_in_traffic.value > leg.duration.value : false,
                trafficDelay: leg.duration_in_traffic ?
                    Math.round((leg.duration_in_traffic.value - leg.duration.value) / 60) : 0,
                polyline: route.overview_polyline?.points,
                _cachedAt: Date.now()
            };
            
            // Store in cache with TTL
            await cacheService.set(cacheKey, result);
            
            return result;

        } catch (error) {
            // Log error without sensitive data
            console.error('Maps API error:', {
                message: error.message,
                status: error.response?.status,
                timestamp: new Date().toISOString()
            });
            
            if (error.response) {
                const status = error.response.status;
                if (status === 403) {
                    throw new Error('Maps API access denied. Please check configuration.');
                } else if (status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else {
                    throw new Error('Unable to retrieve route information.');
                }
            }
            throw new Error('Unable to retrieve route information.');
        }
    }

    async getMultipleRoutesInfo(paths) {
        const results = {};
        const pathEntries = Object.entries(paths);
        const batchSize = 3; // Process 3 routes at a time

        for (let i = 0; i < pathEntries.length; i += batchSize) {
            const batch = pathEntries.slice(i, i + batchSize);

            const batchPromises = batch.map(async ([alias, pathData]) => {
                try {
                    const result = await this.getRouteInfo(pathData.origin, pathData.destination);
                    return [alias, result];
                } catch (error) {
                    return [alias, { error: error.message }];
                }
            });

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(([alias, result]) => {
                results[alias] = result;
            });

            // Small delay between batches to respect API limits
            if (i + batchSize < pathEntries.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        return results;
    }

    /**
     * Get alternative routes between origin and destination
     * @param {String} origin 
     * @param {String} destination 
     * @param {Number} maxAlternatives 
     * @returns Array of route objects
     */
    async getAlternativeRoutes(origin, destination, maxAlternatives = 3) {
        try {
            const params = {
                origin: origin,
                destination: destination,
                key: this.apiKey,
                language: 'en',
                units: 'metric',
                alternatives: true, // Request alternative routes
                departure_time: 'now'
            };

            const response = await this.client.directions({
                params: params,
                timeout: 5000
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Maps API Error: ${response.data.status}`);
            }

            const routes = response.data.routes;
            if (!routes || routes.length === 0) {
                throw new Error('No routes found');
            }

            return routes.slice(0, maxAlternatives).map((route, index) => {
                const leg = route.legs[0];
                const trafficDelay = leg.duration_in_traffic ?
                    Math.round((leg.duration_in_traffic.value - leg.duration.value) / 60) : 0;

                return {
                    routeIndex: index,
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    durationInTraffic: leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration.text,
                    trafficDelay: trafficDelay,
                    polyline: route.overview_polyline?.points
                };
            });

        } catch (error) {
            if (error.response) {
                throw new Error(`Maps API Error (${error.response.status}): ${error.response.statusText}`);
            }
            throw new Error(`Error retrieving alternative routes: ${error.message}`);
        }
    }

    /**
     * Geocode an address to get coordinates and formatted address
     * @param {String} address 
     * @returns Object with formatted address and coordinates
     */
    async geocode(address) {
        try {
            const response = await this.client.geocode({
                params: {
                    address: address,
                    key: this.apiKey,
                    language: 'en'
                },
                timeout: 3000
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Geocoding error: ${response.data.status}`);
            }

            const result = response.data.results[0];
            return {
                formatted_address: result.formatted_address,
                location: result.geometry.location,
                place_id: result.place_id
            };
        } catch (error) {
            if (error.response) {
                throw new Error(`Geocoding error (${error.response.status}): ${error.response.statusText}`);
            }
            throw new Error(`Geocoding error: ${error.message}`);
        }
    }

    /**
     * Get place details by place ID
     * @param {String} placeId 
     * @returns Object with place details
     */
    async getPlaceDetails(placeId) {
        try {
            const response = await this.client.placeDetails({
                params: {
                    place_id: placeId,
                    key: this.apiKey,
                    language: 'en',
                    fields: ['name', 'formatted_address', 'geometry', 'types']
                },
                timeout: 3000
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Place details error: ${response.data.status}`);
            }

            return response.data.result;
        } catch (error) {
            if (error.response) {
                throw new Error(`Place details error (${error.response.status}): ${error.response.statusText}`);
            }
            throw new Error(`Place details error: ${error.message}`);
        }
    }
}

module.exports = MapsService;