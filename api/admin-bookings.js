/**
 * Admin Booking Management API
 * Handles admin operations for viewing and managing bookings
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin operations
);

/**
 * GET /api/admin/bookings
 * Get all bookings with filtering and pagination
 */
router.get('/api/admin/bookings', async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    let query = supabase
      .from('bookings')
      .select('*, service_types(name, slug)', { count: 'exact' })
      .order('booking_start', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('booking_start', startDate);
    }

    if (endDate) {
      query = query.lte('booking_start', endDate);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      bookings: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/bookings/:id
 * Get a specific booking by ID
 */
router.get('/api/admin/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bookings')
      .select('*, service_types(name, slug, duration_minutes)')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: data
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

/**
 * PATCH /api/admin/bookings/:id
 * Update a booking
 */
router.patch('/api/admin/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate allowed fields
    const allowedFields = [
      'status',
      'booking_start',
      'booking_end',
      'customer_name',
      'customer_email',
      'customer_phone',
      'customer_notes',
      'internal_notes',
      'cancellation_reason'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    // If cancelling, set cancelled_at
    if (updateData.status === 'cancelled' && !updateData.cancelled_at) {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log to booking_history
    await supabase.from('booking_history').insert({
      booking_id: id,
      changed_by: 'admin',
      change_type: 'updated',
      new_values: updateData
    });

    res.json({
      success: true,
      booking: data,
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      error: 'Failed to update booking',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/bookings/stats/summary
 * Get booking statistics
 */
router.get('/api/admin/bookings/stats/summary', async (req, res) => {
  try {
    const now = new Date().toISOString();

    // Get various counts
    const [
      totalResult,
      todayResult,
      upcomingResult,
      completedResult
    ] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .gte('booking_start', new Date().toISOString().split('T')[0])
        .lte('booking_start', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .gte('booking_start', now)
        .in('status', ['pending', 'confirmed']),
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
    ]);

    res.json({
      success: true,
      stats: {
        total: totalResult.count || 0,
        today: todayResult.count || 0,
        upcoming: upcomingResult.count || 0,
        completed: completedResult.count || 0
      }
    });

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      error: 'Failed to fetch booking stats',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/service-types
 * Get all service types
 */
router.get('/api/admin/service-types', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('display_order');

    if (error) throw error;

    res.json({
      success: true,
      serviceTypes: data
    });

  } catch (error) {
    console.error('Error fetching service types:', error);
    res.status(500).json({
      error: 'Failed to fetch service types',
      message: error.message
    });
  }
});

/**
 * PATCH /api/admin/service-types/:id
 * Update a service type
 */
router.patch('/api/admin/service-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('service_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      serviceType: data,
      message: 'Service type updated successfully'
    });

  } catch (error) {
    console.error('Error updating service type:', error);
    res.status(500).json({
      error: 'Failed to update service type',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/business-hours
 * Get business hours configuration
 */
router.get('/api/admin/business-hours', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .order('day_of_week');

    if (error) throw error;

    res.json({
      success: true,
      businessHours: data
    });

  } catch (error) {
    console.error('Error fetching business hours:', error);
    res.status(500).json({
      error: 'Failed to fetch business hours',
      message: error.message
    });
  }
});

/**
 * PATCH /api/admin/business-hours/:id
 * Update business hours
 */
router.patch('/api/admin/business-hours/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('business_hours')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      businessHour: data,
      message: 'Business hours updated successfully'
    });

  } catch (error) {
    console.error('Error updating business hours:', error);
    res.status(500).json({
      error: 'Failed to update business hours',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/blackout-dates
 * Get blackout dates
 */
router.get('/api/admin/blackout-dates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blackout_dates')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      blackoutDates: data
    });

  } catch (error) {
    console.error('Error fetching blackout dates:', error);
    res.status(500).json({
      error: 'Failed to fetch blackout dates',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/blackout-dates
 * Create a new blackout date
 */
router.post('/api/admin/blackout-dates', async (req, res) => {
  try {
    const { start_date, end_date, reason, all_day } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const { data, error } = await supabase
      .from('blackout_dates')
      .insert({
        start_date,
        end_date,
        reason,
        all_day: all_day !== false,
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      blackoutDate: data,
      message: 'Blackout date created successfully'
    });

  } catch (error) {
    console.error('Error creating blackout date:', error);
    res.status(500).json({
      error: 'Failed to create blackout date',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/blackout-dates/:id
 * Delete a blackout date
 */
router.delete('/api/admin/blackout-dates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('blackout_dates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Blackout date deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting blackout date:', error);
    res.status(500).json({
      error: 'Failed to delete blackout date',
      message: error.message
    });
  }
});

export default router;
