import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, setHours, setMinutes, addHours, isSameDay, isAfter, isBefore } from 'date-fns';
import '../styles/BookingPage.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface ServiceType {
  id: string;
  name: string;
  description: string;
  duration_hours: number;
  price: number;
  type: string;
  max_participants: number;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface BookingFormData {
  service_type_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: Date | null;
  start_time: Date | null;
  participants: number;
  notes: string;
}

const BookingPage: React.FC = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<BookingFormData>({
    service_type_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    booking_date: null,
    start_time: null,
    participants: 1,
    notes: ''
  });

  useEffect(() => {
    fetchServiceTypes();
    fetchBlockedDates();
  }, []);

  useEffect(() => {
    if (formData.booking_date) {
      fetchAvailableSlots(formData.booking_date);
    }
  }, [formData.booking_date, selectedService]);

  const fetchServiceTypes = async () => {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching service types:', error);
    } else {
      setServiceTypes(data || []);
    }
  };

  const fetchBlockedDates = async () => {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('date')
      .gte('date', format(new Date(), 'yyyy-MM-dd'))
      .lte('date', format(addDays(new Date(), 90), 'yyyy-MM-dd'));

    if (error) {
      console.error('Error fetching blocked dates:', error);
    } else {
      setBlockedDates((data || []).map(d => new Date(d.date)));
    }
  };

  const fetchAvailableSlots = async (date: Date) => {
    if (!selectedService) return;

    const dayOfWeek = date.getDay();
    
    // Get availability rules for this day
    const { data: rules, error: rulesError } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .single();

    if (rulesError || !rules || !rules.is_available) {
      setAvailableSlots([]);
      return;
    }

    // Get existing bookings for this date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('booking_date', format(date, 'yyyy-MM-dd'))
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('Error fetching bookings:', error);
      return;
    }

    // Generate time slots
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = rules.start_time.split(':').map(Number);
    const [endHour, endMinute] = rules.end_time.split(':').map(Number);
    
    let currentSlot = setMinutes(setHours(date, startHour), startMinute);
    const dayEnd = setMinutes(setHours(date, endHour), endMinute);
    
    while (isBefore(addHours(currentSlot, selectedService.duration_hours), dayEnd)) {
      const slotEnd = addHours(currentSlot, selectedService.duration_hours);
      
      // Check if slot conflicts with existing bookings
      const hasConflict = (bookings || []).some(booking => {
        const bookingStart = new Date(`${format(date, 'yyyy-MM-dd')}T${booking.start_time}`);
        const bookingEnd = new Date(`${format(date, 'yyyy-MM-dd')}T${booking.end_time}`);
        
        return (
          (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (currentSlot <= bookingStart && slotEnd >= bookingEnd)
        );
      });
      
      slots.push({
        start: currentSlot,
        end: slotEnd,
        available: !hasConflict && isAfter(currentSlot, addHours(new Date(), 24))
      });
      
      currentSlot = addMinutes(currentSlot, 30); // 30-minute intervals
    }
    
    setAvailableSlots(slots);
  };

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setFormData({
      ...formData,
      service_type_id: service.id,
      start_time: null
    });
  };

  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      booking_date: date,
      start_time: null
    });
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (slot.available) {
      setFormData({
        ...formData,
        start_time: slot.start
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !formData.booking_date || !formData.start_time) {
      setError('Please select a service, date, and time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endTime = addHours(formData.start_time, selectedService.duration_hours);
      
      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          service_type_id: formData.service_type_id,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          booking_date: format(formData.booking_date, 'yyyy-MM-dd'),
          start_time: format(formData.start_time, 'HH:mm:ss'),
          end_time: format(endTime, 'HH:mm:ss'),
          participants: formData.participants,
          notes: formData.notes,
          total_price: selectedService.price * formData.participants,
          status: 'pending'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Process payment if not free
      if (selectedService.price > 0) {
        const response = await fetch('/api/create-booking-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: booking.id,
            amount: selectedService.price * formData.participants * 100,
            customer_email: formData.customer_email,
            service_name: selectedService.name
          }),
        });

        const { sessionId } = await response.json();
        const stripe = await stripePromise;
        
        if (stripe) {
          const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId,
          });
          
          if (stripeError) {
            throw stripeError;
          }
        }
      } else {
        // Free consultation - directly confirm
        setSuccess(true);
        
        // Send confirmation email
        await fetch('/api/send-booking-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ booking_id: booking.id }),
        });
      }
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMinutes = (date: Date, minutes: number) => {
    return new Date(date.getTime() + minutes * 60000);
  };

  const isDateDisabled = (date: Date) => {
    return blockedDates.some(blocked => isSameDay(blocked, date));
  };

  if (success) {
    return (
      <div className="booking-container">
        <div className="success-message">
          <h2>Booking Confirmed!</h2>
          <p>Thank you for your booking. You will receive a confirmation email shortly.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Book Another Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h1>Book a Session</h1>
        <p className="subtitle">Select your preferred training option and schedule a time that works for you</p>
      </div>

      {/* Service Selection */}
      <div className="service-selection">
        <h2>1. Choose Your Service</h2>
        <div className="service-grid">
          {serviceTypes.map((service) => (
            <div
              key={service.id}
              className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
              onClick={() => handleServiceSelect(service)}
            >
              <div className="service-header">
                <h3>{service.name}</h3>
                <p className="service-duration">{service.duration_hours} hr{service.duration_hours > 1 ? 's' : ''}</p>
              </div>
              <p className="service-description">{service.description}</p>
              <div className="service-price">
                {service.price === 0 ? 'Free' : `$${service.price}`}
              </div>
              {service.max_participants > 1 && (
                <p className="service-participants">Up to {service.max_participants} participants</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedService && (
        <>
          {/* Date & Time Selection */}
          <div className="datetime-selection">
            <h2>2. Select Date & Time</h2>
            <div className="datetime-grid">
              <div className="date-picker-container">
                <label>Select Date</label>
                <DatePicker
                  selected={formData.booking_date}
                  onChange={handleDateChange}
                  minDate={addDays(new Date(), 1)}
                  maxDate={addDays(new Date(), 90)}
                  filterDate={(date) => !isDateDisabled(date)}
                  placeholderText="Choose a date"
                  dateFormat="MMMM d, yyyy"
                  className="date-input"
                />
              </div>

              {formData.booking_date && (
                <div className="time-slots-container">
                  <label>Available Times</label>
                  <div className="time-slots">
                    {availableSlots.length === 0 ? (
                      <p className="no-slots">No available slots for this date</p>
                    ) : (
                      availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`time-slot ${!slot.available ? 'unavailable' : ''} ${
                            formData.start_time && isSameDay(formData.start_time, slot.start) &&
                            format(formData.start_time, 'HH:mm') === format(slot.start, 'HH:mm')
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() => handleTimeSelect(slot)}
                          disabled={!slot.available}
                        >
                          {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {formData.start_time && (
            <div className="contact-form">
              <h2>3. Your Information</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {selectedService.max_participants > 1 && (
                    <div className="form-group">
                      <label htmlFor="participants">Number of Participants</label>
                      <select
                        id="participants"
                        value={formData.participants}
                        onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) })}
                      >
                        {Array.from({ length: selectedService.max_participants }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'person' : 'people'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label htmlFor="notes">Additional Notes</label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Any special requests or information we should know?"
                    />
                  </div>
                </div>

                <div className="booking-summary">
                  <h3>Booking Summary</h3>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Service:</span>
                      <span>{selectedService.name}</span>
                    </div>
                    <div className="summary-row">
                      <span>Date:</span>
                      <span>{formData.booking_date && format(formData.booking_date, 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="summary-row">
                      <span>Time:</span>
                      <span>
                        {formData.start_time &&
                          `${format(formData.start_time, 'h:mm a')} - ${format(
                            addHours(formData.start_time, selectedService.duration_hours),
                            'h:mm a'
                          )}`}
                      </span>
                    </div>
                    {formData.participants > 1 && (
                      <div className="summary-row">
                        <span>Participants:</span>
                        <span>{formData.participants}</span>
                      </div>
                    )}
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>
                        {selectedService.price === 0
                          ? 'Free'
                          : `$${(selectedService.price * formData.participants).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="btn-primary submit-btn" disabled={loading}>
                  {loading
                    ? 'Processing...'
                    : selectedService.price === 0
                    ? 'Confirm Booking'
                    : 'Proceed to Payment'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BookingPage;