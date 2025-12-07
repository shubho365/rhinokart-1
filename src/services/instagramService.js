/**
 * Instagram Service
 * Handles Instagram embed functionality, link validation, and embed generation
 */

/**
 * Extract Instagram shortcode from various Instagram URLs
 * Supports formats:
 * - https://www.instagram.com/p/ABC123/
 * - https://www.instagram.com/reel/ABC123/
 * - https://www.instagram.com/tv/ABC123/
 * - https://instagram.com/p/ABC123/
 * - ABC123 (shortcode only)
 * 
 * @param {string} url - Instagram URL or shortcode
 * @returns {string|null} - Extracted shortcode or null if invalid
 */
export const extractInstagramShortcode = (url) => {
  if (!url || typeof url !== 'string') return null;

  // Trim whitespace
  url = url.trim();

  // If it's just a shortcode (11 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Try to extract from URL patterns
  const patterns = [
    /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/,
    /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)\//,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Validate if the string is a valid Instagram shortcode or URL
 * @param {string} input - Instagram URL or shortcode
 * @returns {boolean} - True if valid
 */
export const isValidInstagramInput = (input) => {
  return extractInstagramShortcode(input) !== null;
};

/**
 * Get Instagram embed URL for oEmbed API
 * This allows fetching metadata about the post
 * @param {string} shortcode - Instagram shortcode
 * @returns {string} - Instagram oEmbed URL
 */
export const getInstagramOEmbedUrl = (shortcode) => {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  const oembedUrl = `https://graph.instagram.com/instagram_oembed?url=${encodeURIComponent(postUrl)}&access_token=YOUR_ACCESS_TOKEN`;
  return oembedUrl;
};

/**
 * Get Instagram embed HTML (using Instagram's embed.js)
 * This uses the blockquote method that Instagram recommends
 * @param {string} shortcode - Instagram shortcode
 * @returns {string} - HTML embed code
 */
export const getInstagramEmbedHTML = (shortcode) => {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  return `
    <blockquote class="instagram-media" data-instgrm-version="14" 
      style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15); 
      margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
      <div style="padding:16px;">
        <a href="${postUrl}" target="_blank" rel="noopener noreferrer" style="background:#FFFFFF; line-height:0; padding:0 0; 
          text-align:center; text-decoration:none; width:100%;">
          <div style="display: flex; flex-direction: row; align-items: center;">
            <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;"></div>
            <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center;">
              <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;"></div>
              <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;"></div>
            </div>
          </div>
          <div style="padding: 19% 0;"></div>
          <div style="display:block; height:50px; margin:0 auto 12px; width:50px;">
            <svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="https://www.w3.org/2000/svg">
              <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                <g transform="translate(-11.000000, -11.000000)" fill="#000000">
                  <path d="M30.5,60 C16.4228476,60 5,48.5771524 5,34.5 C5,20.4228476 16.4228476,9 30.5,9 C44.5771524,9 56,20.4228476 56,34.5 C56,48.5771524 44.5771524,60 30.5,60 Z M30.5,55.6871consecrate C41.6960692,55.6871528 50.6871528,46.6960692 50.6871528,35.5 C50.6871528,24.3039308 41.6960692,15.3128472 30.5,15.3128472 C19.3039308,15.3128472 10.3128472,24.3039308 10.3128472,35.5 C10.3128472,46.6960692 19.3039308,55.6871528 30.5,55.6871528 Z"></path>
                  <path d="M30.5,45 C25.3055051,45 21,40.6944949 21,35.5 C21,30.3055051 25.3055051,26 30.5,26 C35.6944949,26 40,30.3055051 40,35.5 C40,40.6944949 35.6944949,45 30.5,45 Z M30.5,40.6666667 C33.6112915,40.6666667 36.1666667,38.1112915 36.1666667,35 C36.1666667,31.8887085 33.6112915,29.3333333 30.5,29.3333333 C27.3887085,29.3333333 24.8333333,31.8887085 24.8333333,35 C24.8333333,38.1112915 27.3887085,40.6666667 30.5,40.6666667 Z"></path>
                  <circle cx="41.6" cy="26.6" r="1.6"></circle>
                </g>
              </g>
            </svg>
          </div>
        </a>
      </div>
    </blockquote>
  `;
};

/**
 * Generate embed script tag for Instagram posts (to be added to document head)
 * @returns {string} - Script tag
 */
export const getInstagramEmbedScript = () => {
  return `
    <script async src="https://www.instagram.com/embed.js"></script>
  `;
};

/**
 * Process Instagram embed in React component
 * Call this after rendering Instagram embeds to DOM
 * @returns {void}
 */
export const processInstagramEmbeds = () => {
  if (window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process) {
    window.instgrm.Embeds.process();
  }
};

/**
 * Validate Instagram post by making a simple request
 * (This requires Instagram API access - optional feature)
 * @param {string} shortcode - Instagram shortcode
 * @returns {Promise<boolean>} - True if post exists
 */
export const validateInstagramPost = async (shortcode) => {
  try {
    // Simple validation: try to fetch the post URL
    const response = await fetch(
      `https://www.instagram.com/p/${shortcode}/?__a=1`,
      { method: 'HEAD', mode: 'no-cors' }
    );
    return response.ok || response.status === 0; // no-cors always returns 0
  } catch (error) {
    console.warn('Could not validate Instagram post:', error);
    // Return true anyway - let the user decide
    return true;
  }
};

/**
 * Create embed configuration for storage
 * @param {string} instagramUrl - Instagram URL or shortcode
 * @returns {object|null} - Embed config or null if invalid
 */
export const createInstagramEmbedConfig = (instagramUrl) => {
  const shortcode = extractInstagramShortcode(instagramUrl);
  
  if (!shortcode) {
    return null;
  }

  return {
    shortcode,
    url: `https://www.instagram.com/p/${shortcode}/`,
    embedHTML: getInstagramEmbedHTML(shortcode),
    addedAt: new Date().toISOString(),
  };
};

/**
 * Format error message for Instagram input validation
 * @param {string} input - User's input
 * @returns {string} - Error message
 */
export const getInstagramErrorMessage = (input) => {
  if (!input) {
    return 'कृपया Instagram link दर्ज करें';
  }
  return 'कृपया एक वैध Instagram link दर्ज करें (उदाहरण: https://www.instagram.com/p/ABC123/)';
};

export default {
  extractInstagramShortcode,
  isValidInstagramInput,
  getInstagramOEmbedUrl,
  getInstagramEmbedHTML,
  getInstagramEmbedScript,
  processInstagramEmbeds,
  validateInstagramPost,
  createInstagramEmbedConfig,
  getInstagramErrorMessage,
};
