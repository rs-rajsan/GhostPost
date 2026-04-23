/**
 * Interface for the application configuration
 */
export interface Config {
    apiBaseUrl: string;
}

const config: Config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
};

export default config;
