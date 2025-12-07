/**
 * Utility functions for the UP Experiences website
 * Contains common helper functions used across the application
 */

/**
 * Extracts language parameter from URL and normalizes it
 * @returns {string} Language code ('pt-br' or 'en-us')
 */
export function getUrlLang() {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');
    
    if (langParam) {
        const normalizedLang = langParam.toLowerCase();
        if (normalizedLang === 'en_us' || normalizedLang === 'en-us') return 'en-us';
        if (normalizedLang === 'pt_br' || normalizedLang === 'pt-br') return 'pt-br';
    }
    
    // Default to Portuguese
    return 'pt-br';
}

/**
 * Gets a parameter value from the current URL
 * @param {string} param - Parameter name to extract
 * @returns {string} Parameter value or empty string if not found
 */
export function getUrlParam(param) {
    const url = new URL(window.location.href);
    return url.searchParams.get(param) || '';
}

/**
 * Validates a Brazilian phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid Brazilian phone format
 */
export function validateBrazilianPhone(phone) {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Brazilian phone: 11 digits (with area code) or 10 digits (landline)
    // Mobile: (XX) 9XXXX-XXXX = 11 digits
    // Landline: (XX) XXXX-XXXX = 10 digits
    return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Formats a phone number with Brazilian mask
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export function formatBrazilianPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11) {
        // Mobile format: (XX) 9XXXX-XXXX
        return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
        // Landline format: (XX) XXXX-XXXX
        return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
}

/**
 * Validates a name field (minimum 2 characters, only letters and spaces)
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid name
 */
export function validateName(name) {
    const trimmedName = name.trim();
    // At least 2 characters, only letters, spaces, accented characters, and hyphens
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-]{2,}$/;
    return nameRegex.test(trimmedName);
}

/**
 * Shows an error message in a specific element
 * @param {HTMLElement} element - Element to show error in
 * @param {string} message - Error message to display
 */
export function showError(element, message) {
    if (!element) return;
    
    element.textContent = message;
    element.classList.remove('hidden');
    
    // Hide error after 5 seconds
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

/**
 * Hides an error message element
 * @param {HTMLElement} element - Element to hide
 */
export function hideError(element) {
    if (!element) return;
    element.classList.add('hidden');
}

/**
 * Smooth scroll to an element
 * @param {string} elementId - ID of the element to scroll to
 * @param {number} offset - Optional offset from the top (default: 0)
 */
export function smoothScrollTo(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const targetPosition = elementPosition - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
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

/**
 * Creates a loading state for buttons
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} isLoading - Whether to show loading state
 * @param {string} loadingText - Text to show during loading
 */
export function setButtonLoading(button, isLoading, loadingText = 'Carregando...') {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = `
            <i class="fas fa-spinner fa-spin mr-2"></i>
            ${loadingText}
        `;
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

/**
 * Validates if a string is a valid image URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL appears to be a valid image URL
 */
export function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    
    // Basic URL format check
    try {
        new URL(trimmedUrl);
    } catch {
        return false;
    }
    
    // Check for common image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
    
    // Check for common image hosting domains or extensions
    const isImageUrl = 
        imageExtensions.test(trimmedUrl) ||
        trimmedUrl.includes('images') ||
        trimmedUrl.includes('photos') ||
        trimmedUrl.includes('media') ||
        trimmedUrl.includes('img') ||
        trimmedUrl.includes('baserow.io') || // Baserow file URLs
        trimmedUrl.includes('amazonaws.com') || // AWS S3
        trimmedUrl.includes('cloudinary.com') || // Cloudinary
        trimmedUrl.includes('unsplash.com'); // Unsplash
    
    return isImageUrl;
}

/**
 * Preloads an image to check if it exists and loads successfully
 * @param {string} url - Image URL to preload
 * @returns {Promise<boolean>} Promise that resolves to true if image loads
 */
export function preloadImage(url) {
    return new Promise((resolve) => {
        if (!isValidImageUrl(url)) {
            resolve(false);
            return;
        }
        
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
    });
}