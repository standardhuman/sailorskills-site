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
  'https://sailorskills-estimator.vercel.app',
  'https://sailorskills-estimator-309d9lol8-brians-projects-bc2d3592.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5175'
]

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(identifier)

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit (5 requests per 15 minutes)
    rateLimitMap.set(identifier, { count: 1, resetTime: now + 15 * 60 * 1000 })
    return true
  }

  if (limit.count >= 5) {
    return false
  }

  limit.count++
  return true
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { formData } = await req.json()

    // Rate limiting by email
    const rateLimitKey = formData.customerEmail?.toLowerCase() || req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      )
    }

    // Sanitize text inputs to prevent XSS
    const sanitize = (text: string): string => {
      if (!text) return text
      return text
        .replace(/[<>]/g, '') // Remove angle brackets
        .trim()
        .slice(0, 1000) // Limit length
    }

    formData.customerName = sanitize(formData.customerName)
    formData.customerNotes = sanitize(formData.customerNotes || '')
    formData.boatName = sanitize(formData.boatName || '')
    formData.boatMake = sanitize(formData.boatMake || '')
    formData.boatModel = sanitize(formData.boatModel || '')
    if (formData.recoveryLocation) formData.recoveryLocation = sanitize(formData.recoveryLocation)
    if (formData.itemDescription) formData.itemDescription = sanitize(formData.itemDescription)

    // Server-side price validation
    const validatePrice = (estimate: number, service: string, details: any): boolean => {
      const MIN_CHARGE = 150
      const serviceRates: Record<string, any> = {
        'Recurring Cleaning & Anodes': { rate: 4.50, type: 'per_foot' },
        'One-time Cleaning & Anodes': { rate: 6.00, type: 'per_foot' },
        'Item Recovery': { rate: 199, type: 'flat' },
        'Underwater Inspection': { rate: 4, type: 'per_foot' },
        'Propeller Removal/Installation': { rate: 349, type: 'flat' },
        'Anodes Only': { rate: 150, type: 'flat' }
      }

      const serviceConfig = serviceRates[service]
      if (!serviceConfig) return false

      if (serviceConfig.type === 'flat') {
        // For flat rate services, allow some variance for anodes/options
        return estimate >= serviceConfig.rate && estimate <= serviceConfig.rate * 5
      } else {
        // For per-foot services, validate against boat length with reasonable surcharges
        const boatLength = parseInt(details?.boatLength || formData.boatLength || '0')
        if (boatLength < 10 || boatLength > 300) return false

        const basePrice = Math.max(boatLength * serviceConfig.rate, MIN_CHARGE)
        const maxPrice = basePrice * 4 // Allow up to 4x for surcharges (catamaran, heavy growth, etc.)

        return estimate >= MIN_CHARGE && estimate <= maxPrice
      }
    }

    // Validate the estimate
    if (!validatePrice(formData.estimate, formData.service, formData.serviceDetails)) {
      throw new Error('Invalid price calculation')
    }

    // Create or update customer in Supabase
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        email: formData.customerEmail,
        name: formData.customerName,
        phone: formData.customerPhone,
        birthday: formData.customerBirthday || null
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (customerError) throw customerError
    if (!customer) throw new Error('Failed to create or retrieve customer')

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

    // Create or update boat (skip for item recovery)
    let boat = null;
    if (formData.service !== 'Item Recovery') {
      const boatResult = await supabase
        .from('boats')
        .upsert({
          customer_id: customer.id,
          name: formData.boatName,
          make: formData.boatMake,
          model: formData.boatModel,
          length: parseInt(formData.boatLength) || 0,
          // Add other boat details from formData.serviceDetails if available
        }, {
          onConflict: 'customer_id,name'
        })
        .select()
        .single()
      boat = boatResult.data;
    }

    // Create or get marina (skip for item recovery)
    let marina = null;
    if (formData.service !== 'Item Recovery' && formData.marinaName && formData.marinaName !== 'See recovery location') {
      const marinaResult = await supabase
        .from('marinas')
        .upsert({
          name: formData.marinaName
        }, {
          onConflict: 'name'
        })
        .select()
        .single()
      marina = marinaResult.data;
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Create service order with metadata for item recovery
    const orderData: any = {
      order_number: orderNumber,
      customer_id: customer.id,
      boat_id: boat?.id || null,
      marina_id: marina?.id || null,
      dock: formData.dock || null,
      slip_number: formData.slipNumber || null,
      service_type: formData.service,
      service_interval: formData.serviceInterval || 'one-time',
      estimated_amount: formData.estimate,
      status: 'pending'
    }

    // Add item recovery specific metadata if applicable
    if (formData.service === 'Item Recovery') {
      orderData.metadata = {
        recoveryLocation: formData.recoveryLocation,
        itemDescription: formData.itemDescription,
        lostDate: formData.dropDate
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) throw orderError
    if (!order) throw new Error('Failed to create order')

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