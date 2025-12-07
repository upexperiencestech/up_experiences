/**
 * UI rendering and interaction functions
 * Handles DOM manipulation and user interface updates
 */

import { getTranslation } from './locale/translate.js';

/**
 * Shows loading state
 */
export function showLoading() {
    const loadingElement = document.getElementById('loadingState');
    const dataContainer = document.getElementById('dynamicData');
    const errorElement = document.getElementById('errorState');
    
    if (loadingElement) loadingElement.classList.remove('hidden');
    if (dataContainer) dataContainer.classList.add('hidden');
    if (errorElement) errorElement.classList.add('hidden');
}

/**
 * Hides loading state
 */
export function hideLoading() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) loadingElement.classList.add('hidden');
}

/**
 * Shows error state with message
 * @param {string} message - Error message to display
 */
export function showError(message) {
    const errorElement = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const dataContainer = document.getElementById('dynamicData');
    const loadingElement = document.getElementById('loadingState');
    
    if (errorMessage) errorMessage.textContent = message;
    if (errorElement) errorElement.classList.remove('hidden');
    if (dataContainer) dataContainer.classList.add('hidden');
    if (loadingElement) loadingElement.classList.add('hidden');
}

/**
 * Hides error state
 */
export function hideError() {
    const errorElement = document.getElementById('errorState');
    if (errorElement) errorElement.classList.add('hidden');
}

/**
 * Shows data container and hides other states
 */
export function showData() {
    const dataContainer = document.getElementById('dynamicData');
    const loadingElement = document.getElementById('loadingState');
    const errorElement = document.getElementById('errorState');
    
    if (dataContainer) dataContainer.classList.remove('hidden');
    if (loadingElement) loadingElement.classList.add('hidden');
    if (errorElement) errorElement.classList.add('hidden');
}

/**
 * Creates a single experience card element
 * @param {Object} experience - Formatted experience data
 * @param {Function} onContactClick - Callback for contact button click
 * @returns {HTMLElement} Card element
 */
export function createExperienceCard(experience, onContactClick) {
    const card = document.createElement('article');
    card.className = 'bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col md:flex-row gap-6 items-center';
    card.setAttribute('role', 'article');
    card.setAttribute('aria-labelledby', `experience-title-${experience.id}`);

    // Create image HTML with better error handling and fallback
    let imageHtml = '';
    if (experience.imageUrl && experience.imageUrl.trim()) {
        imageHtml = `
            <div class="experience-image-container w-full sm:max-w-xs">
                <img 
                    src="${experience.imageUrl.trim()}" 
                    alt="Imagem da experiência: ${experience.name}" 
                    class="w-full h-48 sm:h-56 rounded-lg object-cover shadow-md hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >
                <div class="image-fallback hidden w-full h-48 sm:h-56 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-md">
                    <div class="text-center text-gray-500">
                        <i class="fas fa-image text-3xl mb-2"></i>
                        <p class="text-sm">Imagem não disponível</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Fallback when no image URL is provided
        imageHtml = `
            <div class="experience-image-container w-full sm:max-w-xs">
                <div class="w-full h-48 sm:h-56 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-md">
                    <div class="text-center text-gray-500">
                        <i class="fas fa-image text-3xl mb-2"></i>
                        <p class="text-sm">Sem imagem</p>
                    </div>
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        ${imageHtml}
        <div class="flex-1">
            <h2 id="experience-title-${experience.id}" class="text-2xl font-bold text-gray-900 mb-2">
                ${experience.name}
            </h2>
            <p class="text-gray-700 whitespace-pre-line mb-4">
                ${experience.description}
            </p>
            <button 
                type="button" 
                class="contact-btn inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" 
                data-experience-id="${experience.id}" 
                data-experience-name="${experience.name}"
                aria-label="Entrar em contato sobre ${experience.name}"
            >
                <i class='fab fa-whatsapp text-xl' aria-hidden="true"></i>
                ${getTranslation('whatsapp')}
            </button>
        </div>
    `;

    // Add event listener to contact button
    const contactBtn = card.querySelector('.contact-btn');
    if (contactBtn && onContactClick) {
        contactBtn.addEventListener('click', () => {
            onContactClick({
                experienceId: experience.id,
                experienceName: experience.name
            });
        });
    }

    return card;
}

/**
 * Renders experiences data to the DOM
 * @param {Array} experiences - Array of formatted experience data
 * @param {Function} onContactClick - Callback for contact button clicks
 */
export function renderExperiences(experiences, onContactClick) {
    const container = document.getElementById('dynamicData');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Create and append cards
    experiences.forEach((experience, index) => {
        const card = createExperienceCard(experience, onContactClick);
        
        // Add staggered animation delay
        card.style.animationDelay = `${index * 0.1}s`;
        
        container.appendChild(card);
    });

    showData();
}

/**
 * Updates text content for language changes
 * @param {Object} translations - Current translations object
 */
export function updateLanguageLabels(translations) {
    const heroTitle = document.getElementById('hero-title');
    const heroCta = document.getElementById('hero-cta');
    
    if (heroTitle && translations.heroTitle) {
        heroTitle.textContent = translations.heroTitle;
    }
    
    if (heroCta && translations.heroCta) {
        heroCta.textContent = translations.heroCta;
    }

    // Update document language attribute
    const currentLang = translations === window.translations?.['en-us'] ? 'en' : 'pt-BR';
    document.documentElement.lang = currentLang;
    
    // Update contact buttons text
    const contactButtons = document.querySelectorAll('.contact-btn');
    contactButtons.forEach(btn => {
        const icon = btn.querySelector('.fab.fa-whatsapp');
        if (icon && translations.whatsapp) {
            btn.innerHTML = `
                <i class='fab fa-whatsapp text-xl' aria-hidden="true"></i>
                ${translations.whatsapp}
            `;
        }
    });
}

/**
 * Sets up smooth scrolling for hero CTA button
 */
export function setupSmoothScrolling() {
    const heroCta = document.getElementById('hero-cta');
    if (!heroCta) return;

    heroCta.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetElement = document.getElementById('tours');
        if (!targetElement) return;

        targetElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });

        // Update focus for accessibility
        targetElement.focus({ preventScroll: true });
    });
}

/**
 * Sets up language selector functionality
 * @param {Function} onLanguageChange - Callback when language changes
 */
export function setupLanguageSelector(onLanguageChange) {
    const langSelect = document.getElementById('langSelect');
    if (!langSelect || !onLanguageChange) return;

    langSelect.addEventListener('change', async function(e) {
        const newLang = e.target.value;
        
        // Add loading state to selector
        const originalContent = langSelect.innerHTML;
        langSelect.disabled = true;
        
        try {
            await onLanguageChange(newLang);
        } catch (error) {
            console.error('Error changing language:', error);
            // Revert selection on error
            langSelect.value = langSelect.dataset.currentLang || 'pt-br';
        } finally {
            langSelect.disabled = false;
        }
        
        // Store current language for error recovery
        langSelect.dataset.currentLang = newLang;
    });
}

/**
 * Sets up retry button functionality
 * @param {Function} onRetry - Callback when retry button is clicked
 */
export function setupRetryButton(onRetry) {
    const retryButton = document.getElementById('retryButton');
    if (!retryButton || !onRetry) return;

    retryButton.addEventListener('click', onRetry);
}