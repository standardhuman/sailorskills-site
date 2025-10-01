/**
 * Calendar API Routes
 * Handles availability checking and booking creation with Google Calendar
 */

import express from 'express';
import {
  getAvailableSlots,
  isSlotAvailable,
  createCalendarEvent,
  deleteCalendarEvent,
  getBusyTimes
} from '../src/calendar-utils.js';

const router = express.Router();

/**
 * GET /api/calendar/availability
 * Get available time slots for booking
 * Query params:
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 *   - serviceDuration: minutes
 *   - bufferMinutes: optional buffer between bookings
 */
router.get('/api/calendar/availability', async (req, res) => {
  try {
    const { startDate, endDate, serviceDuration, bufferMinutes } = req.query;

    // Validate required parameters
    if (!startDate || !endDate || !serviceDuration) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['startDate', 'endDate', 'serviceDuration']
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = parseInt(serviceDuration);
    const buffer = parseInt(bufferMinutes) || 0;

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Default business hours (can be made configurable later)
    const businessHours = {
      start: '08:00',
      end: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6] // Monday-Saturday
    };

    const availableSlots = await getAvailableSlots(
      start,
      end,
      businessHours,
      duration,
      buffer
    );

    res.json({
      success: true,
      slots: availableSlots,
      totalSlots: availableSlots.length
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      error: 'Failed to fetch availability',
      message: error.message
    });
  }
});

/**
 * POST /api/calendar/check-slot
 * Check if a specific time slot is available
 * Body:
 *   - startTime: ISO datetime string
 *   - endTime: ISO datetime string
 *   - bufferMinutes: optional
 */
router.post('/api/calendar/check-slot', async (req, res) => {
  try {
    const { startTime, endTime, bufferMinutes } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['startTime', 'endTime']
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const buffer = parseInt(bufferMinutes) || 0;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid datetime format' });
    }

    const available = await isSlotAvailable(start, end, buffer);

    res.json({
      success: true,
      available,
      slot: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking slot availability:', error);
    res.status(500).json({
      error: 'Failed to check slot availability',
      message: error.message
    });
  }
});

/**
 * GET /api/calendar/busy
 * Get busy times for a date range
 * Query params:
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 */
router.get('/api/calendar/busy', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['startDate', 'endDate']
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const busyTimes = await getBusyTimes(start, end);

    res.json({
      success: true,
      busyTimes: busyTimes.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString()
      }))
    });

  } catch (error) {
    console.error('Error fetching busy times:', error);
    res.status(500).json({
      error: 'Failed to fetch busy times',
      message: error.message
    });
  }
});

/**
 * POST /api/calendar/create-booking
 * Create a new booking and calendar event
 * Body:
 *   - startTime: ISO datetime string
 *   - endTime: ISO datetime string
 *   - customerName: string
 *   - customerEmail: string
 *   - customerPhone: string
 *   - serviceType: string
 *   - notes: optional string
 */
router.post('/api/calendar/create-booking', async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      notes
    } = req.body;

    // Validate required fields
    if (!startTime || !endTime || !customerName || !customerEmail || !serviceType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['startTime', 'endTime', 'customerName', 'customerEmail', 'serviceType']
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid datetime format' });
    }

    // Check if slot is still available (with 30-minute buffer)
    const available = await isSlotAvailable(start, end, 30);

    if (!available) {
      return res.status(409).json({
        error: 'Time slot no longer available',
        message: 'This time slot has been booked by someone else. Please choose another time.'
      });
    }

    // Create calendar event
    const eventData = {
      summary: `${serviceType} - ${customerName}`,
      description: `
Service: ${serviceType}
Customer: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone || 'Not provided'}
${notes ? `\nNotes: ${notes}` : ''}
      `.trim(),
      startTime: start,
      endTime: end,
      attendees: [
        { email: customerEmail }
      ]
    };

    const event = await createCalendarEvent(eventData);

    // TODO: Save booking to Supabase database (Phase 3)

    res.json({
      success: true,
      booking: {
        id: event.id,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        calendarEventId: event.id,
        calendarLink: event.htmlLink
      },
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

/**
 * DELETE /api/calendar/cancel-booking/:eventId
 * Cancel a booking and remove from calendar
 */
router.delete('/api/calendar/cancel-booking/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    await deleteCalendarEvent(eventId);

    // TODO: Update booking status in Supabase (Phase 3)

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});

/**
 * GET /api/calendar/health
 * Health check endpoint to verify calendar API is configured
 */
router.get('/api/calendar/health', async (req, res) => {
  try {
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REFRESH_TOKEN',
      'GOOGLE_CALENDAR_ID'
    ];

    const missing = requiredEnvVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
      return res.status(500).json({
        success: false,
        error: 'Calendar API not configured',
        missing: missing
      });
    }

    // Try to fetch busy times for today as a quick health check
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await getBusyTimes(now, tomorrow);

    res.json({
      success: true,
      message: 'Calendar API is configured and working',
      calendarId: process.env.GOOGLE_CALENDAR_ID
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Calendar API health check failed',
      message: error.message
    });
  }
});

export default router;
