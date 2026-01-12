/**
 * main.js - Central JavaScript initialization and dependency management
 * 
 * This file ensures proper load order and provides initialization hooks
 * for all JavaScript modules in the application.
 */
(function() {
    'use strict';
    
    // Note: Core dependencies (InlineFieldEditor, TaskFieldSaver, UniverseFieldSaver)
    // and field classes are loaded in the layout before main.js
    
    /**
     * Initialize global registries
     * Now uses StateManager for centralized state management
     */
    function initializeRegistries() {
        // StateManager is already initialized, but ensure registries exist
        // This maintains backward compatibility
        StateManager.ensureInlineFieldEditors();
        StateManager.ensureTaskCardEditors();
        
        Logger.debug('main.js: Registries initialized via StateManager');
    }
    
    /**
     * Main initialization function
     */
    function init() {
        // Initialize registries (via StateManager)
        initializeRegistries();
        
        // Note: Dependencies (InlineFieldEditor, TaskFieldSaver, etc.) are loaded
        // in the layout before main.js, so they're guaranteed to be available
        // StateManager is loaded before main.js, so it's also available
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM is already ready
        init();
    }
    
    // Export initialization function for manual calls if needed
    window.mainInit = init;
})();
