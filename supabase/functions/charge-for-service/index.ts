import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const allowedOrigins = [
  'https://cost-calculator-sigma.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
]

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create supabase client with the auth header to verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Check if user has admin role (you'll need to add this metadata to user accounts)
    // For now, we'll check if the email ends with a specific domain or is in a list
    const adminEmails = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map(e => e.trim())
    if (!adminEmails.includes(user.email || '')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { orderId, finalAmount, notes } = await req.json()

    // Sanitize notes input
    const sanitizedNotes = notes ? notes.replace(/[<>]/g, '').trim().slice(0, 2000) : ''

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select(`
        *,
        customer:customers!service_orders_customer_id_fkey(
          id,
          stripe_customer_id,
          email,
          name
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    if (!order.customer.stripe_customer_id) {
      throw new Error('Customer has no payment method on file')
    }

    // Get customer's default payment method
    const stripeCustomer = await stripe.customers.retrieve(
      order.customer.stripe_customer_id,
      { expand: ['default_source'] }
    )

    if (!stripeCustomer.default_source && !stripeCustomer.invoice_settings?.default_payment_method) {
      throw new Error('Customer has no default payment method')
    }

    // Calculate final amount (use provided amount or original estimate)
    const chargeAmount = finalAmount || order.estimated_amount

    // Create and immediately capture payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(chargeAmount * 100), // Convert to cents
      currency: 'usd',
      customer: order.customer.stripe_customer_id,
      payment_method: stripeCustomer.invoice_settings?.default_payment_method,
      off_session: true,
      confirm: true,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        service_type: order.service_type
      },
      description: `${order.service_type} - Order ${order.order_number}`
    })

    // Update order status
    await supabase
      .from('service_orders')
      .update({
        status: 'completed',
        final_amount: chargeAmount,
        completed_at: new Date().toISOString(),
        notes: sanitizedNotes || order.notes,
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('id', orderId)

    // Create service history record
    await supabase
      .from('service_history')
      .insert({
        order_id: orderId,
        boat_id: order.boat_id,
        service_date: new Date().toISOString().split('T')[0],
        service_type: order.service_type,
        notes: sanitizedNotes
      })

    // Update next service date for recurring customers
    if (order.service_interval && order.service_interval !== 'one-time') {
      const intervalMonths = {
        '1': 1,
        '2': 2, 
        '3': 3,
        '6': 6
      }[order.service_interval] || 2

      await supabase
        .from('service_schedules')
        .update({
          next_service_date: new Date(Date.now() + (intervalMonths * 30 * 24 * 60 * 60 * 1000))
        })
        .eq('customer_id', order.customer_id)
        .eq('is_active', true)
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        amountCharged: chargeAmount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})