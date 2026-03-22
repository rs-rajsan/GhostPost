/**
 * Interface for the application configuration
 */
export interface Config {
    apiBaseUrl: string;
    visionTimeout: number;
}

const config: Config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    visionTimeout: 30000,
};

export default config;
