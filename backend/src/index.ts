import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import { requestTracer } from './middleware/requestTracer';
import logger from './utils/logger';
import enhanceRouter from './routes/enhance.routes';

const app = express();
const port = config.port;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request Tracing & Logging
app.use(requestTracer);

// Rate Limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', limiter);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
logger.info('Registering routes: /api/enhance');
app.use('/api/enhance', enhanceRouter);

const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`Server is running on port ${port} and listening on 0.0.0.0`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port conflict detected: Port ${port} is already in use. Please free up the port or let the team know of the conflict.`);
        process.exit(1);
    } else {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
});
