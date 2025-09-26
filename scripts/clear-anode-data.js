import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearAnodeData() {
  console.log('Clearing anode catalog data...\n')

  try {
    // Delete all products
    const { error: catalogError } = await supabase
      .from('anodes_catalog')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using impossible ID)

    if (catalogError) {
      console.error('Error clearing catalog:', catalogError)
    } else {
      console.log('✅ Cleared anodes_catalog table')
    }

    // Delete all price history
    const { error: priceError } = await supabase
      .from('anode_price_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (priceError) {
      console.error('Error clearing price history:', priceError)
    } else {
      console.log('✅ Cleared anode_price_history table')
    }

    // Get count to verify
    const { count } = await supabase
      .from('anodes_catalog')
      .select('*', { count: 'exact', head: true })

    console.log(`\nRemaining products: ${count}`)

  } catch (error) {
    console.error('Error:', error)
  }
}

// Ask for confirmation
console.log('⚠️  WARNING: This will delete all anode catalog data!')
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n')

setTimeout(() => {
  clearAnodeData().catch(console.error)
}, 3000)