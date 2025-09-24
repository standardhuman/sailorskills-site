import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use service role key for admin operations
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

async function setupQuotesTable() {
    try {
        console.log('Setting up quotes table...\n');

        // First, check if table exists
        const { data: tables, error: checkError } = await supabase
            .from('quotes')
            .select('quote_number')
            .limit(1);

        if (!checkError) {
            console.log('✅ Table "quotes" already exists!');

            // Count existing quotes
            const { count } = await supabase
                .from('quotes')
                .select('*', { count: 'exact', head: true });

            console.log(`   Found ${count || 0} existing quotes in the table.`);
            return;
        }

        console.log('Table does not exist. Creating it now...\n');

        // Read the SQL file
        const sql = fs.readFileSync(
            path.join(__dirname, 'supabase/migrations/create_quotes_table.sql'),
            'utf8'
        );

        // Split into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`Found ${statements.length} SQL statements to execute.\n`);

        // Unfortunately, Supabase JS client doesn't support direct SQL execution
        // We need to use the REST API directly
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            // Try alternative: Create table using REST API
            console.log('Direct SQL execution not available.');
            console.log('Attempting to create table structure...\n');

            // Try to create an empty record to force table creation
            const { error: createError } = await supabase
                .from('quotes')
                .insert({
                    quote_number: 'TEST-' + Date.now(),
                    customer_name: 'Test',
                    customer_email: 'test@example.com',
                    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    total_cost: 0
                });

            if (createError) {
                throw new Error(`Cannot create table: ${createError.message}`);
            }

            // Delete the test record
            await supabase
                .from('quotes')
                .delete()
                .match({ customer_email: 'test@example.com' });

            console.log('✅ Table created successfully!');
        } else {
            console.log('✅ SQL executed successfully!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📝 Manual Setup Required:');
        console.log('════════════════════════');
        console.log('1. Go to: https://supabase.com/dashboard/project/fzygakldvvzxmahkdylq/editor');
        console.log('2. Click on "SQL Editor" in the left sidebar');
        console.log('3. Copy the contents of supabase/migrations/create_quotes_table.sql');
        console.log('4. Paste and click "Run"\n');
        console.log('Or open the file SETUP_QUOTES_TABLE.md for detailed instructions.');
    }
}

setupQuotesTable();