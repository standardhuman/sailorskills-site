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

// Load main API routes (Stripe customers, etc.)
try {
    const apiRoutes = await import('./api/index.js');
    app.use(apiRoutes.default);
} catch (error) {
    console.warn('API routes not available:', error.message);
}

// Load calendar API routes
try {
    const calendarRoutes = await import('./api/calendar.js');
    app.use(calendarRoutes.default);
} catch (error) {
    console.warn('Calendar routes not available:', error.message);
}

// HTML routes (serve HTML without extensions in URL) - BEFORE static files
app.get('/diving', (req, res) => {
    res.sendFile(path.join(__dirname, 'diving', 'diving.html'));
});

app.get('/training', (req, res) => {
    res.sendFile(path.join(__dirname, 'training', 'training.html'));
});

app.get('/detailing', (req, res) => {
    res.sendFile(path.join(__dirname, 'detailing', 'detailing.html'));
});

app.get('/deliveries', (req, res) => {
    res.sendFile(path.join(__dirname, 'deliveries', 'deliveries.html'));
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
app.use('/training', express.static(path.join(__dirname, 'training')));
app.use('/detailing', express.static(path.join(__dirname, 'detailing')));
app.use('/deliveries', express.static(path.join(__dirname, 'deliveries')));

// Serve other static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'booking.html'));
});

// Default route - serve home page
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
        console.log('  http://localhost:' + PORT + '/training');
        console.log('  http://localhost:' + PORT + '/diving');
        console.log('  http://localhost:' + PORT + '/detailing');
        console.log('  http://localhost:' + PORT + '/deliveries');
        console.log('  http://localhost:' + PORT + '/admin');
        console.log('  http://localhost:' + PORT + '/inventory');
        console.log('  http://localhost:' + PORT + '/booking');
    });
}

// Export for Vercel
export default app;