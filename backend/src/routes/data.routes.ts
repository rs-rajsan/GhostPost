import { Router } from 'express';
import { getPipeline, createPipelineTopic, bulkCreatePipelineTopic, updatePipelineTopic, bulkUpdatePipeline, bulkDeletePipeline, generatePipelineTopic } from '../controllers/pipeline.controller';
import { getWatchlist, addToWatchlist, removeFromWatchlist, bulkAddWatchlist, refreshWatchlist } from '../controllers/watchlist.controller';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();

// Pipeline Routes
router.get('/pipeline', getPipeline);
router.post('/pipeline', createPipelineTopic);
router.post('/pipeline/bulk-create', bulkCreatePipelineTopic);
router.patch('/pipeline/:id', updatePipelineTopic);
router.post('/pipeline/bulk-update', bulkUpdatePipeline);
router.post('/pipeline/bulk-delete', bulkDeletePipeline);
router.post('/pipeline/generate/:id', generatePipelineTopic);

// Watchlist Routes
router.get('/watchlist', getWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:id', removeFromWatchlist);
router.post('/watchlist/bulk-add', bulkAddWatchlist);
router.post('/watchlist/refresh', refreshWatchlist);

// Settings Routes
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

export default router;
