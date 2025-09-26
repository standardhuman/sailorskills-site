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

async function checkAnodeData() {
  console.log('Checking anode catalog data...\n')

  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('anodes_catalog')
      .select('*', { count: 'exact', head: true })

    console.log(`Total products in catalog: ${totalCount}`)

    // Get count by material
    const { data: materials } = await supabase
      .from('anodes_catalog')
      .select('material')

    const materialCounts = {}
    materials?.forEach(item => {
      materialCounts[item.material] = (materialCounts[item.material] || 0) + 1
    })

    console.log('\nProducts by material:')
    Object.entries(materialCounts).forEach(([material, count]) => {
      console.log(`  ${material}: ${count}`)
    })

    // Get count by category
    const { data: categories } = await supabase
      .from('anodes_catalog')
      .select('category, subcategory')

    const categoryCounts = {}
    categories?.forEach(item => {
      const key = `${item.category} - ${item.subcategory}`
      categoryCounts[key] = (categoryCounts[key] || 0) + 1
    })

    console.log('\nProducts by category:')
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`)
    })

    // Get sample products
    const { data: sampleProducts } = await supabase
      .from('anodes_catalog')
      .select('name, list_price, sale_price, material, category')
      .limit(5)

    console.log('\nSample products:')
    sampleProducts?.forEach(product => {
      console.log(`  - ${product.name}`)
      console.log(`    Price: $${product.list_price}${product.sale_price ? ` (Sale: $${product.sale_price})` : ''}`)
      console.log(`    Type: ${product.material} ${product.category}`)
    })

    // Check sync logs
    const { data: syncLog } = await supabase
      .from('anode_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (syncLog) {
      console.log('\nLatest sync:')
      console.log(`  Status: ${syncLog.status}`)
      console.log(`  Items processed: ${syncLog.items_processed}`)
      console.log(`  Items added: ${syncLog.items_added}`)
      console.log(`  Items updated: ${syncLog.items_updated}`)
      console.log(`  Items failed: ${syncLog.items_failed}`)
      console.log(`  Started: ${new Date(syncLog.started_at).toLocaleString()}`)
      if (syncLog.completed_at) {
        console.log(`  Completed: ${new Date(syncLog.completed_at).toLocaleString()}`)
      }
    }

  } catch (error) {
    console.error('Error checking data:', error)
  }
}

checkAnodeData().catch(console.error)