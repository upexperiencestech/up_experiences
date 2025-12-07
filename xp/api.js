/**
 * API functions for Baserow integration
 * Handles all communication with the Baserow database
 */

import { isValidImageUrl } from './utils.js';

// API Configuration - keeping token hardcoded as requested
const BASEROW_TOKEN = 'B1DXUzsApnrWG5NVa4KVTLloCaenctec';
const EXPERIENCES_TABLE_URL = 'https://api.baserow.io/api/database/rows/table/583812/?user_field_names=true';
const CONTACTS_TABLE_URL = 'https://api.baserow.io/api/database/rows/table/592260/?user_field_names=true';

/**
 * Base headers for Baserow API requests
 */
const getBaseHeaders = () => ({
    'Authorization': `Token ${BASEROW_TOKEN}`,
    'Content-Type': 'application/json'
});

/**
 * Fetches experiences data from Baserow
 * @returns {Promise<Object>} API response with experiences data
 * @throws {Error} If the request fails
 */
export async function fetchExperiences() {
    try {
        console.log('[API] Fetching experiences from:', EXPERIENCES_TABLE_URL);
        console.log('[API] Using headers:', getBaseHeaders());

        const response = await fetch(EXPERIENCES_TABLE_URL, {
            headers: getBaseHeaders()
        });

        console.log('[API] Response status:', response.status);
        console.log('[API] Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[API] Data received:', data);

        // Validate response structure
        if (!data.results || !Array.isArray(data.results)) {
            console.error('[API] Invalid data structure:', data);
            throw new Error('Invalid response format from API');
        }

        console.log('[API] Successfully fetched', data.results.length, 'experiences');
        return data;
    } catch (error) {
        console.error('[API] Error fetching experiences:', error);
        console.error('[API] Error name:', error.name);
        console.error('[API] Error message:', error.message);
        console.error('[API] Error stack:', error.stack);
        throw new Error('Não foi possível carregar as experiências. Tente novamente mais tarde.');
    }
}

/**
 * Submits a contact form to Baserow
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.name - Customer name
 * @param {string} contactData.whatsapp - WhatsApp number
 * @param {number} contactData.experienceId - ID of the selected experience
 * @param {string} contactData.cupom - Optional coupon code
 * @returns {Promise<Object>} API response
 * @throws {Error} If the request fails
 */
export async function submitContact({ name, whatsapp, experienceId, cupom }) {
    try {
        // Prepare request body
        const body = {
            Name: name.trim(),
            Whatsapp: whatsapp.trim(),
            Experiências: [Number(experienceId)]
        };

        // Add coupon if provided
        if (cupom && cupom.trim()) {
            body.Parceiro_id = cupom.trim();
        }

        const response = await fetch(CONTACTS_TABLE_URL, {
            method: 'POST',
            headers: getBaseHeaders(),
            body: JSON.stringify(body)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('Baserow error:', responseData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return responseData;
    } catch (error) {
        console.error('Error submitting contact:', error);
        
        // Provide user-friendly error messages
        if (error.message.includes('HTTP error')) {
            throw new Error('Erro no servidor. Tente novamente em alguns minutos.');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        } else {
            throw new Error('Erro ao enviar mensagem. Tente novamente.');
        }
    }
}

/**
 * Validates experience data structure
 * @param {Object} experience - Experience object to validate
 * @returns {boolean} True if valid experience structure
 */
export function validateExperienceData(experience) {
    const hasValidId = experience && typeof experience === 'object' && experience.id;
    const hasValidName = experience.Name_pt_br || experience.Name_en_us;
    const hasValidDescription = experience.Description_pt_br || experience.Description_en_us;
    
    // Optional: Check if has some form of image (Image URL field or Image array)
    const hasImage = 
        (experience['Image URL'] && typeof experience['Image URL'] === 'string') ||
        (experience.Image && Array.isArray(experience.Image) && experience.Image.length > 0);
    
    // Log warning if no image found (but don't fail validation)
    if (hasValidId && hasValidName && hasValidDescription && !hasImage) {
        console.warn(`Experience ${experience.id} has no image (neither Image URL nor Image array)`);
    }
    
    return hasValidId && hasValidName && hasValidDescription;
}

/**
 * Formats experience data for rendering
 * @param {Object} experience - Raw experience data from API
 * @param {string} language - Current language ('pt-br' or 'en-us')
 * @returns {Object} Formatted experience data
 */
export function formatExperienceData(experience, language) {
    const name = language === 'en-us' ? experience.Name_en_us : experience.Name_pt_br;
    const description = language === 'en-us' ? experience.Description_en_us : experience.Description_pt_br;
    
    // Extract image URL - Priority: Image URL field > Image thumbnails > fallback
    let imageUrl = '';
    
    // First try: Check for Image URL field (direct URL)
    if (experience['Image URL'] && typeof experience['Image URL'] === 'string') {
        const candidateUrl = experience['Image URL'].trim();
        if (isValidImageUrl(candidateUrl)) {
            imageUrl = candidateUrl;
        } else {
            console.warn(`Invalid Image URL for experience ${experience.id}: ${candidateUrl}`);
        }
    }
    
    // Second try: Check for Image array with thumbnails (existing logic)
    if (!imageUrl && experience.Image && 
        Array.isArray(experience.Image) && 
        experience.Image[0] && 
        experience.Image[0].thumbnails && 
        experience.Image[0].thumbnails.card_cover) {
        const candidateUrl = experience.Image[0].thumbnails.card_cover.url;
        if (isValidImageUrl(candidateUrl)) {
            imageUrl = candidateUrl;
        }
    }
    
    // Third try: Check for Image array with original URL
    if (!imageUrl && experience.Image && 
        Array.isArray(experience.Image) && 
        experience.Image[0] && 
        experience.Image[0].url) {
        const candidateUrl = experience.Image[0].url;
        if (isValidImageUrl(candidateUrl)) {
            imageUrl = candidateUrl;
        }
    }

    // Log for debugging
    if (!imageUrl) {
        console.info(`No valid image found for experience ${experience.id} (${name})`);
    } else {
        console.info(`Using image URL for experience ${experience.id}: ${imageUrl}`);
    }

    return {
        id: experience.id,
        name: name || 'Experiência sem nome',
        description: description || 'Descrição não disponível',
        imageUrl,
        originalData: experience
    };
}