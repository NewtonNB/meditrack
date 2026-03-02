/**
 * CSRF Token Utility
 * Handles CSRF token management and refresh
 */

let csrfRetryCount = 0;
const MAX_CSRF_RETRIES = 3;

/**
 * Get the current CSRF token from the meta tag
 */
export function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

/**
 * Refresh the CSRF token by making a request to get a new one
 */
export async function refreshCsrfToken() {
  try {
    const response = await fetch('/csrf-token', {
      method: 'GET',
      credentials: 'same-origin',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.csrf_token) {
        // Update the meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
          metaTag.setAttribute('content', data.csrf_token);
        }
        return data.csrf_token;
      }
    }
  } catch (error) {
    console.error('Failed to refresh CSRF token:', error);
  }
  return null;
}

/**
 * Make a fetch request with automatic CSRF token handling
 */
export async function fetchWithCsrf(url, options = {}) {
  let token = getCsrfToken();
  
  if (!token) {
    console.warn('CSRF token not found, attempting to refresh...');
    token = await refreshCsrfToken();
  }
  
  if (!token) {
    throw new Error('Unable to obtain CSRF token');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': token,
    ...options.headers,
  };
  
  const requestOptions = {
    credentials: 'same-origin',
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, requestOptions);
    
    // If we get a 419 (CSRF token mismatch), try to refresh and retry
    if (response.status === 419 && csrfRetryCount < MAX_CSRF_RETRIES) {
      csrfRetryCount++;
      console.warn(`CSRF token expired (attempt ${csrfRetryCount}/${MAX_CSRF_RETRIES}), refreshing...`);
      
      const newToken = await refreshCsrfToken();
      if (newToken) {
        // Retry the request with the new token
        requestOptions.headers['X-CSRF-TOKEN'] = newToken;
        const retryResponse = await fetch(url, requestOptions);
        
        if (retryResponse.ok) {
          csrfRetryCount = 0; // Reset on success
        }
        
        return retryResponse;
      }
    } else if (response.ok) {
      csrfRetryCount = 0; // Reset on success
    }
    
    return response;
  } catch (error) {
    // If we've exceeded retry attempts, suggest page refresh
    if (csrfRetryCount >= MAX_CSRF_RETRIES) {
      console.error('Too many CSRF failures, page refresh may be needed');
      // You could dispatch a custom event here to notify the UI
      window.dispatchEvent(new CustomEvent('csrf-failure', { 
        detail: { message: 'Session expired. Please refresh the page.' }
      }));
    }
    throw error;
  }
}

/**
 * Reset the CSRF retry counter
 */
export function resetCsrfRetryCount() {
  csrfRetryCount = 0;
}