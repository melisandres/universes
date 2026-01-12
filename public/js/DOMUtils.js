/**
 * DOMUtils - Common DOM manipulation utilities
 * 
 * Provides reusable functions for common DOM operations
 * to reduce code duplication across the codebase.
 * 
 * @class
 */
class DOMUtils {
    /**
     * Extract task ID from an element's data attribute
     * @param {HTMLElement} element - The element with data-task-id
     * @returns {number|null} - The task ID or null if not found
     */
    static getTaskIdFromElement(element) {
        if (!element || !element.dataset || !element.dataset.taskId) {
            return null;
        }
        const taskId = parseInt(element.dataset.taskId, 10);
        return isNaN(taskId) ? null : taskId;
    }

    /**
     * Extract task ID from a task card element (tries multiple sources)
     * Tries: form, edit mode, task name, add universe button
     * @param {HTMLElement|null} taskCard - The task card element
     * @returns {number|null} - The task ID or null if not found
     */
    static extractTaskIdFromCard(taskCard) {
        if (!taskCard) return null;

        // Try form first (most reliable)
        const form = taskCard.querySelector(FieldConstants.SELECTORS.TASK_EDIT_FORM);
        const taskId = this.getTaskIdFromElement(form);
        if (taskId) return taskId;

        // Try edit mode
        const editMode = taskCard.querySelector(FieldConstants.SELECTORS.TASK_EDIT_MODE);
        const taskId2 = this.getTaskIdFromElement(editMode);
        if (taskId2) return taskId2;

        // Try task name
        const taskName = taskCard.querySelector(FieldConstants.SELECTORS.TASK_NAME_CLICKABLE);
        const taskId3 = this.getTaskIdFromElement(taskName);
        if (taskId3) return taskId3;

        // Try add universe button as fallback
        const addBtn = taskCard.querySelector(`.${FieldConstants.CLASSES.ADD_UNIVERSE_BTN}[${FieldConstants.DATA_ATTRIBUTES.TASK_ID}]`);
        const taskId4 = this.getTaskIdFromElement(addBtn);
        if (taskId4) return taskId4;

        Logger.warn('DOMUtils: Could not extract task ID from task card', taskCard);
        return null;
    }

    /**
     * Get CSRF token from meta tag
     * @returns {string|null} - The CSRF token or null if not found
     */
    static getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.content : null;
    }

    /**
     * Find task view element
     * @param {number} taskId - The task ID
     * @param {HTMLElement} scope - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The task view element or null
     */
    static findTaskView(taskId, scope = null) {
        const searchScope = scope || document;
        return searchScope.getElementById(`task-view-${taskId}`);
    }

    /**
     * Find task edit mode element
     * @param {number} taskId - The task ID
     * @param {HTMLElement} scope - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The task edit mode element or null
     */
    static findTaskEditMode(taskId, scope = null) {
        const searchScope = scope || document;
        return searchScope.getElementById(`task-edit-${taskId}`);
    }

    /**
     * Find task edit form
     * @param {number} taskId - The task ID
     * @param {HTMLElement} scope - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The form element or null
     */
    static findTaskEditForm(taskId, scope = null) {
        return FieldUtils.findTaskEditForm(taskId, scope);
    }

    /**
     * Find skip task button
     * @param {number} taskId - The task ID
     * @param {HTMLElement} scope - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The button element or null
     */
    static findSkipTaskButton(taskId, scope = null) {
        const searchScope = scope || document;
        return searchScope.querySelector(
            `.${FieldConstants.CLASSES.SKIP_TASK_BTN}[${FieldConstants.DATA_ATTRIBUTES.TASK_ID}="${taskId}"]`
        );
    }

    /**
     * Find delete task button
     * @param {number} taskId - The task ID
     * @param {HTMLElement} scope - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The button element or null
     */
    static findDeleteTaskButton(taskId, scope = null) {
        const searchScope = scope || document;
        return searchScope.querySelector(
            `.${FieldConstants.CLASSES.DELETE_TASK_BTN}[${FieldConstants.DATA_ATTRIBUTES.TASK_ID}="${taskId}"]`
        );
    }

    /**
     * Safely get an element by ID
     * @param {string} id - The element ID
     * @param {HTMLElement|Document} [scope=document] - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The element or null if not found
     */
    static getElementById(id, scope = null) {
        const searchScope = scope || document;
        return searchScope.getElementById(id);
    }

    /**
     * Safely query selector (returns first match)
     * @param {string} selector - The CSS selector
     * @param {HTMLElement|Document} [scope=document] - Optional scope element (defaults to document)
     * @returns {HTMLElement|null} - The first matching element or null if not found
     */
    static querySelector(selector, scope = null) {
        const searchScope = scope || document;
        return searchScope.querySelector(selector);
    }

    /**
     * Safely query selector all (returns all matches)
     * @param {string} selector - The CSS selector
     * @param {HTMLElement|Document} [scope=document] - Optional scope element (defaults to document)
     * @returns {NodeListOf<HTMLElement>} - The elements (empty NodeList if none found)
     */
    static querySelectorAll(selector, scope = null) {
        const searchScope = scope || document;
        return searchScope.querySelectorAll(selector);
    }

    /**
     * Check if an element exists and is visible
     * @param {HTMLElement|null} element - The element to check
     * @returns {boolean} - True if element exists and is visible (display !== 'none' and visibility !== 'hidden')
     */
    static isVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    /**
     * Show an element (remove d-none class)
     * @param {HTMLElement} element - The element to show
     */
    static show(element) {
        if (!element) return;
        element.classList.remove(FieldConstants.CLASSES.D_NONE);
    }

    /**
     * Hide an element (add d-none class)
     * @param {HTMLElement} element - The element to hide
     */
    static hide(element) {
        if (!element) return;
        element.classList.add(FieldConstants.CLASSES.D_NONE);
    }

    /**
     * Toggle element visibility
     * @param {HTMLElement} element - The element to toggle
     * @param {boolean} force - Optional: force show (true) or hide (false)
     * @returns {boolean} - True if element is now visible
     */
    static toggle(element, force = null) {
        if (!element) return false;
        
        if (force === true) {
            this.show(element);
            return true;
        } else if (force === false) {
            this.hide(element);
            return false;
        } else {
            const isHidden = element.classList.contains(FieldConstants.CLASSES.D_NONE);
            if (isHidden) {
                this.show(element);
                return true;
            } else {
                this.hide(element);
                return false;
            }
        }
    }
}

// Expose to window
window.DOMUtils = DOMUtils;
