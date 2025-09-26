import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('Creating Supabase tables for anode catalog...')

  // Read SQL file
  const sqlPath = join(__dirname, '..', 'anode-system', 'scraper', 'create_tables.sql')
  const sqlContent = readFileSync(sqlPath, 'utf8')

  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements`)

  // Note: Supabase JavaScript client doesn't support raw SQL execution
  // We need to check if tables exist

  try {
    // Test if anodes_catalog exists
    const { data: catalog, error: catalogError } = await supabase
      .from('anodes_catalog')
      .select('count')
      .limit(1)

    if (catalogError?.code === '42P01') {
      console.log('❌ anodes_catalog table does not exist')
      console.log('\n' + '='.repeat(60))
      console.log('IMPORTANT: Tables need to be created manually')
      console.log('='.repeat(60))
      console.log('\n1. Go to your Supabase dashboard:')
      console.log('   https://supabase.com/dashboard/project/fzygakldvvzxmahkdylq')
      console.log('\n2. Click on "SQL Editor" in the left sidebar')
      console.log('\n3. Click "New query"')
      console.log('\n4. Copy and paste the contents of:')
      console.log(`   ${sqlPath}`)
      console.log('\n5. Click "Run" to execute the SQL')
      console.log('\n6. After creation, come back and run the scraper')
      console.log('='.repeat(60))
    } else if (!catalogError) {
      console.log('✅ anodes_catalog table already exists!')
    } else {
      console.log('Error checking table:', catalogError)
    }

    // Test if anode_sync_logs exists
    const { error: syncError } = await supabase
      .from('anode_sync_logs')
      .select('count')
      .limit(1)

    if (syncError?.code === '42P01') {
      console.log('❌ anode_sync_logs table does not exist')
    } else if (!syncError) {
      console.log('✅ anode_sync_logs table already exists!')
    }

    // Test if anode_price_history exists
    const { error: priceError } = await supabase
      .from('anode_price_history')
      .select('count')
      .limit(1)

    if (priceError?.code === '42P01') {
      console.log('❌ anode_price_history table does not exist')
    } else if (!priceError) {
      console.log('✅ anode_price_history table already exists!')
    }

  } catch (error) {
    console.error('Error checking tables:', error)
  }
}

createTables().catch(console.error)