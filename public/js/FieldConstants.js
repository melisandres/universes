/**
 * FieldConstants - Centralized constants for field names, IDs, classes, and selectors
 * 
 * Eliminates magic strings throughout the codebase by providing
 * a single source of truth for all field-related constants.
 */
class FieldConstants {
    // Field name constants (used in forms and API)
    static FIELD_NAMES = {
        NAME: 'name',
        DESCRIPTION: 'description',
        UNIVERSE_IDS: 'universe_ids',
        ESTIMATED_TIME: 'estimated_time',
        DEADLINE_AT: 'deadline_at',
        RECURRING_TASK_ID: 'recurring_task_id',
        STATUS: 'status',
        TIME_UNIT: 'time_unit'
    };

    // Field ID prefixes (used to generate field IDs)
    static FIELD_ID_PREFIXES = {
        TASK_NAME: 'task-name',
        TASK_DESCRIPTION: 'task-description',
        UNIVERSES: 'universes',
        ESTIMATED_TIME: 'estimated-time',
        DEADLINE: 'deadline',
        RECURRING_TASK: 'recurring-task',
        LOG_TIME: 'log-time'
    };

    // Element ID prefixes (used to generate element IDs)
    static ELEMENT_ID_PREFIXES = {
        INLINE_VIEW: 'inline-view',
        INLINE_EDIT: 'inline-edit',
        INPUT: 'input',
        UNIVERSES_CONTAINER: 'universes-container',
        UNIVERSES_DATA: 'universes-data',
        RECURRING_TASK_SELECT: 'recurring-task-select',
        LOG_MINUTES: 'log-minutes',
        LOG_TIME_UNIT_MINUTES: 'log-time-unit-minutes',
        LOG_TIME_UNIT_HOURS: 'log-time-unit-hours',
        TIME_UNIT_MINUTES: 'time-unit-minutes',
        TIME_UNIT_HOURS: 'time-unit-hours'
    };

    // CSS class names
    static CLASSES = {
        // Task card classes
        TASK_ITEM: 'task-item',
        TASK_VIEW: 'task-view',
        TASK_EDIT_MODE: 'task-edit-mode',
        TASK_EDIT_FORM: 'task-edit-form-simple',
        TASK_NAME_CLICKABLE: 'task-name-clickable',
        TASK_CLOSE_EDIT_BTN: 'task-close-edit-btn',
        TASK_LOG_FORM: 'task-log-form',
        
        // Inline field classes
        INLINE_EDITABLE_FIELD: 'inline-editable-field',
        INLINE_FIELD_VIEW: 'inline-field-view',
        INLINE_FIELD_EDIT: 'inline-field-edit',
        INLINE_FIELD_VALUE: 'inline-field-value',
        INLINE_FIELD_INPUT: 'inline-field-input',
        INLINE_FIELD_LABEL: 'inline-field-label',
        INLINE_FIELD_LABEL_ROW: 'inline-field-label-row',
        INLINE_FIELD_EDIT_BTN: 'inline-field-edit-btn',
        INLINE_FIELD_SAVE_BTN: 'inline-field-save-btn',
        INLINE_FIELD_ACTIONS: 'inline-field-actions',
        
        // Universe field classes
        UNIVERSE_ITEM_ROW: 'universe-item-row',
        INLINE_UNIVERSE_ITEM_ROW: 'inline-universe-item-row',
        UNIVERSE_SELECT: 'universe-select',
        INLINE_UNIVERSE_SELECT: 'inline-universe-select',
        INLINE_UNIVERSE_PRIMARY_LABEL: 'inline-universe-primary-label',
        ADD_UNIVERSE_BTN: 'add-universe-btn',
        INLINE_UNIVERSE_ADD_BTN: 'inline-universe-add-btn',
        REMOVE_UNIVERSE_BTN: 'remove-universe-btn',
        INLINE_UNIVERSE_REMOVE_BTN: 'inline-universe-remove-btn',
        
        // Time field classes
        INLINE_FIELD_TIME_CONTAINER: 'inline-field-time-container',
        INLINE_FIELD_TIME_INPUT: 'inline-field-time-input',
        INLINE_FIELD_UNIT_SELECTOR: 'inline-field-unit-selector',
        INLINE_FIELD_RADIO_LABEL: 'inline-field-radio-label',
        
        // Deadline field classes
        INLINE_FIELD_DEADLINE_CONTAINER: 'inline-field-deadline-container',
        INLINE_FIELD_DEADLINE_INPUT: 'inline-field-deadline-input',
        BTN_TODAY: 'btn-today',
        
        // Task action classes
        SKIP_TASK_BTN: 'skip-task-btn',
        DELETE_TASK_BTN: 'delete-task-btn',
        COMPLETE_TASK_CHECKBOX: 'complete-task-checkbox',
        
        // Add task card classes
        ADD_TASK_CARD: 'add-task-card',
        ADD_TASK_ICON: 'add-task-icon',
        ADD_TASK_NAME: 'add-task-name',
        
        // Utility classes
        D_NONE: 'd-none'
    };

    // Data attribute names
    static DATA_ATTRIBUTES = {
        FIELD_ID: 'data-field-id',
        TASK_ID: 'data-task-id',
        UNIVERSE_ID: 'data-universe-id',
        NO_AUTO_INIT: 'data-no-auto-init',
        IS_RECURRING: 'data-is-recurring',
        IS_COMPLETED: 'data-is-completed',
        IS_SKIPPED: 'data-is-skipped',
        ORIGINAL_MINUTES: 'data-original-minutes',
        STORED_MINUTES: 'data-stored-minutes'
    };

    // Selector patterns (for building selectors)
    static SELECTORS = {
        // Task card selectors
        TASK_EDIT_FORM: '.task-edit-form-simple[data-task-id]',
        TASK_EDIT_MODE: '.task-edit-mode[data-task-id]',
        TASK_NAME_CLICKABLE: '.task-name-clickable[data-task-id]',
        TASK_LOG_FORM: '.task-log-form',
        
        // Inline field selectors
        INLINE_EDITABLE_FIELD: '.inline-editable-field[data-field-id]',
        INLINE_FIELD_EDIT: '.inline-field-edit',
        INLINE_FIELD_VALUE: '.inline-field-value',
        INLINE_FIELD_EDIT_BTN: '.inline-field-edit-btn[data-field-id]',
        INLINE_FIELD_SAVE_BTN: '.inline-field-save-btn[data-field-id]',
        
        // Universe field selectors
        ADD_UNIVERSE_BTN: '.add-universe-btn',
        INLINE_UNIVERSE_ADD_BTN: '.inline-universe-add-btn',
        
        // Task action selectors
        SKIP_TASK_BTN: '.skip-task-btn[data-task-id]',
        DELETE_TASK_BTN: '.delete-task-btn[data-task-id]',
        COMPLETE_TASK_CHECKBOX: '.complete-task-checkbox[data-task-id]'
    };
}

// Expose to window
window.FieldConstants = FieldConstants;
