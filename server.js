import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());

// API routes - conditionally load if available
try {
    const quoteRoutes = await import('./api/save-quote.js');
    app.use(quoteRoutes.default);
} catch (error) {
    console.warn('Quote routes not available:', error.message);
}

// HTML routes (serve HTML without extensions in URL) - BEFORE static files
app.get('/diving', (req, res) => {
    res.sendFile(path.join(__dirname, 'diving', 'diving.html'));
});

app.get(['/admin', '/admin/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

app.get(['/inventory', '/inventory/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'inventory', 'inventory.html'));
});

// Serve static files for specific directories first
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/inventory', express.static(path.join(__dirname, 'inventory')));
app.use('/diving', express.static(path.join(__dirname, 'diving')));

// Serve other static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'booking.html'));
});

// Default route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'diving', 'index.html'));
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
        console.log('  http://localhost:' + PORT + '/inventory');
        console.log('  http://localhost:' + PORT + '/booking');
    });
}

// Export for Vercel
export default app;