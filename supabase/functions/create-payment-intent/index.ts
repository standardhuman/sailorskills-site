import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

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

// Generate admin notification email HTML
function generateAdminNotificationEmail(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  serviceType: string,
  estimatedAmount: number,
  boatName: string,
  marinaName: string,
  slipNumber: string,
  isRecurring: boolean
): string {
  const paymentStatus = isRecurring ? '💳 Payment Method Saved' : '✅ Payment Processed'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order - ${orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0; text-align: center; background-color: #345475;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔔 New Order Received</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #345475; margin: 0 0 20px 0;">Order Details</h2>

            <table style="width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #ddd;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Order Number:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${serviceType}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Amount:</td>
                <td style="padding: 12px; border: 1px solid #ddd; color: #16a34a; font-weight: bold;">$${estimatedAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Payment Status:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${paymentStatus}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service Type:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${isRecurring ? 'Recurring' : 'One-time'}</td>
              </tr>
            </table>

            <h2 style="color: #345475; margin: 30px 0 20px 0;">Customer Information</h2>

            <table style="width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #ddd;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Name:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
                <td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${customerEmail}">${customerEmail}</a></td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Phone:</td>
                <td style="padding: 12px; border: 1px solid #ddd;"><a href="tel:${customerPhone}">${customerPhone}</a></td>
              </tr>
            </table>

            <h2 style="color: #345475; margin: 30px 0 20px 0;">Boat & Location</h2>

            <table style="width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #ddd;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Boat Name:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${boatName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Marina:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${marinaName || 'N/A'}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Slip Number:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${slipNumber || 'N/A'}</td>
              </tr>
            </table>

            <p style="margin: 30px 0 0 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e;">
              <strong>Action Required:</strong> Review this order and schedule the service.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #345475; color: #ffffff;">
            <p style="margin: 0; font-size: 14px;">© 2025 Sailor Skills. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// Generate order confirmation email HTML
function generateOrderConfirmationEmail(
  orderNumber: string,
  customerName: string,
  serviceType: string,
  estimatedAmount: number,
  isRecurring: boolean
): string {
  const paymentMessage = isRecurring
    ? `<p style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-left: 4px solid #345475; color: #345475;">
         <strong>Payment Method Saved!</strong><br>
         Your card is securely saved and will be charged after each service completion.
       </p>`
    : `<p style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-left: 4px solid #345475; color: #345475;">
         <strong>Payment Processed!</strong><br>
         Your card has been charged $${estimatedAmount.toFixed(2)} for this one-time service.
       </p>`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0; text-align: center; background-color: #ffffff;">
            <h1 style="color: #4CAF50; margin: 0; font-size: 32px;">✅ Order Confirmed!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px; background-color: #ffffff;">
            <p style="font-size: 18px; margin: 0 0 20px 0;">Hi ${customerName},</p>
            <p style="font-size: 16px; margin: 0 0 20px 0;">Thank you for your order with Sailor Skills!</p>

            <table style="width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #ddd;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Order Number:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${serviceType}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service estimate:</td>
                <td style="padding: 12px; border: 1px solid #ddd;">$${estimatedAmount.toFixed(2)}</td>
              </tr>
            </table>

            ${paymentMessage}

            <p style="margin: 20px 0; font-size: 16px;">
              <strong>What's Next?</strong><br>
              We'll notify you as soon as your service is complete.
            </p>

            <p style="margin: 20px 0; font-size: 14px; color: #666;">
              If you have any questions, please contact us at:<br>
              <a href="mailto:orders@sailorskills.com" style="color: #345475;">orders@sailorskills.com</a>
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated confirmation email from Sailor Skills.<br>
              Please do not reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #345475; color: #ffffff;">
            <p style="margin: 0; font-size: 14px;">© 2025 Sailor Skills. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
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
    // First, try to find existing address
    const { data: existingAddress } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('type', 'billing')
      .single()

    const addressData = {
      customer_id: customer.id,
      type: 'billing',
      street: formData.billingAddress,
      city: formData.billingCity,
      state: formData.billingState,
      zip: formData.billingZip
    }

    if (existingAddress) {
      // Update existing
      await supabase
        .from('addresses')
        .update(addressData)
        .eq('id', existingAddress.id)
    } else {
      // Create new
      await supabase
        .from('addresses')
        .insert(addressData)
    }

    // Create or update boat (skip for item recovery)
    let boat = null;
    if (formData.service !== 'Item Recovery') {
      const boatData: any = {
        customer_id: customer.id, // Foreign key to customers table
        customer_name: formData.customerName, // Kept for backward compatibility
        customer_email: formData.customerEmail, // Kept for backward compatibility
        customer_phone: formData.customerPhone, // Kept for backward compatibility
        boat_name: formData.boatName,
        boat_make: formData.boatMake,
        boat_model: formData.boatModel,
        boat_length_ft: parseInt(formData.boatLength) || 0,
        marina_location: formData.marinaName || null,
        slip_number: formData.slipNumber || null,
        is_active: true
      }

      // Add boat details from serviceDetails if available
      if (formData.serviceDetails) {
        if (formData.serviceDetails.boatType) {
          boatData.type = formData.serviceDetails.boatType
        }
        if (formData.serviceDetails.hullType) {
          boatData.hull_type = formData.serviceDetails.hullType
        }
        if (formData.serviceDetails.twinEngines !== undefined) {
          boatData.twin_engines = formData.serviceDetails.twinEngines
        }
      }

      // Try to find existing boat first (prefer customer_id, fallback to customer_email for backward compatibility)
      const { data: existingBoat } = await supabase
        .from('boats')
        .select('*')
        .or(`and(customer_id.eq.${customer.id},boat_name.eq.${formData.boatName}),and(customer_email.eq.${formData.customerEmail},boat_name.eq.${formData.boatName})`)
        .limit(1)
        .maybeSingle()

      if (existingBoat) {
        // Update existing boat
        const { data: updatedBoat } = await supabase
          .from('boats')
          .update(boatData)
          .eq('id', existingBoat.id)
          .select()
          .single()
        boat = updatedBoat
      } else {
        // Create new boat
        const { data: newBoat } = await supabase
          .from('boats')
          .insert(boatData)
          .select()
          .single()
        boat = newBoat
      }
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

    // Create service order with service_details and metadata
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
      status: 'pending',
      service_details: formData.serviceDetails || null, // Store full calculator context
      notes: formData.customerNotes || null
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

    // Send order confirmation email
    try {
      const isRecurring = formData.serviceInterval !== 'one-time'
      const emailHtml = generateOrderConfirmationEmail(
        orderNumber,
        formData.customerName,
        formData.service,
        formData.estimate,
        isRecurring
      )

      // Use environment variable for from address (allows using verified test address)
      // Default: 'Sailor Skills <orders@sailorskills.com>'
      // For testing with unverified domain, set to: 'onboarding@resend.dev'
      const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'Sailor Skills <orders@sailorskills.com>'

      const emailResult = await resend.emails.send({
        from: fromAddress,
        to: [formData.customerEmail],
        subject: `Order Confirmation - ${orderNumber}`,
        html: emailHtml
      })

      console.log(`Confirmation email sent to ${formData.customerEmail} for order ${orderNumber}`)
      console.log('Email send result:', JSON.stringify(emailResult))

      // Send admin notification email
      const adminEmail = Deno.env.get('ADMIN_EMAILS') || 'standardhuman@gmail.com'
      const adminEmailHtml = generateAdminNotificationEmail(
        orderNumber,
        formData.customerName,
        formData.customerEmail,
        formData.customerPhone,
        formData.service,
        formData.estimate,
        formData.boatName || 'N/A',
        formData.marinaName || 'N/A',
        formData.slipNumber || 'N/A',
        isRecurring
      )

      const adminEmailResult = await resend.emails.send({
        from: fromAddress,
        to: [adminEmail],
        subject: `🔔 New Order: ${orderNumber} - ${formData.service}`,
        html: adminEmailHtml
      })

      console.log(`Admin notification sent to ${adminEmail} for order ${orderNumber}`)
      console.log('Admin email send result:', JSON.stringify(adminEmailResult))
    } catch (emailError) {
      // Log detailed email error but don't fail the order
      console.error('Failed to send confirmation email - DETAILED ERROR:')
      console.error('Error message:', emailError?.message)
      console.error('Error details:', JSON.stringify(emailError, null, 2))
      console.error('Customer email:', formData.customerEmail)
      console.error('Order number:', orderNumber)

      // Continue processing - email failure shouldn't stop the order
      // Note: Check Resend dashboard to verify domain is configured
      // For testing, set EMAIL_FROM_ADDRESS secret to 'onboarding@resend.dev'
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