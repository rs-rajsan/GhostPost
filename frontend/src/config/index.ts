/**
 * Interface for the application configuration
 */
export interface Config {
    apiBaseUrl: string;
}

const config: Config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
};

export default config;
