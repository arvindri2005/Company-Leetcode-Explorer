/**
 * @fileoverview URL utility functions for security and validation.
 */

/**
 * @function isValidRedirectUrl
 * @description Validates if a URL is safe for redirection (internal relative URL).
 * Prevents Open Redirect vulnerabilities by ensuring the URL starts with '/' 
 * and is not a protocol-relative URL ('//').
 * 
 * @param {string | null | undefined} url - The URL to validate
 * @returns {boolean} True if the URL is a safe relative path, false otherwise
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) {return false;}
  
  // Ensure it's a string
  if (typeof url !== 'string') {return false;}

  // Must start with /
  if (!url.startsWith('/')) {return false;}

  // Must NOT start with // (protocol relative)
  if (url.startsWith('//')) {return false;}

  // Must NOT contain \ (backslash) which can be used to bypass checks in some browsers
  if (url.includes('\\')) {return false;}
  
  // Check for control characters
   
  if (/[\x00-\x1F\x7F]/.test(url)) {return false;}

  return true;
}
