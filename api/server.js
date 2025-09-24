import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// API routes for quotes
app.post('/api/quotes', async (req, res) => {
    try {
        const { saveQuote } = await import('./quotes.js');
        const result = await saveQuote(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/quotes/:quoteNumber', async (req, res) => {
    try {
        const { getQuote } = await import('./quotes.js');
        const result = await getQuote(req.params.quoteNumber);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve static files
app.use(express.static(rootDir));

// HTML routes
app.get('/diving', (req, res) => {
    res.sendFile(path.join(rootDir, 'diving.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(rootDir, 'admin-new.html'));
});

app.get('/booking', (req, res) => {
    res.sendFile(path.join(rootDir, 'booking.html'));
});

app.get('/quote/:quoteNumber', (req, res) => {
    res.sendFile(path.join(rootDir, 'quote-viewer.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

export default app;