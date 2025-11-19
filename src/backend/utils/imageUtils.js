/**
 * Utility functions for handling image URLs, especially Google Drive links
 */

/**
 * Convert Google Drive sharing URL to direct image URL
 * @param {string} url - The original URL
 * @returns {string} - The converted URL for direct image access
 */
const convertGoogleDriveUrl = (url) => {
  if (!url) return url;
  
  // Check if it's a Google Drive URL
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (match) {
    const fileId = match[1];
    // Use thumbnail API which works better for web embedding
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
  }
  
  // Check if it's already a direct Google Drive URL
  if (url.includes('drive.google.com/uc?export=view')) {
    // Convert existing uc URLs to thumbnail format
    const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w400-h300`;
    }
    return url;
  }
  
  // Check if it's already a thumbnail URL
  if (url.includes('drive.google.com/thumbnail')) {
    return url;
  }
  
  // For other URLs, return as is
  return url;
};

/**
 * Validate and process image URL
 * @param {string} url - The image URL to process
 * @returns {string} - The processed URL
 */
const processImageUrl = (url) => {
  if (!url) return null;
  
  try {
    // Convert Google Drive URLs
    const processedUrl = convertGoogleDriveUrl(url);
    
    // Basic URL validation
    new URL(processedUrl);
    
    return processedUrl;
  } catch (error) {
    console.warn(`Invalid image URL: ${url}`, error.message);
    return url; // Return original URL even if invalid, let frontend handle gracefully
  }
};

/**
 * Check if URL is a valid image URL
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL appears to be an image
 */
const isValidImageUrl = (url) => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    
    // Check for Google Drive URLs
    if (urlObj.hostname === 'drive.google.com') {
      return true;
    }
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const pathname = urlObj.pathname.toLowerCase();
    
    return imageExtensions.some(ext => pathname.endsWith(ext)) || 
           pathname.includes('image') || 
           urlObj.searchParams.has('export'); // Google Drive export parameter
  } catch (error) {
    return false;
  }
};

module.exports = {
  convertGoogleDriveUrl,
  processImageUrl,
  isValidImageUrl
};