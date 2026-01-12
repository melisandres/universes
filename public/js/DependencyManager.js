/**
 * DependencyManager - Manages dependency readiness checks
 * 
 * Replaces arbitrary setTimeout delays with proper dependency checking.
 * This ensures code runs when dependencies are actually ready, not after
 * arbitrary time delays.
 */
class DependencyManager {
    static dependencies = new Map();
    
    /**
     * Register a dependency that needs to be checked
     * @param {string} name - Name of the dependency
     * @param {Function} checkFn - Function that returns true when dependency is ready
     */
    static register(name, checkFn) {
        this.dependencies.set(name, { 
            ready: false, 
            checkFn: checkFn,
            lastCheck: 0
        });
    }
    
    /**
     * Check if a dependency is ready
     * @param {string} name - Name of the dependency
     * @returns {boolean} - True if ready, false otherwise
     */
    static isReady(name) {
        const dep = this.dependencies.get(name);
        if (!dep) {
            Logger.warn('DependencyManager: Dependency not registered', name);
            return false;
        }
        
        // Check if ready (with caching for 100ms to avoid excessive checks)
        const now = Date.now();
        if (now - dep.lastCheck < 100) {
            return dep.ready;
        }
        
        dep.lastCheck = now;
        dep.ready = dep.checkFn();
        return dep.ready;
    }
    
    /**
     * Wait for a dependency to be ready
     * @param {string} name - Name of the dependency
     * @param {number} timeout - Maximum time to wait in ms (default 5000)
     * @param {number} interval - Check interval in ms (default 50)
     * @returns {Promise<boolean>} - True if ready, false if timeout
     */
    static async waitFor(name, timeout = 5000, interval = 50) {
        const dep = this.dependencies.get(name);
        if (!dep) {
            Logger.warn('DependencyManager: Dependency not registered', name);
            return false;
        }
        
        // If already ready, return immediately
        if (this.isReady(name)) {
            return true;
        }
        
        const start = Date.now();
        while ((Date.now() - start) < timeout) {
            if (this.isReady(name)) {
                Logger.debug('DependencyManager: Dependency ready', { name, waited: Date.now() - start });
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        Logger.warn('DependencyManager: Dependency timeout', { name, timeout });
        return false;
    }
    
    /**
     * Wait for multiple dependencies
     * @param {string[]} names - Array of dependency names
     * @param {number} timeout - Maximum time to wait in ms
     * @returns {Promise<boolean>} - True if all ready, false if timeout
     */
    static async waitForAll(names, timeout = 5000) {
        const results = await Promise.all(
            names.map(name => this.waitFor(name, timeout))
        );
        return results.every(result => result === true);
    }
}

// Register common dependencies
DependencyManager.register('inlineFieldEditors', () => {
    return typeof window.inlineFieldEditors !== 'undefined';
});

DependencyManager.register('inlineFieldEditorClass', () => {
    return typeof window.InlineFieldEditor !== 'undefined' || 
           typeof InlineFieldEditor !== 'undefined';
});

DependencyManager.register('taskFieldSaver', () => {
    return typeof window.TaskFieldSaver !== 'undefined';
});

DependencyManager.register('fieldClasses', () => {
    return typeof window.InlineUniversesField !== 'undefined' &&
           typeof window.InlineDeadlineField !== 'undefined' &&
           typeof window.InlineEstimatedTimeField !== 'undefined' &&
           typeof window.InlineRecurringTaskField !== 'undefined';
});

DependencyManager.register('taskCardEditor', () => {
    return typeof window.TaskCardEditor !== 'undefined' || 
           typeof TaskCardEditor !== 'undefined';
});

// Expose to window
window.DependencyManager = DependencyManager;
