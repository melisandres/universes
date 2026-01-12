/**
 * Logger - Centralized logging utility with environment-based gating
 * 
 * Provides consistent logging interface with automatic filtering
 * of debug logs in production environments.
 */
class Logger {
    /**
     * Determine if we're in debug mode
     * Checks for Laravel APP_ENV or explicit debug flag
     */
    static get isDebug() {
        // Check for Laravel environment variable (set in Blade template)
        if (typeof window.APP_ENV !== 'undefined') {
            return window.APP_ENV === 'local' || window.APP_ENV === 'development';
        }
        
        // Fallback: check for explicit debug flag
        if (typeof window.DEBUG !== 'undefined') {
            return window.DEBUG === true;
        }
        
        // Default: assume production (no debug logs)
        return false;
    }
    
    /**
     * Log debug messages (only in development)
     * @param {...any} args - Arguments to log
     */
    static debug(...args) {
        if (this.isDebug) {
            console.log(...args);
        }
    }
    
    /**
     * Log info messages (always shown)
     * @param {...any} args - Arguments to log
     */
    static info(...args) {
        console.info(...args);
    }
    
    /**
     * Log warning messages (always shown)
     * @param {...any} args - Arguments to log
     */
    static warn(...args) {
        console.warn(...args);
    }
    
    /**
     * Log error messages (always shown)
     * @param {...any} args - Arguments to log
     */
    static error(...args) {
        console.error(...args);
    }
    
    /**
     * Log with emoji prefix (for visual debugging)
     * Only in debug mode
     * @param {string} emoji - Emoji to prefix
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    static debugWithEmoji(emoji, message, ...args) {
        if (this.isDebug) {
            console.log(emoji, message, ...args);
        }
    }
}

// Expose to window for global access
window.Logger = Logger;
