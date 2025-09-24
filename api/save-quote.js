import 'dotenv/config';
import express from 'express';
import { saveQuote } from './quotes.js';

const router = express.Router();

// POST endpoint to save a quote
router.post('/api/quotes', async (req, res) => {
    try {
        const quoteData = req.body;

        // Validate required fields
        if (!quoteData.quoteNumber || !quoteData.customer || !quoteData.pricing) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Save to Supabase
        const result = await saveQuote(quoteData);

        if (result.success) {
            res.json({
                success: true,
                quote: result.quote,
                publicUrl: `${process.env.VITE_APP_URL}/quote/${quoteData.quoteNumber}`
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Error in save quote endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET endpoint to retrieve a quote
router.get('/api/quotes/:quoteNumber', async (req, res) => {
    try {
        const { quoteNumber } = req.params;
        const { getQuote } = await import('./quotes.js');

        const result = await getQuote(quoteNumber);

        if (result.success && result.quote) {
            res.json({
                success: true,
                quote: result.quote
            });
        } else if (result.success && !result.quote) {
            res.status(404).json({
                success: false,
                error: 'Quote not found'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Error in get quote endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;