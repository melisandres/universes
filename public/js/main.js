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
     */
    function initializeRegistries() {
        // Initialize inline field editors registry if it doesn't exist
        if (!window.inlineFieldEditors) {
            window.inlineFieldEditors = {};
        }
        
        // Initialize task card editors registry if it doesn't exist
        if (!window.taskCardEditors) {
            window.taskCardEditors = {};
        }
    }
    
    /**
     * Main initialization function
     */
    function init() {
        // Initialize registries
        initializeRegistries();
        
        // Note: Dependencies (InlineFieldEditor, TaskFieldSaver, etc.) are loaded
        // in the layout before main.js, so they're guaranteed to be available
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
