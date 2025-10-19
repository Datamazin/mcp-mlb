/**
 * Base Sport API Client
 *
 * Abstract base class that defines the common interface for all sport API clients.
 * This provides a consistent structure across MLB, NBA, and NFL implementations.
 *
 * Phase 1: Refactoring - Extract common patterns from MLB code
 */
// Using built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;
/**
 * Custom error class for Sport API errors
 */
export class SportAPIError extends Error {
    statusCode;
    endpoint;
    constructor(message, statusCode, endpoint) {
        super(message);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        this.name = 'SportAPIError';
    }
}
/**
 * Abstract Base Sport API Client
 *
 * All sport-specific clients (MLB, NBA, NFL) must extend this class
 * and implement the required abstract methods.
 */
export class BaseSportAPI {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    /**
     * Make a generic HTTP request with error handling
     * Protected method that can be overridden by subclasses for sport-specific headers/logic
     */
    async makeRequest(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        // Add parameters to URL
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value.toString());
            }
        });
        console.error(`Making request to: ${url.toString()}`);
        try {
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new SportAPIError(`API request failed: ${response.status} ${response.statusText}`, response.status, endpoint);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof SportAPIError) {
                throw error;
            }
            // Handle fetch errors (network issues, etc.)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new SportAPIError(`Failed to fetch from API: ${errorMessage}`, undefined, endpoint);
        }
    }
}
/**
 * Sport League Enum
 * Used by the factory to determine which API client to instantiate
 */
export var SportLeague;
(function (SportLeague) {
    SportLeague["MLB"] = "MLB";
    SportLeague["NBA"] = "NBA";
    SportLeague["NFL"] = "NFL";
})(SportLeague || (SportLeague = {}));
//# sourceMappingURL=base-api.js.map