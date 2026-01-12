/**
 * StateManager - Centralized global state management
 * 
 * Provides a single source of truth for all global application state,
 * replacing scattered window.* assignments with a unified API.
 * 
 * @class
 */
class StateManager {
    /**
     * Initialize all global state
     * @returns {void}
     */
    static init() {
        // Editor registries
        this.registries = {
            inlineFieldEditors: {},
            taskCardEditors: {}
        };

        // Application state
        this.app = {
            env: window.APP_ENV || 'production',
            debug: window.DEBUG || false
        };

        // Instance references
        this.instances = {
            addTaskCardManager: null
        };

        // Diagnostics (only in development)
        if (this.app.env === 'local' || this.app.env === 'development') {
            this.diagnostics = {
                initializedClasses: {},
                eventListeners: {},
                buttonClicks: [],
                saveCalls: [],
                displayUpdates: []
            };
        }

        Logger.debug('StateManager: Initialized', {
            env: this.app.env,
            hasDiagnostics: !!this.diagnostics
        });
    }

    /**
     * Get inline field editor registry
     * @returns {Object<string, InlineFieldEditor>} - Registry of inline field editors keyed by fieldId
     */
    static getInlineFieldEditors() {
        return this.registries.inlineFieldEditors;
    }

    /**
     * Get or create inline field editor registry
     * @returns {Object<string, InlineFieldEditor>} - Registry of inline field editors keyed by fieldId
     */
    static ensureInlineFieldEditors() {
        if (!this.registries.inlineFieldEditors) {
            this.registries.inlineFieldEditors = {};
        }
        return this.registries.inlineFieldEditors;
    }

    /**
     * Register an inline field editor
     * @param {string} fieldId - The field ID (e.g., 'task-name-123')
     * @param {InlineFieldEditor} editor - The editor instance
     * @returns {void}
     */
    static registerInlineFieldEditor(fieldId, editor) {
        this.ensureInlineFieldEditors();
        this.registries.inlineFieldEditors[fieldId] = editor;
        Logger.debug('StateManager: Registered inline field editor', fieldId);
    }

    /**
     * Get an inline field editor
     * @param {string} fieldId - The field ID
     * @returns {InlineFieldEditor|null} - The editor instance or null
     */
    static getInlineFieldEditor(fieldId) {
        return this.registries.inlineFieldEditors?.[fieldId] || null;
    }

    /**
     * Unregister an inline field editor
     * @param {string} fieldId - The field ID
     */
    static unregisterInlineFieldEditor(fieldId) {
        if (this.registries.inlineFieldEditors && this.registries.inlineFieldEditors[fieldId]) {
            delete this.registries.inlineFieldEditors[fieldId];
            Logger.debug('StateManager: Unregistered inline field editor', fieldId);
        }
    }

    /**
     * Get task card editor registry
     * @returns {Object<number, TaskCardEditor>} - Registry of task card editors keyed by taskId
     */
    static getTaskCardEditors() {
        return this.registries.taskCardEditors;
    }

    /**
     * Get or create task card editor registry
     * @returns {Object<number, TaskCardEditor>} - Registry of task card editors keyed by taskId
     */
    static ensureTaskCardEditors() {
        if (!this.registries.taskCardEditors) {
            this.registries.taskCardEditors = {};
        }
        return this.registries.taskCardEditors;
    }

    /**
     * Register a task card editor
     * @param {number} taskId - The task ID
     * @param {TaskCardEditor} editor - The editor instance
     * @returns {void}
     */
    static registerTaskCardEditor(taskId, editor) {
        this.ensureTaskCardEditors();
        this.registries.taskCardEditors[taskId] = editor;
        Logger.debug('StateManager: Registered task card editor', taskId);
    }

    /**
     * Get a task card editor
     * @param {number} taskId - The task ID
     * @returns {TaskCardEditor|null} - The editor instance or null
     */
    static getTaskCardEditor(taskId) {
        return this.registries.taskCardEditors?.[taskId] || null;
    }

    /**
     * Unregister a task card editor
     * @param {number} taskId - The task ID
     */
    static unregisterTaskCardEditor(taskId) {
        if (this.registries.taskCardEditors && this.registries.taskCardEditors[taskId]) {
            delete this.registries.taskCardEditors[taskId];
            Logger.debug('StateManager: Unregistered task card editor', taskId);
        }
    }

    /**
     * Get application environment
     * @returns {'local'|'development'|'production'|string} - The environment
     */
    static getEnv() {
        return this.app.env;
    }

    /**
     * Check if in debug mode
     * @returns {boolean} - True if in debug mode
     */
    static isDebug() {
        return this.app.debug || this.app.env === 'local' || this.app.env === 'development';
    }

    /**
     * Get diagnostics object (only in development)
     * @returns {Object|null} - Diagnostics object or null if not in development
     * @property {Object<string, Object>} diagnostics.initializedClasses - Tracked class initializations
     * @property {Object<string, Array>} diagnostics.eventListeners - Tracked event listeners
     * @property {Array} diagnostics.buttonClicks - Tracked button clicks
     * @property {Array} diagnostics.saveCalls - Tracked save calls
     * @property {Array} diagnostics.displayUpdates - Tracked display updates
     */
    static getDiagnostics() {
        return this.diagnostics || null;
    }

    /**
     * Set AddTaskCardManager instance
     * @param {AddTaskCardManager} instance - The instance
     * @returns {void}
     */
    static setAddTaskCardManager(instance) {
        this.instances.addTaskCardManager = instance;
        Logger.debug('StateManager: Set AddTaskCardManager instance');
    }

    /**
     * Get AddTaskCardManager instance
     * @returns {AddTaskCardManager|null} - The instance or null
     */
    static getAddTaskCardManager() {
        return this.instances.addTaskCardManager;
    }

    /**
     * Cleanup all state (for testing or page unload)
     */
    static cleanup() {
        // Cleanup all editors
        if (this.registries.inlineFieldEditors) {
            Object.values(this.registries.inlineFieldEditors).forEach(editor => {
                if (editor && typeof editor.destroy === 'function') {
                    editor.destroy();
                }
            });
            this.registries.inlineFieldEditors = {};
        }

        if (this.registries.taskCardEditors) {
            Object.values(this.registries.taskCardEditors).forEach(editor => {
                if (editor && typeof editor.destroy === 'function') {
                    editor.destroy();
                }
            });
            this.registries.taskCardEditors = {};
        }

        // Clear instances
        this.instances.addTaskCardManager = null;

        // Clear diagnostics
        if (this.diagnostics) {
            this.diagnostics = {
                initializedClasses: {},
                eventListeners: {},
                buttonClicks: [],
                saveCalls: [],
                displayUpdates: []
            };
        }

        Logger.debug('StateManager: Cleaned up all state');
    }

    /**
     * Get state summary (for debugging)
     * @returns {Object} - Summary of current state
     */
    static getSummary() {
        return {
            env: this.app.env,
            debug: this.isDebug(),
            registries: {
                inlineFieldEditors: Object.keys(this.registries.inlineFieldEditors || {}).length,
                taskCardEditors: Object.keys(this.registries.taskCardEditors || {}).length
            },
            instances: {
                addTaskCardManager: !!this.instances.addTaskCardManager
            },
            hasDiagnostics: !!this.diagnostics
        };
    }
}

// Initialize on load
StateManager.init();

// Expose to window for backward compatibility and global access
// This allows existing code to continue working while we migrate
window.StateManager = StateManager;

// Maintain backward compatibility with existing window.* assignments
// These will be gradually replaced with StateManager calls
if (typeof window.inlineFieldEditors === 'undefined') {
    Object.defineProperty(window, 'inlineFieldEditors', {
        get() {
            return StateManager.getInlineFieldEditors();
        },
        set(value) {
            // Allow direct assignment for backward compatibility
            StateManager.registries.inlineFieldEditors = value || {};
        },
        configurable: true
    });
}

if (typeof window.taskCardEditors === 'undefined') {
    Object.defineProperty(window, 'taskCardEditors', {
        get() {
            return StateManager.getTaskCardEditors();
        },
        set(value) {
            // Allow direct assignment for backward compatibility
            StateManager.registries.taskCardEditors = value || {};
        },
        configurable: true
    });
}

if (typeof window.diagnostics === 'undefined' && StateManager.getDiagnostics()) {
    Object.defineProperty(window, 'diagnostics', {
        get() {
            return StateManager.getDiagnostics();
        },
        configurable: true
    });
}
