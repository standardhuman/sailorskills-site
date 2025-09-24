import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// URL rewriting - serve HTML files without extension
app.get('/diving', (req, res) => {
    res.sendFile(path.join(__dirname, 'diving.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
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

// Default route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('  http://localhost:' + PORT + '/');
    console.log('  http://localhost:' + PORT + '/diving');
    console.log('  http://localhost:' + PORT + '/admin');
    console.log('  http://localhost:' + PORT + '/booking');
    console.log('  http://localhost:' + PORT + '/anode-quote');
    console.log('  http://localhost:' + PORT + '/comprehensive-quote');
});