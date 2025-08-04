import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { formData } = await req.json()

    // Create or update customer in Supabase
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        email: formData.customerEmail,
        name: formData.customerName,
        phone: formData.customerPhone,
        birthday: formData.customerBirthday || null
      }, {
        onConflict: 'email',
        returning: true
      })
      .single()

    if (customerError) throw customerError

    // Create or get Stripe customer
    let stripeCustomer
    if (customer.stripe_customer_id) {
      stripeCustomer = await stripe.customers.retrieve(customer.stripe_customer_id)
    } else {
      stripeCustomer = await stripe.customers.create({
        email: formData.customerEmail,
        name: formData.customerName,
        phone: formData.customerPhone,
        address: {
          line1: formData.billingAddress,
          city: formData.billingCity,
          state: formData.billingState,
          postal_code: formData.billingZip,
          country: 'US'
        }
      })

      // Update customer with Stripe ID
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomer.id })
        .eq('id', customer.id)
    }

    // Create or update address
    await supabase
      .from('addresses')
      .upsert({
        customer_id: customer.id,
        type: 'billing',
        street: formData.billingAddress,
        city: formData.billingCity,
        state: formData.billingState,
        zip: formData.billingZip
      })

    // Create or update boat
    const { data: boat } = await supabase
      .from('boats')
      .upsert({
        customer_id: customer.id,
        name: formData.boatName,
        make: formData.boatMake,
        model: formData.boatModel,
        length: parseInt(formData.boatLength),
        // Add other boat details from formData.serviceDetails if available
      }, {
        onConflict: 'customer_id,name'
      })
      .single()

    // Create or get marina
    const { data: marina } = await supabase
      .from('marinas')
      .upsert({
        name: formData.marinaName
      }, {
        onConflict: 'name'
      })
      .single()

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Create service order
    const { data: order } = await supabase
      .from('service_orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        boat_id: boat?.id,
        marina_id: marina?.id,
        dock: formData.dock,
        slip_number: formData.slipNumber,
        service_type: formData.service,
        service_interval: formData.serviceInterval,
        estimated_amount: formData.estimate,
        status: 'pending'
      })
      .single()

    // Create recurring schedule if applicable
    if (formData.serviceInterval !== 'one-time') {
      const intervalMonths = {
        '1': 1,
        '2': 2,
        '3': 3,
        '6': 6
      }[formData.serviceInterval] || 1

      await supabase
        .from('service_schedules')
        .insert({
          customer_id: customer.id,
          boat_id: boat?.id,
          service_type: formData.service,
          interval_months: intervalMonths,
          next_service_date: new Date(Date.now() + (intervalMonths * 30 * 24 * 60 * 60 * 1000))
        })
    }

    // For recurring services, use SetupIntent to save payment method
    // For one-time services, create a PaymentIntent
    let clientSecret, intentType;
    
    if (formData.serviceInterval !== 'one-time') {
      // SetupIntent for recurring - saves card without charging
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          service_type: formData.service
        }
      })
      clientSecret = setupIntent.client_secret
      intentType = 'setup'
    } else {
      // PaymentIntent for one-time - charge immediately
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(formData.estimate * 100), // Convert to cents
        currency: 'usd',
        customer: stripeCustomer.id,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          service_type: formData.service
        }
      })
      clientSecret = paymentIntent.client_secret
      intentType = 'payment'
    }

    return new Response(
      JSON.stringify({
        clientSecret: clientSecret,
        intentType: intentType,
        orderId: order.id,
        orderNumber: orderNumber
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