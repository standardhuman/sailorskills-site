import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import '../styles/AdminDashboard.css';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  service_type: ServiceType;
}

interface ServiceType {
  id: string;
  name: string;
  description: string;
  duration_hours: number;
  price: number;
  active: boolean;
}

interface AvailabilityRule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [newBlockedDate, setNewBlockedDate] = useState<{ date: Date | null; reason: string }>({
    date: null,
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'bookings':
          await fetchBookings();
          break;
        case 'services':
          await fetchServiceTypes();
          break;
        case 'availability':
          await fetchAvailabilityRules();
          await fetchBlockedDates();
          break;
        case 'calendar':
          await fetchBookings();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    const startDate = startOfWeek(selectedDate);
    const endDate = endOfWeek(selectedDate);
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service_types (*)
      `)
      .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
      .lte('booking_date', format(endDate, 'yyyy-MM-dd'))
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (!error) {
      setBookings(data || []);
    }
  };

  const fetchServiceTypes = async () => {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('price', { ascending: true });

    if (!error) {
      setServiceTypes(data || []);
    }
  };

  const fetchAvailabilityRules = async () => {
    const { data, error } = await supabase
      .from('availability_rules')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (!error) {
      setAvailabilityRules(data || []);
    }
  };

  const fetchBlockedDates = async () => {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .gte('date', format(new Date(), 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (!error) {
      setBlockedDates(data || []);
    }
  };

  const handleBookingStatusChange = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (!error) {
      fetchBookings();
    }
  };

  const handleServiceUpdate = async (service: ServiceType) => {
    const { error } = await supabase
      .from('service_types')
      .update({
        name: service.name,
        description: service.description,
        duration_hours: service.duration_hours,
        price: service.price,
        active: service.active
      })
      .eq('id', service.id);

    if (!error) {
      setEditingService(null);
      fetchServiceTypes();
    }
  };

  const handleAvailabilityUpdate = async (rule: AvailabilityRule) => {
    const { error } = await supabase
      .from('availability_rules')
      .update({
        start_time: rule.start_time,
        end_time: rule.end_time,
        is_available: rule.is_available
      })
      .eq('id', rule.id);

    if (!error) {
      fetchAvailabilityRules();
    }
  };

  const handleBlockDate = async () => {
    if (!newBlockedDate.date) return;

    const { error } = await supabase
      .from('blocked_dates')
      .insert({
        date: format(newBlockedDate.date, 'yyyy-MM-dd'),
        reason: newBlockedDate.reason
      });

    if (!error) {
      setNewBlockedDate({ date: null, reason: '' });
      fetchBlockedDates();
    }
  };

  const handleUnblockDate = async (id: string) => {
    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchBlockedDates();
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const renderBookingsTab = () => (
    <div className="bookings-section">
      <h2>Recent Bookings</h2>
      <div className="bookings-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Status</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{format(parseISO(booking.booking_date), 'MMM d, yyyy')}</td>
                <td>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</td>
                <td>
                  <div className="customer-info">
                    <div>{booking.customer_name}</div>
                    <div className="customer-contact">{booking.customer_email}</div>
                    {booking.customer_phone && (
                      <div className="customer-contact">{booking.customer_phone}</div>
                    )}
                  </div>
                </td>
                <td>{booking.service_type?.name}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td>${booking.total_price}</td>
                <td>
                  <select
                    value={booking.status}
                    onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="services-section">
      <h2>Service Types</h2>
      <div className="services-grid">
        {serviceTypes.map((service) => (
          <div key={service.id} className="service-admin-card">
            {editingService?.id === service.id ? (
              <div className="service-edit-form">
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="Service name"
                />
                <textarea
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Description"
                  rows={3}
                />
                <div className="form-row">
                  <input
                    type="number"
                    value={editingService.duration_hours}
                    onChange={(e) => setEditingService({ ...editingService, duration_hours: parseFloat(e.target.value) })}
                    placeholder="Duration (hours)"
                    step="0.5"
                  />
                  <input
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                    placeholder="Price"
                  />
                </div>
                <div className="form-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={editingService.active}
                      onChange={(e) => setEditingService({ ...editingService, active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div className="button-group">
                  <button onClick={() => handleServiceUpdate(editingService)} className="btn-save">
                    Save
                  </button>
                  <button onClick={() => setEditingService(null)} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditingService(service)} className="service-display">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-meta">
                  <span>{service.duration_hours} hours</span>
                  <span>${service.price}</span>
                  <span className={service.active ? 'active' : 'inactive'}>
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAvailabilityTab = () => (
    <div className="availability-section">
      <h2>Availability Settings</h2>
      
      <div className="availability-rules">
        <h3>Weekly Schedule</h3>
        <div className="rules-table">
          {availabilityRules.map((rule) => (
            <div key={rule.id} className="availability-rule">
              <div className="day-name">{getDayName(rule.day_of_week)}</div>
              <div className="time-inputs">
                <input
                  type="time"
                  value={rule.start_time}
                  onChange={(e) => handleAvailabilityUpdate({ ...rule, start_time: e.target.value })}
                  disabled={!rule.is_available}
                />
                <span>to</span>
                <input
                  type="time"
                  value={rule.end_time}
                  onChange={(e) => handleAvailabilityUpdate({ ...rule, end_time: e.target.value })}
                  disabled={!rule.is_available}
                />
              </div>
              <label className="availability-toggle">
                <input
                  type="checkbox"
                  checked={rule.is_available}
                  onChange={(e) => handleAvailabilityUpdate({ ...rule, is_available: e.target.checked })}
                />
                <span>{rule.is_available ? 'Available' : 'Unavailable'}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="blocked-dates">
        <h3>Blocked Dates</h3>
        <div className="block-date-form">
          <DatePicker
            selected={newBlockedDate.date}
            onChange={(date) => setNewBlockedDate({ ...newBlockedDate, date })}
            minDate={new Date()}
            placeholderText="Select date to block"
            dateFormat="MMMM d, yyyy"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={newBlockedDate.reason}
            onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
          />
          <button onClick={handleBlockDate} className="btn-primary">
            Block Date
          </button>
        </div>
        
        <div className="blocked-dates-list">
          {blockedDates.map((blocked) => (
            <div key={blocked.id} className="blocked-date-item">
              <span className="date">{format(parseISO(blocked.date), 'MMM d, yyyy')}</span>
              {blocked.reason && <span className="reason">{blocked.reason}</span>}
              <button onClick={() => handleUnblockDate(blocked.id)} className="btn-remove">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCalendarView = () => {
    const weekDays = eachDayOfInterval({
      start: startOfWeek(selectedDate),
      end: endOfWeek(selectedDate)
    });

    return (
      <div className="calendar-section">
        <h2>Calendar View</h2>
        <div className="calendar-controls">
          <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}>
            Previous Week
          </button>
          <span className="current-week">
            {format(startOfWeek(selectedDate), 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d, yyyy')}
          </span>
          <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}>
            Next Week
          </button>
        </div>
        
        <div className="calendar-grid">
          {weekDays.map((day) => {
            const dayBookings = bookings.filter(b => b.booking_date === format(day, 'yyyy-MM-dd'));
            const isBlocked = blockedDates.some(b => b.date === format(day, 'yyyy-MM-dd'));
            
            return (
              <div key={day.toISOString()} className={`calendar-day ${isBlocked ? 'blocked' : ''}`}>
                <div className="day-header">
                  <div className="day-name">{format(day, 'EEE')}</div>
                  <div className="day-date">{format(day, 'd')}</div>
                </div>
                <div className="day-bookings">
                  {isBlocked ? (
                    <div className="blocked-indicator">Blocked</div>
                  ) : (
                    dayBookings.map((booking) => (
                      <div key={booking.id} className={`booking-slot ${getStatusColor(booking.status)}`}>
                        <div className="booking-time">
                          {booking.start_time.slice(0, 5)}
                        </div>
                        <div className="booking-name">
                          {booking.customer_name}
                        </div>
                        <div className="booking-service">
                          {booking.service_type?.name}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={activeTab === 'services' ? 'active' : ''}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
        <button
          className={activeTab === 'availability' ? 'active' : ''}
          onClick={() => setActiveTab('availability')}
        >
          Availability
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'bookings' && renderBookingsTab()}
            {activeTab === 'services' && renderServicesTab()}
            {activeTab === 'availability' && renderAvailabilityTab()}
            {activeTab === 'calendar' && renderCalendarView()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;