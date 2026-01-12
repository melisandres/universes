/**
 * FieldUtils - Utility functions for working with field IDs, selectors, and elements
 * 
 * Provides helper functions to generate field IDs, selectors, and find elements
 * using the constants from FieldConstants.
 * 
 * @class
 */
class FieldUtils {
    /**
     * Generate a field ID for a task field
     * @param {string} fieldPrefix - Field prefix (from FieldConstants.FIELD_ID_PREFIXES)
     * @param {number} taskId - The task ID
     * @returns {string} - The field ID in format "{fieldPrefix}-{taskId}"
     */
    static getFieldId(fieldPrefix, taskId) {
        return `${fieldPrefix}-${taskId}`;
    }

    /**
     * Generate an element ID
     * @param {string} elementPrefix - Element prefix (from FieldConstants.ELEMENT_ID_PREFIXES)
     * @param {string} fieldId - The field ID
     * @returns {string} - The element ID in format "{elementPrefix}-{fieldId}"
     */
    static getElementId(elementPrefix, fieldId) {
        return `${elementPrefix}-${fieldId}`;
    }

    /**
     * Get field ID for task name
     * @param {number} taskId - The task ID
     * @returns {string} - The field ID
     */
    static getTaskNameFieldId(taskId) {
        return this.getFieldId(FieldConstants.FIELD_ID_PREFIXES.TASK_NAME, taskId);
    }

    /**
     * Get field ID for task description
     * @param {number} taskId - The task ID
     * @returns {string} - The field ID
     */
    static getTaskDescriptionFieldId(taskId) {
        return this.getFieldId(FieldConstants.FIELD_ID_PREFIXES.TASK_DESCRIPTION, taskId);
    }

    /**
     * Get field ID for universes
     * @param {number} taskId - The task ID
     * @returns {string} - The field ID
     */
    static getUniversesFieldId(taskId) {
        return this.getFieldId(FieldConstants.FIELD_ID_PREFIXES.UNIVERSES, taskId);
    }

    /**
     * Get field ID for estimated time
     * @param {number} taskId - The task ID
     * @returns {string} - The field ID
     */
    static getEstimatedTimeFieldId(taskId) {
        return this.getFieldId(FieldConstants.FIELD_ID_PREFIXES.ESTIMATED_TIME, taskId);
    }

    /**
     * Get field ID for deadline
     * @param {number} taskId - The task ID
     * @returns {string} - The field ID
     */
    static getDeadlineFieldId(taskId) {
        return this.getFieldId(FieldConstants.FIELD_ID_PREFIXES.DEADLINE, taskId);
    }

    /**
     * Get field ID for recurring task
     * @param {number} taskId - The task ID
     * @returns {string} - The field ID
     */
    static getRecurringTaskFieldId(taskId) {
        return this.getFieldId(FieldConstants.FIELD_ID_PREFIXES.RECURRING_TASK, taskId);
    }

    /**
     * Get field ID for log time
     * @param {number} taskId - The task ID
     * @returns {string} - The field ID
     */
    static getLogTimeFieldId(taskId) {
        return this.getFieldId(FieldConstants.FIELD_ID_PREFIXES.LOG_TIME, taskId);
    }

    /**
     * Get inline view element ID
     * @param {string} fieldId - The field ID
     * @returns {string} - The element ID
     */
    static getInlineViewId(fieldId) {
        return this.getElementId(FieldConstants.ELEMENT_ID_PREFIXES.INLINE_VIEW, fieldId);
    }

    /**
     * Get inline edit element ID
     * @param {string} fieldId - The field ID
     * @returns {string} - The element ID
     */
    static getInlineEditId(fieldId) {
        return this.getElementId(FieldConstants.ELEMENT_ID_PREFIXES.INLINE_EDIT, fieldId);
    }

    /**
     * Get input element ID
     * @param {string} fieldId - The field ID
     * @returns {string} - The element ID
     */
    static getInputId(fieldId) {
        return this.getElementId(FieldConstants.ELEMENT_ID_PREFIXES.INPUT, fieldId);
    }

    /**
     * Get universes container ID
     * @param {number} taskId - The task ID
     * @returns {string} - The element ID
     */
    static getUniversesContainerId(taskId) {
        return `${FieldConstants.ELEMENT_ID_PREFIXES.UNIVERSES_CONTAINER}-${taskId}`;
    }

    /**
     * Get universes data ID
     * @param {number} taskId - The task ID
     * @returns {string} - The element ID
     */
    static getUniversesDataId(taskId) {
        return `${FieldConstants.ELEMENT_ID_PREFIXES.UNIVERSES_DATA}-${taskId}`;
    }

    /**
     * Get recurring task select ID
     * @param {number} taskId - The task ID
     * @returns {string} - The element ID
     */
    static getRecurringTaskSelectId(taskId) {
        return `${FieldConstants.ELEMENT_ID_PREFIXES.RECURRING_TASK_SELECT}-${taskId}`;
    }

    /**
     * Get time unit radio ID (minutes)
     * @param {string} fieldId - The field ID
     * @returns {string} - The element ID
     */
    static getTimeUnitMinutesId(fieldId) {
        return `${FieldConstants.ELEMENT_ID_PREFIXES.TIME_UNIT_MINUTES}-${fieldId}`;
    }

    /**
     * Get time unit radio ID (hours)
     * @param {string} fieldId - The field ID
     * @returns {string} - The element ID
     */
    static getTimeUnitHoursId(fieldId) {
        return `${FieldConstants.ELEMENT_ID_PREFIXES.TIME_UNIT_HOURS}-${fieldId}`;
    }

    /**
     * Find a field element by field ID
     * @param {string} fieldId - The field ID
     * @param {HTMLElement} scope - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The field element or null
     */
    static findFieldElement(fieldId, scope = null) {
        const searchScope = scope || document;
        return searchScope.querySelector(
            `[${FieldConstants.DATA_ATTRIBUTES.FIELD_ID}="${fieldId}"]`
        );
    }

    /**
     * Find task edit form
     * @param {number} taskId - The task ID
     * @param {HTMLElement} scope - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The form element or null
     */
    static findTaskEditForm(taskId, scope = null) {
        const searchScope = scope || document;
        return searchScope.querySelector(
            `.${FieldConstants.CLASSES.TASK_EDIT_FORM}[${FieldConstants.DATA_ATTRIBUTES.TASK_ID}="${taskId}"]`
        );
    }

    /**
     * Find task name element
     * @param {number} taskId - The task ID
     * @param {HTMLElement} scope - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The element or null
     */
    static findTaskNameElement(taskId, scope = null) {
        const searchScope = scope || document;
        return searchScope.querySelector(
            `.${FieldConstants.CLASSES.TASK_NAME_CLICKABLE}[${FieldConstants.DATA_ATTRIBUTES.TASK_ID}="${taskId}"]`
        );
    }

    /**
     * Get selector for a field by field ID
     * @param {string} fieldId - The field ID
     * @returns {string} - The selector
     */
    static getFieldSelector(fieldId) {
        return `[${FieldConstants.DATA_ATTRIBUTES.FIELD_ID}="${fieldId}"]`;
    }

    /**
     * Get selector for a task by task ID
     * @param {number} taskId - The task ID
     * @returns {string} - The selector
     */
    static getTaskSelector(taskId) {
        return `[${FieldConstants.DATA_ATTRIBUTES.TASK_ID}="${taskId}"]`;
    }
}

// Expose to window
window.FieldUtils = FieldUtils;
