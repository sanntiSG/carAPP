import express, { Request, Response } from 'express';
import { Setting } from '../models/Setting';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// PUBLIC: Get dealership hours
router.get('/hours', async (req: Request, res: Response) => {
    try {
        const hours = await Setting.findOne({ key: 'dealership_hours' });
        res.json(hours ? hours.value : {});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hours' });
    }
});

// ADMIN: Update settings
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
