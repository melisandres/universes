/**
 * ErrorHandler - Centralized error handling utility
 * 
 * Provides consistent error handling across the application:
 * - Network errors
 * - Validation errors (Laravel 422 responses)
 * - Server errors
 * - JSON parsing errors
 * - User-friendly error messages
 * 
 * @class
 */
class ErrorHandler {
    /**
     * Handle a fetch response error
     * @param {Response} response - The fetch response object
     * @param {Object} options - Options for error handling
     * @param {string} options.defaultMessage - Default error message
     * @param {boolean} options.showAlert - Whether to show alert (default: true)
     * @param {Function} options.onError - Optional callback for custom error handling
     * @returns {Promise<{success: boolean, data: any, error: string|null}>}
     */
    static async handleResponse(response, options = {}) {
        const {
            defaultMessage = 'An error occurred',
            showAlert = true,
            onError = null
        } = options;

        // Check for redirects (shouldn't happen with AJAX)
        if (response.redirected) {
            const error = 'Server returned redirect instead of JSON. This may indicate a session or authentication issue.';
            Logger.error('ErrorHandler: Server redirect', { url: response.url });
            
            if (onError) {
                onError(error);
            } else if (showAlert) {
                alert('Error: ' + error);
            }
            
            return { success: false, data: null, error };
        }

        // Try to parse JSON response
        let data = {};
        let parseError = null;
        
        try {
            const contentType = response.headers.get('Content-Type') || '';
            const text = await response.text();
            
            if (text && contentType.includes('application/json')) {
                data = JSON.parse(text);
            } else if (text && !contentType.includes('application/json')) {
                // Server returned HTML instead of JSON
                const error = 'Server returned HTML instead of JSON. The request may have been processed. Please refresh the page.';
                Logger.error('ErrorHandler: Non-JSON response', { 
                    contentType, 
                    status: response.status,
                    url: response.url 
                });
                
                if (onError) {
                    onError(error);
                } else if (showAlert) {
                    alert('Error: ' + error);
                }
                
                return { success: false, data: null, error };
            }
        } catch (error) {
            parseError = error;
            Logger.error('ErrorHandler: JSON parse error', { 
                error: error.message,
                status: response.status,
                url: response.url 
            });
        }

        // Handle non-OK responses
        if (!response.ok) {
            const error = this.extractErrorMessage(data, response.status, defaultMessage);
            
            Logger.error('ErrorHandler: Request failed', {
                status: response.status,
                statusText: response.statusText,
                error,
                url: response.url
            });
            
            if (onError) {
                onError(error, response.status, data);
            } else if (showAlert) {
                alert('Error: ' + error);
            }
            
            return { success: false, data, error };
        }

        // Success case
        return { success: true, data, error: null };
    }

    /**
     * Handle a fetch error (network error, etc.)
     * @param {Error} error - The error object
     * @param {Object} options - Options for error handling
     * @param {string} options.defaultMessage - Default error message
     * @param {boolean} options.showAlert - Whether to show alert (default: true)
     * @param {Function} options.onError - Optional callback for custom error handling
     * @returns {{success: boolean, error: string}}
     */
    static handleFetchError(error, options = {}) {
        const {
            defaultMessage = 'Network error. Please check your connection and try again.',
            showAlert = true,
            onError = null
        } = options;

        const errorMessage = error.message || defaultMessage;
        
        Logger.error('ErrorHandler: Fetch error', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        if (onError) {
            onError(errorMessage, error);
        } else if (showAlert) {
            alert('Error: ' + errorMessage);
        }

        return { success: false, error: errorMessage };
    }

    /**
     * Extract error message from response data
     * @param {Object} data - Response data
     * @param {number} status - HTTP status code
     * @param {string} defaultMessage - Default message if no error found
     * @returns {string} - Error message
     */
    static extractErrorMessage(data, status, defaultMessage) {
        // Laravel validation errors (422)
        if (status === 422 && data.errors) {
            const errors = Object.values(data.errors).flat();
            return errors.join('\n');
        }

        // Generic error message
        if (data.message) {
            return data.message;
        }

        // Status-specific messages
        switch (status) {
            case 401:
                return 'Authentication required. Please log in.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'Resource not found.';
            case 422:
                return 'Validation error. Please check your input.';
            case 429:
                return 'Too many requests. Please try again later.';
            case 500:
                return 'Server error. Please try again later.';
            case 503:
                return 'Service unavailable. Please try again later.';
            default:
                return defaultMessage;
        }
    }

    /**
     * Handle an error from a try-catch block
     * @param {Error} error - The error object
     * @param {Object} options - Options for error handling
     * @param {string} options.context - Context for the error (e.g., 'saving task')
     * @param {boolean} options.showAlert - Whether to show alert (default: true)
     * @param {Function} options.onError - Optional callback for custom error handling
     * @returns {{success: boolean, error: string}}
     */
    static handleError(error, options = {}) {
        const {
            context = 'operation',
            showAlert = true,
            onError = null
        } = options;

        const errorMessage = error.message || `Error during ${context}`;
        
        Logger.error(`ErrorHandler: Error during ${context}`, {
            message: error.message,
            name: error.name,
            stack: error.stack,
            context
        });

        if (onError) {
            onError(errorMessage, error);
        } else if (showAlert) {
            alert(`Error: ${errorMessage}`);
        }

        return { success: false, error: errorMessage };
    }

    /**
     * Wrap a fetch call with error handling
     * @param {Promise<Response>} fetchPromise - The fetch promise
     * @param {Object} options - Options for error handling
     * @returns {Promise<{success: boolean, data: any, error: string|null}>}
     */
    static async handleFetch(fetchPromise, options = {}) {
        try {
            const response = await fetchPromise;
            return await this.handleResponse(response, options);
        } catch (error) {
            return this.handleFetchError(error, options);
        }
    }
}

// Expose to window
window.ErrorHandler = ErrorHandler;
