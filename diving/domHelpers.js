/**
 * DOM helper utilities module
 * Provides reusable functions for DOM manipulation
 */

/**
 * Safely get element by ID
 */
export function getElementById(id) {
    return document.getElementById(id);
}

/**
 * Safely query selector
 */
export function querySelector(selector) {
    return document.querySelector(selector);
}

/**
 * Safely query all elements
 */
export function querySelectorAll(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Show element
 */
export function show(element, displayStyle = 'block') {
    if (element) {
        element.style.display = displayStyle;
    }
}

/**
 * Hide element
 */
export function hide(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Toggle element visibility
 */
export function toggle(element, displayStyle = 'block') {
    if (element) {
        if (element.style.display === 'none') {
            element.style.display = displayStyle;
        } else {
            element.style.display = 'none';
        }
    }
}

/**
 * Add class to element
 */
export function addClass(element, className) {
    if (element && className) {
        element.classList.add(className);
    }
}

/**
 * Remove class from element
 */
export function removeClass(element, className) {
    if (element && className) {
        element.classList.remove(className);
    }
}

/**
 * Toggle class on element
 */
export function toggleClass(element, className) {
    if (element && className) {
        element.classList.toggle(className);
    }
}

/**
 * Check if element has class
 */
export function hasClass(element, className) {
    return element && element.classList.contains(className);
}

/**
 * Set element text content
 */
export function setText(element, text) {
    if (element) {
        element.textContent = text;
    }
}

/**
 * Set element HTML content
 */
export function setHTML(element, html) {
    if (element) {
        element.innerHTML = html;
    }
}

/**
 * Get input value
 */
export function getValue(element) {
    if (element) {
        if (element.type === 'checkbox' || element.type === 'radio') {
            return element.checked;
        }
        return element.value;
    }
    return null;
}

/**
 * Set input value
 */
export function setValue(element, value) {
    if (element) {
        if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = value;
        } else {
            element.value = value;
        }
    }
}

/**
 * Create element with attributes and content
 */
export function createElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);

    // Set attributes
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'dataset') {
            Object.keys(attributes[key]).forEach(dataKey => {
                element.dataset[dataKey] = attributes[key][dataKey];
            });
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });

    // Set content
    if (content !== null) {
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }
    }

    return element;
}

/**
 * Remove all children from element
 */
export function clearChildren(element) {
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

/**
 * Get form data as object
 */
export function getFormData(formElement) {
    const data = {};

    if (formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (input.name) {
                if (input.type === 'radio') {
                    if (input.checked) {
                        data[input.name] = input.value;
                    }
                } else if (input.type === 'checkbox') {
                    data[input.name] = input.checked;
                } else {
                    data[input.name] = input.value;
                }
            }
        });
    }

    return data;
}

/**
 * Set form data from object
 */
export function setFormData(formElement, data) {
    if (formElement && data) {
        Object.keys(data).forEach(key => {
            const input = formElement.querySelector(`[name="${key}"]`);
            if (input) {
                setValue(input, data[key]);
            }
        });
    }
}

/**
 * Smooth scroll to element
 */
export function scrollToElement(element, offset = 30) {
    if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetPosition = rect.top + scrollTop - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * Enable/disable element
 */
export function setEnabled(element, enabled) {
    if (element) {
        element.disabled = !enabled;
    }
}

/**
 * Add event listener with automatic cleanup
 */
export function addEventListener(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);

        // Return cleanup function
        return () => {
            element.removeEventListener(event, handler);
        };
    }
    return () => {}; // No-op cleanup
}

/**
 * Format currency value
 */
export function formatCurrency(amount) {
    if (amount % 1 === 0) {
        return `$${amount}`;
    }
    return `$${amount.toFixed(2)}`;
}

/**
 * Parse number from input value
 */
export function parseNumber(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Create formatted breakdown HTML
 */
export function createBreakdownHTML(lines) {
    return lines.map(line => {
        if (line.trim() === "") return "";

        if (line.startsWith('  • ')) {
            return `<span class="breakdown-item breakdown-detail">${line.replace('  • ', '&nbsp;&nbsp;•&nbsp;')}</span>`;
        } else if (line.startsWith('• ')) {
            return `<span class="breakdown-item">${line.replace('• ', '•&nbsp;')}</span>`;
        } else if (line.toLowerCase().includes("total estimate:") || line.toLowerCase().includes("total:") || line.toLowerCase().includes("applied minimum charge:")) {
            return `<strong class="breakdown-total-line">${line}</strong>`;
        } else if (line.toLowerCase().startsWith("service:") || line.toLowerCase().includes("surcharges applied") || line.toLowerCase().startsWith("subtotal")) {
            return `<strong class="breakdown-header">${line}</strong>`;
        }
        return `<span class="breakdown-line">${line}</span>`;
    }).join('');
}

/**
 * Debounce function for input handlers
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}