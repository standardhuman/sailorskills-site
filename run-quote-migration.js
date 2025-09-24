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
    process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
    try {
        console.log('Running quotes table migration...');

        // Read the migration SQL file
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'supabase/migrations/create_quotes_table.sql'),
            'utf8'
        );

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        }).single();

        if (error) {
            // Try alternative approach - direct execution
            console.log('Trying direct SQL execution...');

            // Split SQL into individual statements
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const statement of statements) {
                console.log('Executing:', statement.substring(0, 50) + '...');

                // For now, we'll need to run this directly in Supabase dashboard
                console.log('Statement to run in Supabase SQL Editor:');
                console.log(statement + ';');
                console.log('---');
            }

            console.log('\n⚠️  Please run the above SQL statements in your Supabase dashboard:');
            console.log('1. Go to https://app.supabase.com');
            console.log('2. Select your project');
            console.log('3. Go to SQL Editor');
            console.log('4. Paste and run the contents of supabase/migrations/create_quotes_table.sql');

            throw new Error('Cannot execute migration directly. Please run in Supabase dashboard.');
        }

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.log('\n📝 Manual steps required:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Copy the contents of supabase/migrations/create_quotes_table.sql');
        console.log('4. Paste and execute in the SQL Editor');
    }
}

runMigration();