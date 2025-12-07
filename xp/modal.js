/**
 * Modal functionality for contact forms
 * Handles modal creation, form validation, and WhatsApp integration
 */

import { getTranslation } from './locale/translate.js';
import { 
    getUrlParam, 
    validateBrazilianPhone, 
    validateName, 
    formatBrazilianPhone,
    setButtonLoading 
} from './utils.js';
import { submitContact } from './api.js';

/**
 * Creates and displays the contact modal
 * @param {Object} options - Modal options
 * @param {string} options.experienceName - Name of the selected experience
 * @param {string|number} options.experienceId - ID of the selected experience
 */
export function openContactModal({ experienceName, experienceId }) {
    // Remove existing modal if present
    closeContactModal();

    const modal = createModalElement(experienceName, experienceId);
    document.body.appendChild(modal);
    
    // Setup modal event listeners
    setupModalEventListeners(modal, { experienceName, experienceId });
    
    // Focus on first input for accessibility
    const firstInput = modal.querySelector('#contact-name');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

/**
 * Closes and removes the contact modal
 */
export function closeContactModal() {
    const existingModal = document.getElementById('contact-modal');
    if (existingModal) {
        existingModal.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Creates the modal DOM element
 * @param {string} experienceName - Name of the experience
 * @param {string|number} experienceId - ID of the experience
 * @returns {HTMLElement} Modal element
 */
function createModalElement(experienceName, experienceId) {
    const modal = document.createElement('div');
    modal.id = 'contact-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in">
            <div class="p-8">
                <button 
                    id="close-modal" 
                    class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Fechar modal"
                >
                    &times;
                </button>
                
                <h2 id="modal-title" class="text-2xl font-bold mb-4 text-gray-900">
                    ${getTranslation('contato-whatsapp')}
                </h2>
                
                <p class="text-gray-600 mb-6">
                    Experiência: <strong>${experienceName}</strong>
                </p>
                
                <form id="contact-form" class="space-y-4" novalidate>
                    <div>
                        <label class="block text-gray-700 mb-2 font-medium" for="contact-name">
                            ${getTranslation('nome')}*
                        </label>
                        <input 
                            id="contact-name" 
                            name="name" 
                            type="text" 
                            required 
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="${getTranslation('nome-placeholder')}"
                            aria-describedby="name-error"
                        >
                        <div id="name-error" class="text-red-600 text-sm mt-1 hidden" role="alert"></div>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 mb-2 font-medium" for="contact-whatsapp">
                            WhatsApp*
                        </label>
                        <input 
                            id="contact-whatsapp" 
                            name="whatsapp" 
                            type="tel" 
                            required 
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="${getTranslation('whatsapp-placeholder')}"
                            aria-describedby="whatsapp-error"
                        >
                        <div id="whatsapp-error" class="text-red-600 text-sm mt-1 hidden" role="alert"></div>
                    </div>
                    
                    <button 
                        type="submit" 
                        id="submit-btn"
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        aria-describedby="form-error"
                    >
                        <i class="fab fa-whatsapp text-xl" aria-hidden="true"></i> 
                        ${getTranslation('enviar-mensagem')}
                    </button>
                </form>
                
                <div id="form-error" class="text-red-600 text-sm mt-4 hidden" role="alert" aria-live="polite"></div>
            </div>
        </div>
    `;
    
    return modal;
}

/**
 * Sets up all modal event listeners
 * @param {HTMLElement} modal - Modal element
 * @param {Object} options - Modal options
 */
function setupModalEventListeners(modal, { experienceName, experienceId }) {
    // Close button
    const closeBtn = modal.querySelector('#close-modal');
    closeBtn?.addEventListener('click', closeContactModal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeContactModal();
    });
    
    // Escape key to close
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeContactModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Form submission
    const form = modal.querySelector('#contact-form');
    form?.addEventListener('submit', (e) => handleFormSubmit(e, { experienceName, experienceId }));
    
    // Real-time validation
    setupRealTimeValidation(modal);
    
    // Phone formatting
    setupPhoneFormatting(modal);
}

/**
 * Sets up real-time form validation
 * @param {HTMLElement} modal - Modal element
 */
function setupRealTimeValidation(modal) {
    const nameInput = modal.querySelector('#contact-name');
    const whatsappInput = modal.querySelector('#contact-whatsapp');
    const nameError = modal.querySelector('#name-error');
    const whatsappError = modal.querySelector('#whatsapp-error');
    
    // Name validation
    nameInput?.addEventListener('blur', () => {
        const name = nameInput.value.trim();
        if (name && !validateName(name)) {
            showFieldError(nameError, 'Nome deve ter pelo menos 2 caracteres e conter apenas letras');
            nameInput.classList.add('border-red-500');
        } else {
            hideFieldError(nameError);
            nameInput.classList.remove('border-red-500');
        }
    });
    
    // WhatsApp validation
    whatsappInput?.addEventListener('blur', () => {
        const phone = whatsappInput.value.trim();
        if (phone && !validateBrazilianPhone(phone)) {
            showFieldError(whatsappError, 'Número de WhatsApp inválido');
            whatsappInput.classList.add('border-red-500');
        } else {
            hideFieldError(whatsappError);
            whatsappInput.classList.remove('border-red-500');
        }
    });
    
    // Clear errors on input
    nameInput?.addEventListener('input', () => {
        hideFieldError(nameError);
        nameInput.classList.remove('border-red-500');
    });
    
    whatsappInput?.addEventListener('input', () => {
        hideFieldError(whatsappError);
        whatsappInput.classList.remove('border-red-500');
    });
}

/**
 * Sets up phone number formatting
 * @param {HTMLElement} modal - Modal element
 */
function setupPhoneFormatting(modal) {
    const whatsappInput = modal.querySelector('#contact-whatsapp');
    if (!whatsappInput) return;
    
    whatsappInput.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        const oldValue = e.target.value;
        const newValue = formatBrazilianPhone(oldValue);
        
        if (newValue !== oldValue) {
            e.target.value = newValue;
            // Maintain cursor position after formatting
            const newCursorPosition = cursorPosition + (newValue.length - oldValue.length);
            e.target.setSelectionRange(newCursorPosition, newCursorPosition);
        }
    });
}

/**
 * Handles form submission
 * @param {Event} e - Form submit event
 * @param {Object} options - Experience options
 */
async function handleFormSubmit(e, { experienceName, experienceId }) {
    e.preventDefault();
    
    const form = e.target;
    const formError = form.parentElement.querySelector('#form-error');
    const submitBtn = form.querySelector('#submit-btn');
    
    // Get form data
    const formData = new FormData(form);
    const name = formData.get('name')?.trim();
    const whatsapp = formData.get('whatsapp')?.trim();
    const cupom = getUrlParam('cupom');
    
    // Clear previous errors
    hideFormError(formError);
    clearFieldErrors(form);
    
    // Validate form
    const validationErrors = validateForm(name, whatsapp);
    if (validationErrors.length > 0) {
        showFormError(formError, validationErrors[0]);
        highlightInvalidFields(form, name, whatsapp);
        return;
    }
    
    // Set loading state
    setButtonLoading(submitBtn, true, 'Enviando...');
    
    try {
        // Submit to Baserow
        await submitContact({
            name,
            whatsapp,
            experienceId,
            cupom
        });
        
        // Generate WhatsApp message
        const whatsappMessage = generateWhatsAppMessage(experienceName, name, whatsapp, cupom);

        // Open WhatsApp (iOS-compatible method)
        openWhatsApp(whatsappMessage);

        // Close modal
        closeContactModal();
        
    } catch (error) {
        console.error('Error submitting form:', error);
        showFormError(formError, error.message);
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Validates the contact form
 * @param {string} name - Name value
 * @param {string} whatsapp - WhatsApp value
 * @returns {Array} Array of validation errors
 */
function validateForm(name, whatsapp) {
    const errors = [];
    
    if (!name) {
        errors.push('Nome é obrigatório');
    } else if (!validateName(name)) {
        errors.push('Nome deve ter pelo menos 2 caracteres e conter apenas letras');
    }
    
    if (!whatsapp) {
        errors.push('WhatsApp é obrigatório');
    } else if (!validateBrazilianPhone(whatsapp)) {
        errors.push('Número de WhatsApp inválido');
    }
    
    return errors;
}

/**
 * Highlights invalid form fields
 * @param {HTMLElement} form - Form element
 * @param {string} name - Name value
 * @param {string} whatsapp - WhatsApp value
 */
function highlightInvalidFields(form, name, whatsapp) {
    const nameInput = form.querySelector('#contact-name');
    const whatsappInput = form.querySelector('#contact-whatsapp');
    const nameError = form.querySelector('#name-error');
    const whatsappError = form.querySelector('#whatsapp-error');
    
    if (!name || !validateName(name)) {
        nameInput?.classList.add('border-red-500');
        showFieldError(nameError, !name ? 'Nome é obrigatório' : 'Nome inválido');
    }
    
    if (!whatsapp || !validateBrazilianPhone(whatsapp)) {
        whatsappInput?.classList.add('border-red-500');
        showFieldError(whatsappError, !whatsapp ? 'WhatsApp é obrigatório' : 'WhatsApp inválido');
    }
}

/**
 * Clears all field validation errors
 * @param {HTMLElement} form - Form element
 */
function clearFieldErrors(form) {
    const inputs = form.querySelectorAll('input');
    const errors = form.querySelectorAll('[id$="-error"]');
    
    inputs.forEach(input => input.classList.remove('border-red-500'));
    errors.forEach(error => hideFieldError(error));
}

/**
 * Shows a field-specific error message
 * @param {HTMLElement} errorElement - Error element
 * @param {string} message - Error message
 */
function showFieldError(errorElement, message) {
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

/**
 * Hides a field-specific error message
 * @param {HTMLElement} errorElement - Error element
 */
function hideFieldError(errorElement) {
    if (!errorElement) return;
    errorElement.classList.add('hidden');
}

/**
 * Shows a general form error message
 * @param {HTMLElement} errorElement - Error element
 * @param {string} message - Error message
 */
function showFormError(errorElement, message) {
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

/**
 * Hides the general form error message
 * @param {HTMLElement} errorElement - Error element
 */
function hideFormError(errorElement) {
    if (!errorElement) return;
    errorElement.classList.add('hidden');
}

/**
 * Opens WhatsApp with a pre-filled message (iOS-compatible method)
 * @param {string} message - Message to send
 */
function openWhatsApp(message) {
    const whatsappUrl = `https://wa.me/5521987838986?text=${encodeURIComponent(message)}`;

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generates WhatsApp message text
 * @param {string} experienceName - Name of the experience
 * @param {string} name - Customer name
 * @param {string} whatsapp - Customer WhatsApp
 * @param {string} cupom - Optional coupon code
 * @returns {string} WhatsApp message
 */
function generateWhatsAppMessage(experienceName, name, whatsapp, cupom) {
    let message = `Olá, estou interessada no passeio ${experienceName}\nMe chamo ${name}\nTelefone ${whatsapp}`;

    if (cupom) {
        message += `\nCupom de desconto ${cupom}`;
    }

    return message;
}