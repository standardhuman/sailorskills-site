import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function saveQuote(quoteData) {
    try {
        // Prepare data for insertion
        const quoteRecord = {
            quote_number: quoteData.quoteNumber,
            quote_date: quoteData.quoteDate,
            expiry_date: quoteData.expiryDate,
            valid_days: quoteData.validDays,

            // Customer info
            customer_name: quoteData.customer.name,
            customer_email: quoteData.customer.email,
            customer_phone: quoteData.customer.phone,
            boat_name: quoteData.customer.boatName,
            boat_make: quoteData.customer.boatMake,
            marina: quoteData.customer.marina,
            slip: quoteData.customer.slip,

            // Service details
            service_type: quoteData.service?.type,
            service_name: quoteData.service?.name,
            boat_length: quoteData.service?.boatLength,
            paint_condition: quoteData.service?.paintCondition,
            growth_level: quoteData.service?.growthLevel,
            has_twin_engines: quoteData.service?.hasTwinEngines,
            additional_hulls: quoteData.service?.additionalHulls,

            // Pricing
            base_price: quoteData.pricing?.basePrice,
            rate_per_foot: quoteData.pricing?.ratePerFoot,
            anode_cost: quoteData.pricing?.anodeCost,
            anode_labor_cost: quoteData.pricing?.anodeLaborCost,
            total_cost: quoteData.pricing?.totalCost,
            currency: quoteData.pricing?.currency || 'USD',

            // Anodes as JSON
            anodes: quoteData.anodes || [],

            // Status
            status: 'sent',
            created_by: 'admin'
        };

        // Insert into Supabase
        const { data, error } = await supabase
            .from('quotes')
            .insert([quoteRecord])
            .select()
            .single();

        if (error) {
            console.error('Error saving quote to Supabase:', error);
            throw error;
        }

        console.log('Quote saved successfully:', data);
        return { success: true, quote: data };

    } catch (error) {
        console.error('Error in saveQuote:', error);
        return { success: false, error: error.message };
    }
}

export async function getQuote(quoteNumber) {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('quote_number', quoteNumber)
            .single();

        if (error) {
            console.error('Error fetching quote:', error);
            throw error;
        }

        // Update viewed_at timestamp if not already viewed
        if (data && !data.viewed_at) {
            await supabase
                .from('quotes')
                .update({ viewed_at: new Date().toISOString() })
                .eq('quote_number', quoteNumber);
        }

        return { success: true, quote: data };

    } catch (error) {
        console.error('Error in getQuote:', error);
        return { success: false, error: error.message };
    }
}

export async function updateQuoteStatus(quoteNumber, status) {
    try {
        const updateData = { status };

        // Add appropriate timestamp based on status
        if (status === 'accepted') {
            updateData.accepted_at = new Date().toISOString();
        } else if (status === 'rejected') {
            updateData.rejected_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('quotes')
            .update(updateData)
            .eq('quote_number', quoteNumber)
            .select()
            .single();

        if (error) {
            console.error('Error updating quote status:', error);
            throw error;
        }

        return { success: true, quote: data };

    } catch (error) {
        console.error('Error in updateQuoteStatus:', error);
        return { success: false, error: error.message };
    }
}

export async function listQuotes(filters = {}) {
    try {
        let query = supabase
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.customer_email) {
            query = query.eq('customer_email', filters.customer_email);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.from_date) {
            query = query.gte('created_at', filters.from_date);
        }
        if (filters.to_date) {
            query = query.lte('created_at', filters.to_date);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error listing quotes:', error);
            throw error;
        }

        return { success: true, quotes: data };

    } catch (error) {
        console.error('Error in listQuotes:', error);
        return { success: false, error: error.message };
    }
}