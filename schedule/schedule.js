/**
 * Booking System JavaScript
 * Handles service selection, calendar, and booking flow
 */

// State management
const state = {
    currentStep: 1,
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    availableSlots: [],
    currentMonth: new Date(),
    services: []
};

// API base URL
const API_BASE = window.location.origin;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    loadServices();
    setupEventListeners();
}

/**
 * Load available services from API/database
 */
async function loadServices() {
    const serviceList = document.getElementById('service-list');

    try {
        // TODO: Replace with actual API call when Supabase is set up
        // For now, use hardcoded services matching migration seed data
        const services = [
            {
                id: '1',
                name: 'Free Consultation',
                slug: 'free-consultation',
                description: 'Discuss your sailing goals and create a personalized training plan',
                duration_minutes: 30,
                category: 'training'
            },
            {
                id: '2',
                name: 'Training Half Day',
                slug: 'training-half-day',
                description: 'Focused 4-hour sailing instruction session',
                duration_minutes: 240,
                category: 'training'
            },
            {
                id: '3',
                name: 'Training Full Day',
                slug: 'training-full-day',
                description: 'Comprehensive 8-hour sailing instruction',
                duration_minutes: 480,
                category: 'training'
            },
            {
                id: '4',
                name: 'Extended Training Session',
                slug: 'training-extended',
                description: 'Multi-day intensive training program',
                duration_minutes: 960,
                category: 'training'
            },
            {
                id: '5',
                name: 'Diving Service Quote',
                slug: 'diving-quote',
                description: 'Get a custom quote for hull cleaning, anode replacement, or inspection',
                duration_minutes: 30,
                category: 'diving'
            },
            {
                id: '6',
                name: 'Detailing Quote',
                slug: 'detailing-quote',
                description: 'Get a custom quote for boat detailing services',
                duration_minutes: 30,
                category: 'detailing'
            },
            {
                id: '7',
                name: 'Delivery Quote',
                slug: 'delivery-quote',
                description: 'Discuss your boat delivery needs and get a custom quote',
                duration_minutes: 60,
                category: 'deliveries'
            }
        ];

        state.services = services;

        serviceList.innerHTML = services.map(service => `
            <div class="service-card" data-service-id="${service.id}">
                <h3>${service.name}</h3>
                <div class="duration">${formatDuration(service.duration_minutes)}</div>
                <div class="description">${service.description}</div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => {
                const serviceId = card.dataset.serviceId;
                selectService(serviceId);
            });
        });

    } catch (error) {
        console.error('Error loading services:', error);
        serviceList.innerHTML = '<p class="error">Failed to load services. Please refresh the page.</p>';
    }
}

/**
 * Select a service
 */
function selectService(serviceId) {
    const service = state.services.find(s => s.id === serviceId);
    if (!service) return;

    state.selectedService = service;

    // Update UI
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.serviceId === serviceId);
    });

    // Auto-advance after selection
    setTimeout(() => goToStep(2), 300);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('next-button').addEventListener('click', handleNext);
    document.getElementById('back-button').addEventListener('click', handleBack);
    document.getElementById('submit-button').addEventListener('click', handleSubmit);
    document.getElementById('book-another').addEventListener('click', resetBooking);
    document.getElementById('change-service').addEventListener('click', () => goToStep(1));

    // Customer form
    document.getElementById('customer-form').addEventListener('submit', (e) => e.preventDefault());
}

/**
 * Handle Next button
 */
function handleNext() {
    if (state.currentStep === 1) {
        if (!state.selectedService) {
            alert('Please select a service');
            return;
        }
        goToStep(2);
    } else if (state.currentStep === 2) {
        if (!state.selectedDate || !state.selectedTime) {
            alert('Please select a date and time');
            return;
        }
        goToStep(3);
    }
}

/**
 * Handle Back button
 */
function handleBack() {
    if (state.currentStep > 1) {
        goToStep(state.currentStep - 1);
    }
}

/**
 * Handle booking submission
 */
async function handleSubmit() {
    const form = document.getElementById('customer-form');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Booking...';

    try {
        const formData = {
            serviceTypeId: state.selectedService.id,
            serviceName: state.selectedService.name,
            startTime: state.selectedTime.start.toISOString(),
            endTime: state.selectedTime.end.toISOString(),
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            customerPhone: document.getElementById('customer-phone').value,
            notes: document.getElementById('customer-notes').value
        };

        const response = await fetch(`${API_BASE}/api/calendar/create-booking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccess(formData);
        } else {
            throw new Error(result.message || 'Failed to create booking');
        }

    } catch (error) {
        console.error('Booking error:', error);
        alert('Failed to create booking. Please try again or contact us directly.');
        submitButton.disabled = false;
        submitButton.textContent = 'Confirm Booking';
    }
}

/**
 * Go to a specific step
 */
function goToStep(step) {
    state.currentStep = step;

    // Hide all steps
    document.querySelectorAll('.booking-step').forEach(s => s.style.display = 'none');

    // Show current step
    const steps = ['step-service', 'step-datetime', 'step-info'];
    document.getElementById(steps[step - 1]).style.display = 'block';

    // Update navigation buttons
    const backButton = document.getElementById('back-button');
    const nextButton = document.getElementById('next-button');
    const submitButton = document.getElementById('submit-button');

    backButton.style.display = step > 1 ? 'block' : 'none';
    nextButton.style.display = step < 3 ? 'block' : 'none';
    submitButton.style.display = step === 3 ? 'block' : 'none';

    // Step-specific actions
    if (step === 2) {
        updateSelectedServiceInfo();
        renderCalendar();
    } else if (step === 3) {
        updateBookingSummary();
    }
}

/**
 * Update selected service info display
 */
function updateSelectedServiceInfo() {
    const serviceName = document.getElementById('selected-service-name');
    serviceName.textContent = `${state.selectedService.name} (${formatDuration(state.selectedService.duration_minutes)})`;
}

/**
 * Render calendar
 */
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const month = state.currentMonth.getMonth();
    const year = state.currentMonth.getFullYear();

    // Calendar header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    calendar.innerHTML = `
        <div class="calendar-header">
            <button type="button" id="prev-month">&larr;</button>
            <div class="month-year">${monthNames[month]} ${year}</div>
            <button type="button" id="next-month">&rarr;</button>
        </div>
        <div class="calendar-grid">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
        `<div class="calendar-day-header">${day}</div>`
    ).join('')}
            ${generateCalendarDays(year, month)}
        </div>
    `;

    // Add navigation listeners
    document.getElementById('prev-month').addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        renderCalendar();
    });

    // Add day click listeners
    document.querySelectorAll('.calendar-day:not(.empty):not(.disabled)').forEach(day => {
        day.addEventListener('click', () => selectDate(day.dataset.date));
    });
}

/**
 * Generate calendar days
 */
function generateCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let days = '';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        days += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const isPast = date < today;
        const isToday = date.getTime() === today.getTime();
        const isSelected = state.selectedDate === dateStr;

        let classes = 'calendar-day';
        if (isPast) classes += ' disabled';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';

        days += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }

    return days;
}

/**
 * Select a date and load time slots
 */
async function selectDate(dateStr) {
    state.selectedDate = dateStr;
    state.selectedTime = null;

    // Update calendar UI
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.toggle('selected', day.dataset.date === dateStr);
    });

    // Load time slots
    await loadTimeSlots(dateStr);
}

/**
 * Load available time slots for a date
 */
async function loadTimeSlots(dateStr) {
    const timeSlotsContainer = document.getElementById('time-slots');
    timeSlotsContainer.innerHTML = '<div class="loading">Loading available times...</div>';

    try {
        const date = new Date(dateStr + 'T00:00:00');
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const params = new URLSearchParams({
            startDate: date.toISOString(),
            endDate: nextDay.toISOString(),
            serviceDuration: state.selectedService.duration_minutes,
            bufferMinutes: 30
        });

        const response = await fetch(`${API_BASE}/api/calendar/availability?${params}`);
        const result = await response.json();

        if (response.ok && result.success) {
            state.availableSlots = result.slots || [];
            renderTimeSlots();
        } else {
            throw new Error(result.message || 'Failed to load availability');
        }

    } catch (error) {
        console.error('Error loading time slots:', error);
        timeSlotsContainer.innerHTML = `
            <div class="error">
                <p>Unable to load available times. Please try again.</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">
                    Note: Google Calendar integration must be configured to show real availability.
                </p>
            </div>
        `;
    }
}

/**
 * Render time slots
 */
function renderTimeSlots() {
    const timeSlotsContainer = document.getElementById('time-slots');

    if (state.availableSlots.length === 0) {
        timeSlotsContainer.innerHTML = '<p class="placeholder">No available times for this date. Please select another date.</p>';
        return;
    }

    timeSlotsContainer.innerHTML = state.availableSlots.map((slot, index) => `
        <div class="time-slot" data-slot-index="${index}">
            ${slot.time}
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.time-slot').forEach(slotEl => {
        slotEl.addEventListener('click', () => {
            const index = parseInt(slotEl.dataset.slotIndex);
            selectTimeSlot(index);
        });
    });
}

/**
 * Select a time slot
 */
function selectTimeSlot(index) {
    const slot = state.availableSlots[index];

    state.selectedTime = {
        start: new Date(slot.start),
        end: new Date(slot.end),
        display: slot.time
    };

    // Update UI
    document.querySelectorAll('.time-slot').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
    });
}

/**
 * Update booking summary
 */
function updateBookingSummary() {
    document.getElementById('summary-service').textContent =
        `${state.selectedService.name} (${formatDuration(state.selectedService.duration_minutes)})`;

    const dateStr = new Date(state.selectedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('summary-datetime').textContent =
        `${dateStr} at ${state.selectedTime.display}`;
}

/**
 * Show success message
 */
function showSuccess(bookingData) {
    // Hide steps and navigation
    document.querySelectorAll('.booking-step').forEach(step => step.style.display = 'none');
    document.querySelector('.booking-navigation').style.display = 'none';

    // Show success message
    const successMessage = document.getElementById('success-message');
    successMessage.style.display = 'block';

    // Populate confirmation details
    document.getElementById('confirmation-email').textContent = bookingData.customerEmail;
    document.getElementById('confirmation-service').textContent = bookingData.serviceName;

    const dateStr = new Date(bookingData.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = new Date(bookingData.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('confirmation-datetime').textContent = `${dateStr} at ${timeStr}`;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Reset booking and start over
 */
function resetBooking() {
    // Reset state
    state.currentStep = 1;
    state.selectedService = null;
    state.selectedDate = null;
    state.selectedTime = null;
    state.availableSlots = [];

    // Reset form
    document.getElementById('customer-form').reset();

    // Show booking UI
    document.getElementById('success-message').style.display = 'none';
    document.querySelector('.booking-navigation').style.display = 'flex';

    // Go to first step
    goToStep(1);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Helper: Format duration
 */
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} minutes`;
    } else if (minutes === 60) {
        return '1 hour';
    } else if (minutes % 60 === 0) {
        return `${minutes / 60} hours`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }
}
