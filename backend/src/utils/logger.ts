import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
        },
    },
    mixin() {
        const store = asyncLocalStorage.getStore();
        if (store && store.has('requestId')) {
            return { requestId: store.get('requestId') };
        }
        return {};
    }
});

export default logger;
