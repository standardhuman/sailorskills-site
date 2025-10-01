/**
 * Google Calendar Utility Functions
 * Handles calendar operations for booking system
 */

import { google } from 'googleapis';

/**
 * Create and configure Google Calendar OAuth2 client
 */
export function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Get busy times from Google Calendar
 * @param {Date} startDate - Start of time range
 * @param {Date} endDate - End of time range
 * @returns {Array} Array of busy time slots with start and end times
 */
export async function getBusyTimes(startDate, endDate) {
  try {
    const calendar = getCalendarClient();

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: process.env.GOOGLE_CALENDAR_ID || 'primary' }]
      }
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const busyTimes = response.data.calendars[calendarId]?.busy || [];

    return busyTimes.map(slot => ({
      start: new Date(slot.start),
      end: new Date(slot.end)
    }));
  } catch (error) {
    console.error('Error fetching busy times:', error);
    throw new Error('Failed to check calendar availability');
  }
}

/**
 * Check if a specific time slot is available
 * @param {Date} startTime - Proposed start time
 * @param {Date} endTime - Proposed end time
 * @param {number} bufferMinutes - Buffer time before/after bookings
 * @returns {boolean} True if slot is available
 */
export async function isSlotAvailable(startTime, endTime, bufferMinutes = 0) {
  const busyTimes = await getBusyTimes(startTime, endTime);

  // Apply buffer to the requested time slot
  const bufferedStart = new Date(startTime.getTime() - bufferMinutes * 60000);
  const bufferedEnd = new Date(endTime.getTime() + bufferMinutes * 60000);

  // Check if any busy time overlaps with the requested slot (including buffer)
  for (const busy of busyTimes) {
    if (busy.start < bufferedEnd && busy.end > bufferedStart) {
      return false;
    }
  }

  return true;
}

/**
 * Get available time slots for a given date range
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {Object} businessHours - Business hours config (e.g., {start: '09:00', end: '17:00'})
 * @param {number} slotDuration - Duration of each slot in minutes
 * @param {number} bufferMinutes - Buffer time between slots
 * @returns {Array} Array of available time slots
 */
export async function getAvailableSlots(startDate, endDate, businessHours, slotDuration, bufferMinutes = 0) {
  const busyTimes = await getBusyTimes(startDate, endDate);
  const availableSlots = [];

  // Parse business hours
  const [startHour, startMinute] = businessHours.start.split(':').map(Number);
  const [endHour, endMinute] = businessHours.end.split(':').map(Number);

  // Iterate through each day in the range
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Skip if not a business day (assuming Mon-Sat, 1-6)
    if (businessHours.daysOfWeek && !businessHours.daysOfWeek.includes(dayOfWeek)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Create slots for this day
    let slotStart = new Date(currentDate);
    slotStart.setHours(startHour, startMinute, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    while (slotStart < dayEnd) {
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

      if (slotEnd > dayEnd) break;

      // Check if slot conflicts with busy times
      const bufferedStart = new Date(slotStart.getTime() - bufferMinutes * 60000);
      const bufferedEnd = new Date(slotEnd.getTime() + bufferMinutes * 60000);

      let isAvailable = true;
      for (const busy of busyTimes) {
        if (busy.start < bufferedEnd && busy.end > bufferedStart) {
          isAvailable = false;
          break;
        }
      }

      if (isAvailable) {
        availableSlots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          date: currentDate.toISOString().split('T')[0],
          time: slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
      }

      // Move to next slot (duration + buffer)
      slotStart = new Date(slotEnd.getTime() + bufferMinutes * 60000);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableSlots;
}

/**
 * Create a calendar event for a booking
 * @param {Object} bookingData - Booking details
 * @returns {Object} Created event
 */
export async function createCalendarEvent(bookingData) {
  try {
    const calendar = getCalendarClient();

    const event = {
      summary: bookingData.summary || 'Sailor Skills Booking',
      description: bookingData.description || '',
      start: {
        dateTime: bookingData.startTime.toISOString(),
        timeZone: 'America/Los_Angeles', // San Francisco Bay timezone
      },
      end: {
        dateTime: bookingData.endTime.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      attendees: bookingData.attendees || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Update an existing calendar event
 * @param {string} eventId - Google Calendar event ID
 * @param {Object} updates - Event updates
 * @returns {Object} Updated event
 */
export async function updateCalendarEvent(eventId, updates) {
  try {
    const calendar = getCalendarClient();

    const response = await calendar.events.patch({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      requestBody: updates,
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Delete a calendar event
 * @param {string} eventId - Google Calendar event ID
 */
export async function deleteCalendarEvent(eventId) {
  try {
    const calendar = getCalendarClient();

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * Get event details
 * @param {string} eventId - Google Calendar event ID
 * @returns {Object} Event details
 */
export async function getCalendarEvent(eventId) {
  try {
    const calendar = getCalendarClient();

    const response = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    throw new Error('Failed to fetch calendar event');
  }
}
