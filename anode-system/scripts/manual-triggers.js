#!/usr/bin/env node

/**
 * Manual trigger scripts for Anode Management System
 * These can be run via npm scripts from package.json
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const SCRAPER_DIR = path.join(__dirname, '..', 'scraper');
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Helper function to run Python scripts
function runPythonScript(script, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`${colors.cyan}Running: ${script} ${args.join(' ')}${colors.reset}`);

        const proc = spawn(PYTHON, [path.join(SCRAPER_DIR, script), ...args], {
            cwd: SCRAPER_DIR,
            stdio: 'inherit'
        });

        proc.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Process exited with code ${code}`));
            } else {
                resolve();
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
}

// Command handlers
const commands = {
    // Scraping commands
    async 'scrape:full'() {
        console.log(`${colors.yellow}Starting full catalog scrape...${colors.reset}`);
        console.log(`${colors.yellow}This may take 30-60 minutes${colors.reset}`);
        await runPythonScript('boatzincs_scraper.py', ['full']);
    },

    async 'scrape:prices'() {
        console.log(`${colors.yellow}Starting price update...${colors.reset}`);
        await runPythonScript('boatzincs_scraper.py', ['prices']);
    },

    // Ordering commands
    async 'order:test-login'() {
        console.log(`${colors.yellow}Testing Boatzincs login...${colors.reset}`);
        await runPythonScript('ordering.py', ['test-login']);
    },

    async 'order:view-cart'() {
        console.log(`${colors.yellow}Viewing cart contents...${colors.reset}`);
        await runPythonScript('ordering.py', ['view-cart']);
    },

    async 'order:create'() {
        console.log(`${colors.yellow}Creating order from inventory needs...${colors.reset}`);
        await runPythonScript('ordering.py', ['create-order']);
    },

    async 'order:submit'() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const orderId = await new Promise((resolve) => {
            rl.question('Enter order ID: ', resolve);
        });

        const isLive = await new Promise((resolve) => {
            rl.question('Submit LIVE order? (yes/no): ', (answer) => {
                resolve(answer.toLowerCase() === 'yes');
            });
        });

        rl.close();

        const args = ['submit-order', orderId];
        if (isLive) args.push('--live');

        console.log(`${colors.yellow}Submitting order ${orderId} (${isLive ? 'LIVE' : 'DRY RUN'})...${colors.reset}`);
        await runPythonScript('ordering.py', args);
    },

    // Setup commands
    async 'setup:install'() {
        console.log(`${colors.yellow}Installing Python dependencies...${colors.reset}`);

        return new Promise((resolve, reject) => {
            const proc = spawn('pip', ['install', '-r', path.join(SCRAPER_DIR, 'requirements.txt')], {
                stdio: 'inherit'
            });

            proc.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Installation failed with code ${code}`));
                } else {
                    console.log(`${colors.green}Dependencies installed successfully${colors.reset}`);

                    // Install Playwright browsers
                    console.log(`${colors.yellow}Installing Playwright browsers...${colors.reset}`);
                    const playwrightProc = spawn('playwright', ['install', 'chromium'], {
                        stdio: 'inherit'
                    });

                    playwrightProc.on('close', (code) => {
                        if (code !== 0) {
                            console.log(`${colors.red}Warning: Playwright browser installation failed${colors.reset}`);
                        }
                        resolve();
                    });
                }
            });
        });
    },

    async 'setup:check'() {
        console.log(`${colors.cyan}Checking environment...${colors.reset}\n`);

        // Check Python
        try {
            await new Promise((resolve, reject) => {
                const proc = spawn(PYTHON, ['--version']);
                proc.stdout.on('data', (data) => {
                    console.log(`Python: ${colors.green}${data.toString().trim()}${colors.reset}`);
                });
                proc.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject();
                });
            });
        } catch {
            console.log(`Python: ${colors.red}Not found${colors.reset}`);
        }

        // Check for .env file
        const fs = require('fs');
        const envPath = path.join(__dirname, '..', '..', '.env');

        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');

            console.log(`\nConfiguration:`);

            if (envContent.includes('SUPABASE_URL')) {
                console.log(`  Supabase: ${colors.green}Configured${colors.reset}`);
            } else {
                console.log(`  Supabase: ${colors.red}Not configured${colors.reset}`);
            }

            if (envContent.includes('BOATZINCS_USERNAME')) {
                console.log(`  Boatzincs: ${colors.green}Credentials found${colors.reset}`);
            } else {
                console.log(`  Boatzincs: ${colors.yellow}No credentials${colors.reset}`);
            }
        } else {
            console.log(`\n${colors.red}.env file not found${colors.reset}`);
        }

        // Check for data directories
        const dataDir = path.join(SCRAPER_DIR, 'data');
        if (fs.existsSync(dataDir)) {
            console.log(`\nData directory: ${colors.green}Exists${colors.reset}`);

            const subdirs = ['logs', 'images', 'cache', 'exports'];
            subdirs.forEach(dir => {
                const dirPath = path.join(dataDir, dir);
                if (fs.existsSync(dirPath)) {
                    const files = fs.readdirSync(dirPath);
                    console.log(`  ${dir}: ${files.length} files`);
                }
            });
        } else {
            console.log(`\nData directory: ${colors.yellow}Will be created on first run${colors.reset}`);
        }
    }
};

// Main execution
async function main() {
    const command = process.argv[2];

    if (!command) {
        console.log(`${colors.cyan}Anode Management System - Manual Triggers${colors.reset}\n`);
        console.log('Available commands:\n');
        console.log('  Scraping:');
        console.log('    npm run scrape:full     - Full catalog sync');
        console.log('    npm run scrape:prices   - Price update only');
        console.log('');
        console.log('  Ordering:');
        console.log('    npm run order:test      - Test login');
        console.log('    npm run order:cart      - View cart');
        console.log('    npm run order:create    - Create reorder');
        console.log('    npm run order:submit    - Submit order');
        console.log('');
        console.log('  Setup:');
        console.log('    npm run anode:install   - Install dependencies');
        console.log('    npm run anode:check     - Check environment');
        return;
    }

    try {
        if (commands[command]) {
            await commands[command]();
            console.log(`\n${colors.green}✓ Command completed successfully${colors.reset}`);
        } else {
            console.log(`${colors.red}Unknown command: ${command}${colors.reset}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`\n${colors.red}✗ Error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { runPythonScript, commands };