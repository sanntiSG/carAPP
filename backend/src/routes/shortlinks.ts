import { Router, Request, Response } from 'express';
import { ShortLink } from '../models/ShortLink';

const router = Router();

// Endpoint to create a short link
router.post('/shorten', async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        // Check if already exists
        const existing = await ShortLink.findOne({ originalUrl: url });
        if (existing) return res.json({ shortCode: existing.shortCode });

        // Generate unique code (random 4 chars)
        const generateCode = () => Math.random().toString(36).substring(2, 6);
        let code = generateCode();

        // Ensure uniqueness
        let collision = await ShortLink.findOne({ shortCode: code });
        while (collision) {
            code = generateCode();
            collision = await ShortLink.findOne({ shortCode: code });
        }

        const newLink = new ShortLink({ originalUrl: url, shortCode: code });
        await newLink.save();

        res.json({ shortCode: code });
    } catch (error) {
        res.status(500).json({ error: 'Failed to shorten URL' });
    }
});

// Endpoint to redirect
router.get('/:code', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const link = await ShortLink.findOne({ shortCode: code });

        if (!link) {
            return res.status(404).send('Link not found');
        }

        // 301 is better for social previews as it tells the crawler it's a permanent resource
        res.redirect(301, link.originalUrl);
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

export default router;
