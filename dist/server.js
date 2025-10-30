import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import quoteRoutes from './api/save-quote.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());

// API routes - wrapped to handle errors gracefully
try {
    app.use(quoteRoutes);
} catch (error) {
    console.warn('Quote routes not available:', error.message);
}

// Serve static files
app.use(express.static(__dirname));

// Serve admin directory files
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// URL rewriting - serve HTML files without extension
app.get('/diving', (req, res) => {
    res.sendFile(path.join(__dirname, 'diving.html'));
});

app.get(['/admin', '/admin/'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'admin.html'));
});

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'booking.html'));
});

app.get('/anode-quote', (req, res) => {
    res.sendFile(path.join(__dirname, 'anode-quote.html'));
});

app.get('/comprehensive-quote', (req, res) => {
    res.sendFile(path.join(__dirname, 'comprehensive-quote.html'));
});

// Quote viewer route
app.get('/quote/:quoteNumber', (req, res) => {
    res.sendFile(path.join(__dirname, 'quote-viewer.html'));
});

// Default route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Only listen if not in Vercel
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log('📁 Auto-reload enabled with nodemon');
        console.log('Available routes:');
        console.log('  http://localhost:' + PORT + '/');
        console.log('  http://localhost:' + PORT + '/diving');
        console.log('  http://localhost:' + PORT + '/admin');
        console.log('  http://localhost:' + PORT + '/booking');
        console.log('  http://localhost:' + PORT + '/anode-quote');
        console.log('  http://localhost:' + PORT + '/comprehensive-quote');
    });
}

// Export for Vercel
export default app;