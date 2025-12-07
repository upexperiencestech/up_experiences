/**
 * Main application entry point
 * Coordinates all functionality and initializes the app
 */

import { loadTranslations, getTranslation } from './locale/translate.js';
import { openContactModal } from './modal.js';
import { getUrlLang } from './utils.js';
import { fetchExperiences, formatExperienceData, validateExperienceData } from './api.js';
import { 
    renderExperiences, 
    updateLanguageLabels, 
    setupSmoothScrolling, 
    setupLanguageSelector, 
    setupRetryButton,
    showLoading,
    hideLoading,
    showError,
    showData
} from './ui.js';

// Application state
const appState = {
    currentLang: getUrlLang(),
    cachedData: null,
    translations: {},
    isLoading: false
};

/**
 * Initializes the application
 */
async function initializeApp() {
    try {
        console.log('[INIT] Starting application initialization');
        console.log('[INIT] Current URL:', window.location.href);
        console.log('[INIT] Current language:', appState.currentLang);

        // Setup UI components that don't depend on data
        setupSmoothScrolling();
        setupLanguageSelector(handleLanguageChange);
        setupRetryButton(handleRetry);

        // Set initial language in selector
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = appState.currentLang;
        }

        // Load initial data
        console.log('[INIT] Loading app data...');
        await loadAppData();
        console.log('[INIT] App initialization complete');

    } catch (error) {
        console.error('[INIT] Error initializing app:', error);
        showError('Erro ao inicializar a aplicação. Recarregue a página.');
    }
}

/**
 * Loads translations and experience data
 */
async function loadAppData() {
    if (appState.isLoading) return;
    
    appState.isLoading = true;
    showLoading();
    
    try {
        // Load translations first (they're smaller and faster)
        await loadTranslationsForLanguage(appState.currentLang);
        
        // Load experiences data if not cached
        if (!appState.cachedData) {
            appState.cachedData = await fetchExperiences();
        }
        
        // Render the data
        renderData();
        
    } catch (error) {
        console.error('Error loading app data:', error);
        
        // Show different errors based on what failed
        if (!appState.translations || Object.keys(appState.translations).length === 0) {
            showError('Erro ao carregar traduções. Verifique sua conexão.');
        } else {
            showError(error.message || 'Erro ao carregar experiências. Tente novamente.');
        }
    } finally {
        appState.isLoading = false;
        hideLoading();
    }
}

/**
 * Loads translations for a specific language
 * @param {string} language - Language code
 */
async function loadTranslationsForLanguage(language) {
    try {
        appState.translations = await loadTranslations(language);
        updateLanguageLabels(appState.translations);
    } catch (error) {
        console.error('Error loading translations:', error);
        
        // Fallback to default language if current language fails
        if (language !== 'pt-br') {
            console.warn('Falling back to Portuguese translations');
            appState.currentLang = 'pt-br';
            appState.translations = await loadTranslations('pt-br');
            updateLanguageLabels(appState.translations);
        } else {
            throw new Error('Não foi possível carregar as traduções');
        }
    }
}

/**
 * Renders experience data to the UI
 */
function renderData() {
    if (!appState.cachedData || !appState.cachedData.results) {
        showError('Nenhuma experiência encontrada.');
        return;
    }
    
    try {
        // Format and validate experience data
        const formattedExperiences = appState.cachedData.results
            .filter(validateExperienceData)
            .map(experience => formatExperienceData(experience, appState.currentLang));
        
        if (formattedExperiences.length === 0) {
            showError('Nenhuma experiência válida encontrada.');
            return;
        }
        
        // Render experiences
        renderExperiences(formattedExperiences, handleContactClick);
        
    } catch (error) {
        console.error('Error rendering data:', error);
        showError('Erro ao exibir experiências.');
    }
}

/**
 * Handles language change events
 * @param {string} newLang - New language code
 */
async function handleLanguageChange(newLang) {
    if (newLang === appState.currentLang) return;
    
    const previousLang = appState.currentLang;
    appState.currentLang = newLang;
    
    try {
        // Load new translations
        await loadTranslationsForLanguage(newLang);
        
        // Re-render data with new language if we have cached data
        if (appState.cachedData) {
            renderData();
        }
        
    } catch (error) {
        console.error('Error changing language:', error);
        
        // Revert to previous language on error
        appState.currentLang = previousLang;
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = previousLang;
        }
        
        throw error; // Re-throw for UI handling
    }
}

/**
 * Handles contact button clicks
 * @param {Object} options - Contact options
 * @param {string} options.experienceId - Experience ID
 * @param {string} options.experienceName - Experience name
 */
function handleContactClick({ experienceId, experienceName }) {
    try {
        openContactModal({
            experienceId,
            experienceName
        });
    } catch (error) {
        console.error('Error opening contact modal:', error);
        alert('Erro ao abrir formulário de contato. Tente novamente.');
    }
}

/**
 * Handles retry button clicks
 */
async function handleRetry() {
    // Clear cached data to force fresh fetch
    appState.cachedData = null;
    await loadAppData();
}

/**
 * Sets up error handling for the entire application
 */
function setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Prevent default browser error handling
        event.preventDefault();
        
        // Show user-friendly error if app is in a broken state
        if (appState.isLoading) {
            hideLoading();
            showError('Erro inesperado. Tente recarregar a página.');
        }
    });
    
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('JavaScript error:', event.error);
        
        // Only show error to user if it's critical
        if (event.error && event.error.message.includes('fetch')) {
            showError('Erro de conexão. Verifique sua internet.');
        }
    });
}

/**
 * Document ready handler
 */
function onDocumentReady() {
    setupGlobalErrorHandling();
    initializeApp();
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDocumentReady);
} else {
    onDocumentReady();
}

// Export current state for debugging (development only)
if (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development') {
    window.appState = appState;
}