import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';
import config from '../config';

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

const logger = pino({
    level: config.logLevel,
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
